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
        const { receiverId, text, isBotResponse, actionNextStep } = req.body;
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
            
            // Handle Preview Reset
            if (req.body.isReset) {
                if (progress) {
                    progress.currentStep = '1';
                    progress.completed = false;
                    progress.followUpHistory = [];
                    progress.lastStepId = null;
                    await progress.save();
                } else {
                    progress = await UserProgress.create({ userId: senderId, flowId: activeFlow._id, currentStep: '1' });
                }
            } else if (!progress) {
                progress = await UserProgress.create({ userId: senderId, flowId: activeFlow._id, currentStep: '1' });
            }

        // --- DATA CAPTURE LOGIC ---
        if (progress.lastStepId) {
            const prevStep = await FlowStep.findOne({ stepId: progress.lastStepId, flowId: activeFlow._id });
            if (prevStep && prevStep.captureMapping) {
                const targetUser = await User.findById(senderId);
                if (targetUser) {
                    const mapping = prevStep.captureMapping.toLowerCase();
                    const value = req.body.fileUrl || text; // Use file if available, else text

                    if (mapping === 'name') {
                        targetUser.name = value;
                    } else if (mapping === 'phone') {
                        targetUser.phone = value;
                    } else if (prevStep.captureType === 'file' || mapping === 'document' || mapping === 'file') {
                        // Store in dedicated documents array
                        targetUser.documents.push({
                            name: req.body.fileName || 'Document',
                            url: value,
                            type: req.body.fileType || 'unknown'
                        });
                    } else {
                        // Dynamic key storage
                        if (!targetUser.leadData) targetUser.leadData = new Map();
                        targetUser.leadData.set(prevStep.captureMapping, value);
                    }
                    await targetUser.save();
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

                    const personalizedText = injectVariables(step.question, req.user);

                    botResponse = await Message.create({
                        senderId: botSenderId,
                        receiverId: senderId,
                        text: personalizedText,
                        isBotResponse: true,
                        captureType: step.captureType || 'text',
                        options: step.options
                    });

                    // Update Last Step ID for future capture
                    progress.lastStepId = step.stepId;
                    await progress.save();

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

                    // --- LEAD INTELLIGENCE & ROUTING (Skip for previews to avoid clutter) ---
                    if (!flowIdToUse) {
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

                            // Lead Assignment
                            if (step.assignmentAction) {
                                const specializedAdmin = await User.findOne({ 
                                    role: { $in: ['admin', 'sub-admin'] }, 
                                    specialty: step.assignmentAction 
                                });
                                if (specializedAdmin) {
                                    targetUser.assignedTo = specializedAdmin._id;
                                    updated = true;
                                    
                                    // Notify the assigned admin!
                                    await sendPushNotification(specializedAdmin, {
                                        title: 'New Lead Assigned!',
                                        body: `${targetUser.name} initiated ${step.assignmentAction} flow.`
                                    });
                                }
                            }

                            if (updated) await targetUser.save();
                        }
                    }
                    // -----------------------------------
                }
            } else if (progress.completed && actionNextStep === 'end') {
                const admin = await User.findOne({ role: 'admin' });
                const endText = injectVariables('Thank you {name}! We have received your request and will contact you soon.', req.user);
                
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
