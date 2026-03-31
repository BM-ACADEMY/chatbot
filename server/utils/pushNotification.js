const webpush = require('web-push');

const sendPushNotification = async (user, payload) => {
    if (user && user.pushSubscription) {
        try {
            await webpush.sendNotification(
                user.pushSubscription,
                JSON.stringify(payload)
            );
            console.log(`Push notification sent to ${user.name}`);
        } catch (error) {
            console.error(`Failed to send push notification to ${user.name}:`);
            if (error.statusCode) {
                console.error(`  Status Code: ${error.statusCode}`);
                console.error(`  Body: ${error.body}`);
            } else {
                console.error(`  Error: ${error.message}`);
            }
        }
    }
};

module.exports = sendPushNotification;
