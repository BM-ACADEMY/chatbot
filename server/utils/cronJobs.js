const cron = require('node-cron');
const UserProgress = require('../models/UserProgress');
const Message = require('../models/Message');
const User = require('../models/User');
const FollowUp = require('../models/FollowUp');
const sendPushNotification = require('./pushNotification');
const { injectVariables } = require('./stringUtils');

const startCronJobs = (io) => {
    // Run every 10 minutes for performance, or 1 minute if you need precise timing
    cron.schedule('*/10 * * * *', async () => {
        console.log('Running Advanced CRM Follow-Up Engine...');
        try {
            // Find users who haven't completed their flow
            const incompleteUsers = await UserProgress.find({ completed: false });

            if (incompleteUsers.length === 0) return;

            const now = new Date();

            for (const progress of incompleteUsers) {
                // Find potential follow-up rules for this flow
                const flowRules = await FollowUp.find({ flowId: progress.flowId }).sort({ delayHours: 1 });
                if (flowRules.length === 0) continue;

                const lastActivity = new Date(progress.lastUpdated);
                const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);

                // Find the highest-tier follow-up that applies and hasn't been sent yet
                // We go backwards (highest hours first) to find the most advanced applicable stage
                const applicableRule = flowRules
                    .filter(rule => hoursSinceActivity >= rule.delayHours && !progress.followUpHistory.includes(rule.delayHours))
                    .pop();

                if (!applicableRule) continue;

                // Send the Follow-Up Message
                const user = await User.findById(progress.userId);
                const admin = await User.findOne({ role: 'admin' });
                if (!user) continue;

                const personalizedText = injectVariables(applicableRule.text, user);

                const newMessage = await Message.create({
                    senderId: admin ? admin._id : user._id,
                    receiverId: user._id,
                    text: personalizedText,
                    isBotResponse: true,
                    options: applicableRule.options
                });

                // Socket Emission
                if (io) {
                    io.to(user._id.toString()).emit('receive_message', newMessage);
                }

                // Push Notification
                if (user.pushSubscription) {
                    await sendPushNotification(user, { title: 'ABM Groups Support', body: personalizedText });
                }

                // Update Progress History
                progress.followUpHistory.push(applicableRule.delayHours);
                // Note: We DON'T update lastUpdated here so that the next follow-up timer (e.g. 12h) 
                // still counts from the user's last actual message, not from our last bot follow-up.
                await progress.save();

                console.log(`[Follow-Up] Sent ${applicableRule.delayHours}h message to ${user.name}`);
            }
        } catch (error) {
            console.error('Error in CRM Follow-Up Engine:', error);
        }
    });
};

module.exports = startCronJobs;
