const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Flow = require('d:/projects/chat/server/models/Flow');
const FlowStep = require('d:/projects/chat/server/models/FlowStep');
const FollowUp = require('d:/projects/chat/server/models/FollowUp');

dotenv.config({ path: 'd:/projects/chat/server/.env' });

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Create Master Flow
        const masterFlow = await Flow.create({
            name: 'ABM Groups Master Entry',
            description: 'Single entry, multi-business routing',
            isPublished: true,
            isActive: true
        });

        // Step 1: Master Router
        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: '1',
            question: '👋 Welcome to ABM Groups 🚀\n\nWe help you with:\n🎓 Career & Courses\n📈 Business Growth\n🏡 Property Investment\n💼 Jobs & Skill Development\n\n👉 What are you looking for today?',
            options: [
                { label: '1️⃣ Courses (BM Academy)', nextStep: 'academy_start' },
                { label: '2️⃣ Business Marketing (BM TechX)', nextStep: 'techx_start' },
                { label: '3️⃣ Buy/Sell Property', nextStep: 'realestate_start' },
                { label: '4️⃣ Jobs & Skill Programs', nextStep: 'jobs_start' },
                { label: '5️⃣ Talk to Team', nextStep: 'call_request' }
            ]
        });

        // 2. Create BM Academy Flow
        const academyFlow = await Flow.create({
            name: 'BM Academy',
            description: 'Learn high-income skills with placement support',
            isPublished: true,
            isActive: false
        });

        // Step 1: Academy Start
        await FlowStep.create({
            flowId: academyFlow._id,
            stepId: '1',
            question: '🎓 BM Academy:\n\nLearn high-income skills with placement support. Choose your path:',
            tagsOnReach: ['Academy Lead'],
            assignmentAction: 'counselor',
            options: [
                { label: '1️⃣ AI', nextStep: 'ai_course' },
                { label: '2️⃣ Digital Marketing', nextStep: 'dm_course' },
                { label: '3️⃣ Full Stack', nextStep: 'fs_course' },
                { label: '📞 Talk to Expert', nextStep: 'call' }
            ]
        });

        // Follow ups for Academy
        await FollowUp.create({
            flowId: academyFlow._id,
            delayHours: 3,
            text: 'Hi 👋 Which service are you interested in?\n\n🎓 Courses\n📈 Business growth\n🏡 Property\n💼 Jobs\n\nReply anytime 👍',
            options: [{ label: 'Continue Journey', nextStep: '1' }]
        });
        
        await FollowUp.create({
            flowId: academyFlow._id,
            delayHours: 12,
            text: '🔥 ABM Groups helps 100+ people monthly:\n\n💰 Earn skills\n📈 Grow business\n🏡 Invest smartly\n\n👉 Tell me your goal, I’ll guide you.',
            options: [{ label: 'I am ready', nextStep: '1' }]
        });

        console.log('Successfully seeded ABM Master and Academy flows!');
        process.exit();
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
};

seed();
