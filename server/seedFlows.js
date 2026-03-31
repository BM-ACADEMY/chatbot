const mongoose = require('mongoose');
const dotenv = require('dotenv');
const FlowStep = require('./models/FlowStep');

dotenv.config();

const seedFlows = async () => {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chat-bot');
        console.log('MongoDB connected for seeding flows...');

        await FlowStep.deleteMany(); // Clear any existing

        const steps = [
            {
                stepId: '1',
                question: 'Welcome to BMTechX 👋 What are you looking for?',
                options: [
                    { label: 'Digital Marketing', nextStep: 'digital_marketing' },
                    { label: 'Web Development', nextStep: 'web_dev' },
                    { label: 'Video Editing', nextStep: 'video_editing' }
                ]
            },
            {
                stepId: 'web_dev',
                question: 'Great! What kind of website do you need?',
                options: [
                    { label: 'Static Website', nextStep: 'pricing_web' },
                    { label: 'Dynamic Website', nextStep: 'pricing_web' }
                ]
            },
            {
                stepId: 'digital_marketing',
                question: 'Excellent choice! Which marketing service are you looking for?',
                options: [
                    { label: 'SEO', nextStep: 'pricing_marketing' },
                    { label: 'Social Media Management', nextStep: 'pricing_marketing' }
                ]
            },
            {
                stepId: 'video_editing',
                question: 'Awesome! What type of video editing do you need?',
                options: [
                    { label: 'YouTube Videos', nextStep: 'pricing_video' },
                    { label: 'Shorts/Reels', nextStep: 'pricing_video' }
                ]
            },
            {
                stepId: 'pricing_web',
                question: 'Please select a Web Development pricing plan that suits you:',
                options: [
                    { label: 'Basic Plan', nextStep: 'confirm' },
                    { label: 'Standard Plan', nextStep: 'confirm' },
                    { label: 'Premium Plan', nextStep: 'confirm' }
                ]
            },
            {
                stepId: 'pricing_marketing',
                question: 'Please select a Marketing pricing plan that suits you:',
                options: [
                    { label: 'Basic Plan', nextStep: 'confirm' },
                    { label: 'Standard Plan', nextStep: 'confirm' },
                    { label: 'Premium Plan', nextStep: 'confirm' }
                ]
            },
            {
                stepId: 'pricing_video',
                question: 'Please select a Video Editing pricing plan that suits you:',
                options: [
                    { label: 'Basic Plan', nextStep: 'confirm' },
                    { label: 'Standard Plan', nextStep: 'confirm' },
                    { label: 'Premium Plan', nextStep: 'confirm' }
                ]
            },
            {
                stepId: 'confirm',
                question: 'Awesome! Your request has been confirmed. Our team will contact you shortly.',
                options: [] // End Flow
            }
        ];

        await FlowStep.insertMany(steps);
        console.log('Flows seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedFlows();
