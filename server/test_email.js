const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Use the actual sendLeadInfoEmail utility
const { sendLeadInfoEmail } = require('./utils/email');

// Simulate a realistic lead object (mirrors what comes from MongoDB User model)
const sampleLead = {
    name: 'Jeni Kumar',
    phone: '9876543210',
    email: 'jeni.kumar@example.com',
    address: '12 MG Road, Anna Nagar, India, Tamil Nadu, Chennai, 600040',
    documents: [
        { name: 'Resume.pdf', url: 'https://example.com/docs/resume.pdf', type: 'application/pdf' }
    ],
    leadData: new Map([
        ['demo_date', '2026-04-10'],
        ['demo_time', '10:30 AM'],
        ['course_interest', 'Digital Marketing'],
    ])
};

const targetEmail = process.env.EMAIL_USER; // sends to the admin inbox

console.log(`\n📧 Sending real lead notification email to: ${targetEmail}`);
console.log('   Lead name:', sampleLead.name);
console.log('   Lead phone:', sampleLead.phone);

sendLeadInfoEmail(targetEmail, sampleLead)
    .then((ok) => {
        if (ok) {
            console.log('\n✅ Lead notification email sent! Check your inbox.');
        } else {
            console.error('\n❌ sendLeadInfoEmail returned false — check SMTP logs above.');
        }
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n❌ Error:', err.message);
        process.exit(1);
    });
