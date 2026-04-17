const Message = require('../models/Message');
const UserProgress = require('../models/UserProgress');
const FlowStep = require('../models/FlowStep');
const Flow = require('../models/Flow');
const User = require('../models/User');
const sendPushNotification = require('../utils/pushNotification');
const { injectVariables } = require('../utils/stringUtils');

// @desc    Get all messages for a specific user
// @route   GET /api/messages/:userId
// @access  Private
const getMessages = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Check if the requester is the user or an admin
        if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const messages = await Message.find({
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ]
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
    try {
        const { receiverId, text, isBotResponse } = req.body;
        let { actionNextStep } = req.body;
        const senderId = req.user._id;

        const message = await Message.create({
            senderId,
            receiverId,
            text,
            isBotResponse: isBotResponse || false
        });

        // Send push notification to receiver
        if (receiverId) {
            const receiver = await User.findById(receiverId);
            if (receiver) {
                await sendPushNotification(receiver, {
                    title: `New Message from ${req.user.name}`,
                    body: text
                });
            }
        } else if (req.user.role === 'user') {
            // If user sends to admin (receiverId is null/admin)
            const admin = await User.findOne({ role: 'admin' });
            if (admin) {
                await sendPushNotification(admin, {
                    title: `New Message from ${req.user.name}`,
                    body: text
                });
            }
        }

        let botResponse = null;
        let userForInjection = req.user;

        if (!receiverId && (req.user.role === 'user' || req.body.previewFlowId) && !isBotResponse) {
            // Find Active Flow or Preview Flow
            const flowIdToUse = req.body.previewFlowId;
            const activeFlow = flowIdToUse
                ? await Flow.findById(flowIdToUse)
                : await Flow.findOne({ isActive: true });

            if (!activeFlow) {
                return res.status(201).json({ message, botResponse: null });
            }

            let progress = await UserProgress.findOne({ userId: senderId, flowId: activeFlow._id });

            let startStepId = '1';
            const allSteps = await FlowStep.find({ flowId: activeFlow._id });
            if (allSteps.length > 0) {
                const explicitStart = allSteps.find(step => step.isEntryPoint);
                if (explicitStart) {
                    startStepId = explicitStart.stepId;
                } else {
                    const targetIds = new Set();
                    allSteps.forEach(step => {
                        if (step.nextStep) targetIds.add(step.nextStep);
                        if (step.options && step.options.length > 0) {
                            step.options.forEach(opt => {
                                if (opt.nextStep) targetIds.add(opt.nextStep);
                            });
                        }
                    });

                    const rootNodes = allSteps.filter(step => !targetIds.has(step.stepId));
                    if (rootNodes.length > 0) {
                        const sortedRoots = rootNodes.sort((a, b) => {
                            if (a.position?.x !== b.position?.x) return (a.position?.x || 0) - (b.position?.x || 0);
                            return (a.position?.y || 0) - (b.position?.y || 0);
                        });
                        startStepId = sortedRoots[0].stepId;
                    } else {
                        const sorted = [...allSteps].sort((a, b) => {
                            if (a.position?.x !== b.position?.x) return (a.position?.x || 0) - (b.position?.x || 0);
                            return (a.position?.y || 0) - (b.position?.y || 0);
                        });
                        startStepId = sorted[0].stepId;
                    }
                }
            }

            // Handle Preview Reset
            if (req.body.isReset) {
                if (progress) {
                    progress.currentStep = startStepId;
                    progress.completed = false;
                    progress.followUpHistory = [];
                    progress.lastStepId = null;
                    progress.emailSent = false; // Reset email trigger
                    await progress.save();
                } else {
                    progress = await UserProgress.create({ userId: senderId, flowId: activeFlow._id, currentStep: startStepId, emailSent: false });
                }

                // NEW: Reset user name to Anonymous Lead on journey reset (SKIP for preview)
                if (!flowIdToUse) {
                    const targetUser = await User.findById(senderId);
                    if (targetUser && (targetUser.phone.startsWith('guest_') || targetUser.name !== 'Anonymous Lead')) {
                        targetUser.name = 'Anonymous Lead';
                        await targetUser.save();
                        userForInjection = targetUser; // ENSURE the reset name is used for the greeting
                    }
                }
            } else if (!progress) {
                progress = await UserProgress.create({ userId: senderId, flowId: activeFlow._id, currentStep: startStepId });
            }

            // Ensure lastStepId is null if we are resetting to avoid capturing the "Resetting journey" text
            if (req.body.isReset) {
                progress.lastStepId = null;
                await progress.save();
            }

            // --- DATA CAPTURE LOGIC ---
            if (progress.lastStepId) {
                const prevStep = await FlowStep.findOne({ stepId: progress.lastStepId, flowId: activeFlow._id });
                if (prevStep && prevStep.captureMapping) {
                    const targetUser = await User.findById(senderId);
                    if (targetUser) {
                        const mapping = prevStep.captureMapping.toLowerCase();
                        const value = req.body.fileUrl || text;
                        let updateOps = {};

                        // Identify target fields
                        if (mapping === 'name') updateOps.name = value;
                        else if (mapping === 'phone') updateOps.phone = value;
                        else if (mapping === 'email') updateOps.email = value;
                        else if (mapping === 'address' || mapping === 'location') updateOps.address = value;

                        try {
                            if (!flowIdToUse) {
                                // 1. Set leadData if it's a generic field
                                if (!['name', 'phone', 'email', 'address', 'location'].includes(mapping) && 
                                    !mapping.includes('service') && !mapping.includes('enquiry') && !mapping.includes('interest') && 
                                    prevStep.captureType !== 'file' && mapping !== 'resume') {
                                    
                                    const leadKey = `leadData.${prevStep.captureMapping}`;
                                    updateOps[leadKey] = value;
                                }

                                // 2. Execute Atomic Update ($set)
                                if (Object.keys(updateOps).length > 0) {
                                    await User.updateOne({ _id: senderId }, { $set: updateOps });
                                }

                                // 3. Execute Atomic Pushes ($push)
                                if (mapping.includes('service') || mapping.includes('enquiry') || mapping.includes('interest')) {
                                    await User.updateOne({ _id: senderId }, { 
                                        $push: { enquiries: { service: text, details: `Step: ${prevStep.stepId}`, timestamp: new Date() } } 
                                    });
                                }

                                if (prevStep.captureType === 'file' || mapping === 'resume') {
                                    await User.updateOne({ _id: senderId }, { 
                                        $push: { userAttachments: { name: req.body.fileName || 'Attachment', url: value, type: req.body.fileType || 'unknown' } } 
                                    });
                                }
                            }
                            
                            // Re-fetch for injection if needed
                            userForInjection = await User.findById(senderId);
                        } catch (saveErr) {
                            console.error(`⚠️ Atomic data capture failed: ${saveErr.message}`);
                            // Continue flow anyway so the bot still replies
                        }
                    }
                }

                // --- AUTO ADVANCE FOR OPEN RESPONSE NODES (Text or File) ---
                if (prevStep && (!prevStep.options || prevStep.options.length === 0) && !req.body.isReset && !actionNextStep) {
                    if (prevStep.nextStep) {
                        actionNextStep = prevStep.nextStep;
                    } else {
                        actionNextStep = 'end';
                    }
                }
            }
            // --------------------------

            if (actionNextStep) {
                progress.currentStep = actionNextStep;
                if (actionNextStep === 'end') progress.completed = true;
                progress.lastUpdated = Date.now();
                await progress.save();
            }

            if (!progress.completed) {
                const step = await FlowStep.findOne({ stepId: progress.currentStep, flowId: activeFlow._id });
                if (step) {
                    const admin = await User.findOne({ role: 'admin' });
                    const botSenderId = admin ? admin._id : senderId;

                    const personalizedText = injectVariables(step.question, userForInjection);

                    botResponse = await Message.create({
                        senderId: botSenderId,
                        receiverId: senderId,
                        text: personalizedText,
                        isBotResponse: true,
                        captureType: step.captureType || 'text',
                        captureMapping: step.captureMapping || null,
                        options: step.options
                    });

                    // Update Last Step ID for future capture
                    progress.lastStepId = step.stepId;
                    await progress.save();

                    // ── DETECT FINAL STEP & SEND LEAD EMAIL ──────────────────
                    // Trigger email on specific steps or any true terminal nodes
                    const isFinalSubmitStep = step.stepId.includes('final') || step.stepId.includes('thank_you') || step.stepId.includes('team_call');
                    const hasValidOptions = step.options && step.options.some(opt => opt.label && opt.label.trim() !== '');
                    const isTerminalNode = !step.captureMapping && !hasValidOptions && !step.nextStep;

                    if ((isFinalSubmitStep || isTerminalNode) && !progress.emailSent) {
                        progress.emailSent = true;
                        await progress.save();

                        console.log(`[FLOW] Finalizing enquiry: ${step.stepId}. Sending consolidated email.`);
                        const { sendLeadInfoEmail } = require('../utils/email');
                        const completedUser = await User.findById(senderId);
                        const adminForEmail = await User.findOne({ role: 'admin' });
                        const adminEmail = (adminForEmail && adminForEmail.email) || process.env.EMAIL_USER;
                        
                        if (completedUser && adminEmail) {
                            // Pass flowIdToUse to indicate this is a preview enquiry
                            sendLeadInfoEmail(adminEmail, completedUser, !!flowIdToUse)
                                .then(ok => console.log(ok ? '✅ Consolidated enquiry email sent' : '⚠️ Email send returned false'))
                                .catch(err => console.error('❌ Email error:', err.message));
                        }
                    }
                    // ────────────────────────────────────────────────────────

                    // Send push notification for bot response (Skip for previews)
                    if (!flowIdToUse) {
                        const user = await User.findById(senderId);
                        if (user) {
                            await sendPushNotification(user, {
                                title: 'ABM Groups Support',
                                body: personalizedText
                            });
                        }
                    }

                    // --- LEAD INTELLIGENCE & ROUTING ---
                    const targetUser = await User.findById(senderId);
                    if (targetUser && (step.tagsOnReach?.length > 0 || step.assignmentAction)) {
                        let updated = false;

                        // Auto-Tagging
                        if (step.tagsOnReach?.length > 0) {
                            step.tagsOnReach.forEach(tag => {
                                if (!targetUser.tags.includes(tag)) {
                                    targetUser.tags.push(tag);
                                    updated = true;
                                }
                            });
                        }

                        // Lead Assignment & Push Notifications
                        if (step.assignmentAction) {
                            const specializedAdmin = await User.findOne({
                                role: { $in: ['admin', 'sub-admin'] },
                                specialty: step.assignmentAction
                            });
                            if (specializedAdmin) {
                                targetUser.assignedTo = specializedAdmin._id;
                                updated = true;

                                // Notify the assigned admin! (Only for LIVE flows)
                                if (!flowIdToUse) {
                                    await sendPushNotification(specializedAdmin, {
                                        title: 'New Lead Assigned!',
                                        body: `${targetUser.name} initiated ${step.assignmentAction} flow.`
                                    });

                                    // Send Email Notification to Assigned Admin
                                    const { sendLeadInfoEmail } = require('../utils/email');
                                    if (specializedAdmin.email) {
                                        sendLeadInfoEmail(specializedAdmin.email, targetUser).catch(err => console.error("Error sending lead email", err));
                                    }
                                }
                            }
                        }

                        if (updated) await targetUser.save();
                    }
                    // -----------------------------------
                }
            } else if (progress.completed && actionNextStep === 'end' && !progress.emailSent) {
                const admin = await User.findOne({ role: 'admin' });
                const endText = injectVariables('Thank you {name}! We have received your request and will contact you soon.', userForInjection);

                progress.emailSent = true;
                await progress.save();

                botResponse = await Message.create({
                    senderId: admin ? admin._id : senderId,
                    receiverId: senderId,
                    text: endText,
                    isBotResponse: true,
                    options: []
                });

                // Clear last step as flow is finished
                progress.lastStepId = null;
                await progress.save();

                // Send push notification for completion (Skip for previews)
                if (!flowIdToUse) {
                    const user = await User.findById(senderId);
                    if (user) {
                        await sendPushNotification(user, {
                            title: 'ABM Groups Support',
                            body: endText
                        });

                        // Send Email Notification for Final Completion
                        const { sendLeadInfoEmail } = require('../utils/email');
                        const adminEmailToNotify = (admin && admin.email) || process.env.EMAIL_USER;
                        if (adminEmailToNotify) {
                            sendLeadInfoEmail(adminEmailToNotify, user).catch(err => console.error("Error sending completion email", err));
                        }
                    }
                }
            }
        }

        res.status(201).json({ message, botResponse });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getMessages, sendMessage };
