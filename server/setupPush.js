const webpush = require('web-push');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

// don't append twice
if (!process.env.VAPID_PUBLIC_KEY) {
    const vapidKeys = webpush.generateVAPIDKeys();
    const envString = `\nVAPID_PUBLIC_KEY=${vapidKeys.publicKey}\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}\nVAPID_SUBJECT=mailto:admin@bmtechx.com\n`;

    fs.appendFileSync('.env', envString);
    console.log('Appended VAPID keys to .env');
} else {
    console.log('VAPID keys already exist');
}
