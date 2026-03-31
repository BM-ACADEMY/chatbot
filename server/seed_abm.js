const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Flow = require('./models/Flow');
const FlowStep = require('./models/FlowStep');
const FollowUp = require('./models/FollowUp');

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // FULL CLEANUP
        await FlowStep.deleteMany({});
        await FollowUp.deleteMany({});
        await Flow.deleteMany({});

        // --- 1. MASTER FLOW ---
        const masterFlow = await Flow.create({
            name: 'ABM Groups Master Entry',
            description: 'Core brand routing funnel',
            isPublished: true,
            isActive: true
        });

        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: '1',
            question: '👋 Welcome to ABM Groups 🚀\n\nWe help you with:\n🎓 Career & Courses\n📈 Business Growth\n🏡 Property Investment\n💼 Jobs & Skill Development\n\n👉 What are you looking for today?',
            options: [
                { label: '1️⃣ Courses (BM Academy)', nextStep: 'academy_entry' },
                { label: '2️⃣ Business Marketing (BM TechX)', nextStep: 'techx_entry' },
                { label: '3️⃣ Buy/Sell Property', nextStep: 'realestate_entry' },
                { label: '4️⃣ Jobs & Skill Programs', nextStep: 'jobs_entry' },
                { label: '5️⃣ Talk to Team', nextStep: 'team_call' }
            ]
        });

        // --- 2. BM ACADEMY FLOW ---
        const academyFlow = await Flow.create({
            name: 'BM Academy',
            description: 'Pondicherry’s 1st AI-powered Career Academy',
            isPublished: true,
            isActive: false
        });

        // Entry from Master
        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'academy_entry',
            question: '👋 Hi! Welcome to BM Academy 🚀\nPondicherry’s 1st AI-powered Career Academy\n\nWe help you:\n💰 Earn high-income skills\n💼 Get job opportunities\n📈 Start freelancing/business\n\n👉 What are you looking for?',
            tagsOnReach: ['Academy Lead'],
            assignmentAction: 'counselor',
            captureMapping: 'goal', // Capture what they are looking for
            options: [
                { label: '1️⃣ AI Courses', nextStep: 'ai_course' },
                { label: '2️⃣ Digital Marketing', nextStep: 'dm_course' },
                { label: '3️⃣ Full Stack Development', nextStep: 'fs_course' },
                { label: '4️⃣ Fees & Duration', nextStep: 'fees_info' },
                { label: '5️⃣ Placement Details', nextStep: 'placement_info' },
                { label: '6️⃣ Talk to Counselor', nextStep: 'team_call' }
            ]
        });

        // Course Details
        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'ai_course',
            question: '🔥 AI Course:\n\n✔️ ChatGPT + AI Tools\n✔️ Automation skills\n✔️ Freelancing methods\n✔️ Beginner friendly\n\n⏳ Duration: 30–45 Days\n\n👉 Next:',
            options: [
                { label: '1️⃣ Fees', nextStep: 'fees_info' },
                { label: '2️⃣ Syllabus', nextStep: 'syllabus_info' },
                { label: '3️⃣ Talk to Expert', nextStep: 'team_call' }
            ]
        });

        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'dm_course',
            question: '📈 Digital Marketing:\n\n✔️ Meta Ads + Google Ads\n✔️ Instagram growth\n✔️ Lead generation\n✔️ Real projects\n\n⏳ Duration: 45–60 Days\n\n👉 Next:',
            options: [
                { label: '1️⃣ Fees', nextStep: 'fees_info' },
                { label: '2️⃣ Syllabus', nextStep: 'syllabus_info' },
                { label: '3️⃣ Talk to Expert', nextStep: 'team_call' }
            ]
        });

        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'fs_course',
            question: '💻 Full Stack Development:\n\n✔️ Frontend + Backend\n✔️ Live projects\n✔️ Portfolio building\n✔️ Placement training\n\n⏳ Duration: 3–6 Months\n\n👉 Next:',
            options: [
                { label: '1️⃣ Fees', nextStep: 'fees_info' },
                { label: '2️⃣ Syllabus', nextStep: 'syllabus_info' },
                { label: '3️⃣ Talk to Expert', nextStep: 'team_call' }
            ]
        });

        // Fees Handling
        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'fees_info',
            question: '💰 Fees Details:\n\n✔️ Budget-friendly pricing\n✔️ EMI options available\n✔️ Scholarship seats (limited 🎯)\n\n👉 Fees vary based on:\n• Course\n• Batch type\n• Current offers\n\n🔥 Today Bonus:\nFree career guidance + extra modules\n\n👉 What do you want?',
            tagsOnReach: ['Interested'],
            options: [
                { label: '1️⃣ Exact Fees', nextStep: 'hot_lead_call' },
                { label: '2️⃣ Offers Available', nextStep: 'hot_lead_call' },
                { label: '3️⃣ Book FREE Call', nextStep: 'team_call' }
            ]
        });

        // Syllabus
        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'syllabus_info',
            question: '📚 Course Syllabus:\n\n✔️ Step-by-step training\n✔️ Practical sessions\n✔️ Live projects\n✔️ Interview prep\n\n👉 Download full syllabus here 👇\n(PDF link)\n\n👉 Next:',
            options: [
                { label: '1️⃣ Fees', nextStep: 'fees_info' },
                { label: '2️⃣ Placement', nextStep: 'placement_info' },
                { label: '3️⃣ Talk to Expert', nextStep: 'team_call' }
            ]
        });

        // Placement
        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'placement_info',
            question: '🎯 Placement Support:\n\n✔️ Resume building\n✔️ Mock interviews\n✔️ Internship support\n✔️ Job referrals\n\n💼 Students are now:\n→ Working in companies\n→ Freelancing\n→ Running businesses\n\n👉 Want guidance for your career?',
            options: [
                { label: '1️⃣ Yes explain', nextStep: 'team_call' },
                { label: '2️⃣ Book call', nextStep: 'team_call' },
                { label: '3️⃣ Fees', nextStep: 'fees_info' }
            ]
        });

        // Hot Lead Junction
        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'hot_lead_call',
            question: '🔥 You’re interested 👍\n\nLet me connect you directly to our expert for the best pricing and slots.\n\n📞 Call now: +91 XXXXX\n\nOR reply "CALL"',
            tagsOnReach: ['Hot Lead'],
            assignmentAction: 'closer'
        });

        // Final Goal / Team Call
        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'team_call',
            question: '📞 Let’s choose the right course for you\n\n👉 Book FREE counseling call:\n\nClick here: (link)\n\nOR\n\nSend:\n✔️ Name\n✔️ Time\n\nOur expert will call you 📲',
            tagsOnReach: ['Sales Ready']
        });

        // --- 3. GLOBAL FOLLOW-UP SYSTEM ---
        await FollowUp.create({
            flowId: masterFlow._id,
            delayHours: 3,
            text: 'Hi 👋\n\nWhich service are you interested in?\n\n🎓 Courses\n📈 Business growth\n🏡 Property\n💼 Jobs\n\nReply anytime 👍',
            options: [
                { label: '🎓 Courses', nextStep: 'academy_entry' },
                { label: '📈 Business', nextStep: 'techx_entry' },
                { label: '🏡 Property', nextStep: 'realestate_entry' },
                { label: '💼 Jobs', nextStep: 'jobs_entry' }
            ]
        });

        await FollowUp.create({
            flowId: masterFlow._id,
            delayHours: 12,
            text: '🔥 ABM Groups helps 100+ people monthly:\n\n💰 Earn skills\n📈 Grow business\n🏡 Invest smartly\n\n👉 Tell me your goal, I’ll guide you',
            options: [{ label: '1️⃣ Get Started', nextStep: '1' }]
        });

        await FollowUp.create({
            flowId: masterFlow._id,
            delayHours: 24,
            text: '⚠️ Limited slots / offers active\n\n👉 Don’t miss:\n\nCourses | Business leads | Property deals\n\nReply “INFO” to continue',
            options: [{ label: 'INFO', nextStep: '1' }]
        });

        await FollowUp.create({
            flowId: masterFlow._id,
            delayHours: 48,
            text: '📞 Let’s make it simple\n\nTalk to expert for 5 mins\n\n👉 Book: (link)\n\nOR reply “CALL”',
            options: [{ label: 'Book Call', nextStep: 'team_call' }]
        });

        console.log('--- MASTER DATA SEEDED SUCCESSFULLY ---');
        process.exit();
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
};

seed();
