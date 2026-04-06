const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const Flow = require('../models/Flow');
const FlowStep = require('../models/FlowStep');

const seedFlow = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const flowName = "BM Academy Master Flow";
        let flow = await Flow.findOne({ name: flowName });
        if (flow) {
            console.log('Cleaning up existing flow steps...');
            await FlowStep.deleteMany({ flowId: flow._id });
        } else {
            flow = await Flow.create({ 
                name: flowName, 
                description: "Full workflow for BM Academy with multi-course branches",
                isActive: true,
                isPublished: true
            });
        }

        const flowId = flow._id;

        // --- STAGE 1: GREETING & USER DETAILS ---
        const stepName = await FlowStep.create({
            flowId,
            stepId: 'start_name',
            question: "Welcome!\n👉 May I know your name?",
            captureMapping: 'name',
            isEntryPoint: true,
            position: { x: 0, y: 0 }
        });

        const stepPhone = await FlowStep.create({
            flowId,
            stepId: 'get_phone',
            question: "😊 Thank you, {name}!\n👉 Could you please share your phone number?",
            captureMapping: 'phone',
            position: { x: 350, y: 0 }
        });
        stepName.nextStep = 'get_phone';
        await stepName.save();

        const stepLocation = await FlowStep.create({
            flowId,
            stepId: 'get_location',
            question: "📞 Thanks, {name}!\n👉 Please tell us your location (City/Area)",
            captureMapping: 'location',
            position: { x: 700, y: 0 }
        });
        stepPhone.nextStep = 'get_location';
        await stepPhone.save();

        // --- STAGE 2: SERVICE SELECTION ---
        const stepMaster = await FlowStep.create({
            flowId,
            stepId: 'master_entry',
            question: "📍 Got it, {name}! Thanks for sharing.\n\nHere’s how we can help you 👇\n✨ We help you with:\n\n👉 What are you looking for today?",
            options: [
                { label: '🎓 Career & Courses', nextStep: 'academy_courses' },
                { label: '📈 Business Growth', nextStep: 'techx_stub' },
                { label: '🏡 Property Investment', nextStep: 'realestate_stub' },
                { label: '💼 Jobs & Skill Development', nextStep: 'jobs_stub' }
            ],
            position: { x: 1050, y: 0 }
        });
        stepLocation.nextStep = 'master_entry';
        await stepLocation.save();

        // Stubs for STAGE 2 options not detailed
        await FlowStep.create({
            flowId,
            stepId: 'techx_stub',
            question: "Working on Business Growth... Our expert will connect with you soon!",
            nextStep: 'final_thanks',
            position: { x: 1400, y: -450 }
        });
        await FlowStep.create({
            flowId,
            stepId: 'realestate_stub',
            question: "Working on Property Investment... Our expert will connect with you soon!",
            nextStep: 'final_thanks',
            position: { x: 1400, y: -300 }
        });
        await FlowStep.create({
            flowId,
            stepId: 'jobs_stub',
            question: "Working on Jobs & Skill Development... Our expert will connect with you soon!",
            nextStep: 'final_thanks',
            position: { x: 1400, y: -150 }
        });

        // --- STAGE 3: CAREER & COURSES ---
        await FlowStep.create({
            flowId,
            stepId: 'academy_courses',
            question: "🎓 Great choice, {name}!\nWelcome to BM Academy 🚀\nWe provide industry-ready training programs with practical learning, placement guidance, and real-world skills.\n👉 Please choose a course:",
            options: [
                { label: 'Digital Marketing (DM)', nextStep: 'course_dm' },
                { label: 'Full Stack Development (FSD)', nextStep: 'course_fsd' },
                { label: 'Data Analytics (DA)', nextStep: 'course_da' },
                { label: 'Video Editing', nextStep: 'course_ve' }
            ],
            position: { x: 1400, y: 200 }
        });

        // ==========================================
        // 1. DIGITAL MARKETING FLOW
        // ==========================================
        await FlowStep.create({
            flowId,
            stepId: 'course_dm',
            question: "🔥 Excellent choice, {name}!\nOur Digital Marketing Course helps you master online marketing skills and start your career or business.\n📚 Key Topics Covered:\nSEO \nSMM\nPAID ADS\nSEM \netc...\n👉 What would you like to know next?",
            options: [
                { label: 'Fees', nextStep: 'dm_fees' },
                { label: 'Syllabus', nextStep: 'dm_syllabus' },
                { label: 'Contact Mentor', nextStep: 'contact_dm' },
                { label: 'Book Demo Session', nextStep: 'demo_date' }
            ],
            position: { x: 1800, y: 0 }
        });

        await FlowStep.create({
            flowId,
            stepId: 'dm_fees',
            question: "💰 Our Digital Marketing Course starts from ₹14,999\n✅ Includes:\nAdvanced practical training\nReal-time projects\nPlacement guidance\nInterview preparation\nSoft skills training\n👉 What would you like to do next?",
            options: [
                { label: 'Syllabus', nextStep: 'dm_syllabus' },
                { label: 'Contact Mentor', nextStep: 'contact_dm' },
                { label: 'Book Demo Session', nextStep: 'demo_date' }
            ],
            position: { x: 2200, y: -100 }
        });

        await FlowStep.create({
            flowId,
            stepId: 'dm_syllabus',
            question: "📄 Here is the detailed syllabus for the Digital Marketing Course 👇\n👉 [Download Syllabus PDF](https://bmacademy.com/syllabus/digital-marketing.pdf)\nLet me know if you need any clarification 😊",
            options: [
                { label: 'Contact Mentor', nextStep: 'contact_dm' },
                { label: 'Book Demo Session', nextStep: 'demo_date' }
            ],
            position: { x: 2200, y: 50 }
        });

        await FlowStep.create({
            flowId,
            stepId: 'contact_dm',
            question: "👨‍🏫 Sure, {name}!\nYou can directly connect with our mentor for guidance:\n[📞 Call Now](tel:+919403892971)\n[💬 WhatsApp Us](https://wa.me/919944940051?text=Hi!%20I%20am%20interested%20in%20the%20Digital%20Marketing%20Course)\n\nFeel free to ask any doubts anytime 👍",
            nextStep: 'final_thanks',
            position: { x: 2200, y: 200 }
        });

        // ==========================================
        // 2. FULL STACK DEVELOPMENT FLOW
        // ==========================================
        await FlowStep.create({
            flowId,
            stepId: 'course_fsd',
            question: "💻 Awesome choice, {name}!\nOur Full Stack Development Course helps you build websites and applications from scratch.\n📚 Key Topics Covered:\nHTML, CSS, JavaScript\nFrontend (React / UI Development)\nBackend Development (Node / APIs)\nDatabase (MongoDB / SQL)\nDeployment & Hosting\netc...\n👉 What would you like to know next?",
            options: [
                { label: 'Fees', nextStep: 'fsd_fees' },
                { label: 'Syllabus', nextStep: 'fsd_syllabus' },
                { label: 'Contact Mentor', nextStep: 'contact_fsd' },
                { label: 'Book Demo Session', nextStep: 'demo_date' }
            ],
            position: { x: 1800, y: 400 }
        });

        await FlowStep.create({
            flowId,
            stepId: 'fsd_fees',
            question: "💰 Our Full Stack Development Course starts from ₹18,999\n✅ Includes:\nLive project building\nReal-world coding practice\nPlacement support\nInterview preparation\nSoft skills training\n👉 What would you like to do next?",
            options: [
                { label: 'Syllabus', nextStep: 'fsd_syllabus' },
                { label: 'Contact Mentor', nextStep: 'contact_fsd' },
                { label: 'Book Demo Session', nextStep: 'demo_date' }
            ],
            position: { x: 2200, y: 400 }
        });

        await FlowStep.create({
            flowId,
            stepId: 'fsd_syllabus',
            question: "📄 Here is the detailed syllabus for the Full Stack Development Course 👇\n👉 [Download Syllabus PDF](https://bmacademy.com/syllabus/full-stack-development.pdf)\nLet me know if you need any clarification 😊",
            options: [
                { label: 'Contact Mentor', nextStep: 'contact_fsd' },
                { label: 'Book Demo Session', nextStep: 'demo_date' }
            ],
            position: { x: 2200, y: 550 }
        });

        await FlowStep.create({
            flowId,
            stepId: 'contact_fsd',
            question: "👨‍🏫 Sure, {name}!\nYou can directly connect with our mentor for guidance:\n[📞 Call Now](tel:+919403892971)\n[💬 WhatsApp Us](https://wa.me/919944940051?text=Hi!%20I%20am%20interested%20in%20the%20Full%20Stack%20Development%20Course)\n\nFeel free to ask any doubts anytime 👍",
            nextStep: 'final_thanks',
            position: { x: 2200, y: 700 }
        });

        // ==========================================
        // 3. DATA ANALYTICS FLOW
        // ==========================================
        await FlowStep.create({
            flowId,
            stepId: 'course_da',
            question: "📊 Great choice, {name}!\nOur Data Analytics Course helps you analyze data, create insights, and build a high-demand career.\n📚 Key Topics Covered:\nExcel & Advanced Excel\nSQL\n(Power BI / Tableau)\nPython for Data Analysis\nStatistics Basics\netc...\n👉 What would you like to know next?",
            options: [
                { label: 'Fees', nextStep: 'da_fees' },
                { label: 'Syllabus', nextStep: 'da_syllabus' },
                { label: 'Contact Mentor', nextStep: 'contact_da' },
                { label: 'Book Demo Session', nextStep: 'demo_date' }
            ],
            position: { x: 1800, y: 900 }
        });

        await FlowStep.create({
            flowId,
            stepId: 'da_fees',
            question: "💰 Our Data Analytics Course starts from ₹22,999\n✅ Includes:\nPractical data projects\nReal-time case studies\nPlacement guidance\nInterview preparation\nSoft skills training\n👉 What would you like to do next?",
            options: [
                { label: 'Syllabus', nextStep: 'da_syllabus' },
                { label: 'Contact Mentor', nextStep: 'contact_da' },
                { label: 'Book Demo Session', nextStep: 'demo_date' }
            ],
            position: { x: 2200, y: 900 }
        });

        await FlowStep.create({
            flowId,
            stepId: 'da_syllabus',
            question: "📄 Here is the detailed syllabus for the Data Analytics Course 👇\n👉 [Download Syllabus PDF](https://bmacademy.com/syllabus/data-analytics.pdf)\nLet me know if you need any clarification 😊",
            options: [
                { label: 'Contact Mentor', nextStep: 'contact_da' },
                { label: 'Book Demo Session', nextStep: 'demo_date' }
            ],
            position: { x: 2200, y: 1050 }
        });

        await FlowStep.create({
            flowId,
            stepId: 'contact_da',
            question: "👨‍🏫 Sure, {name}!\nYou can directly connect with our mentor for guidance:\n[📞 Call Now](tel:+919403892971)\n[💬 WhatsApp Us](https://wa.me/919944940051?text=Hi!%20I%20am%20interested%20in%20the%20Data%20Analytics%20Course)\n\nFeel free to ask any doubts anytime 👍",
            nextStep: 'final_thanks',
            position: { x: 2200, y: 1200 }
        });

        // ==========================================
        // 4. VIDEO EDITING FLOW
        // ==========================================
        await FlowStep.create({
            flowId,
            stepId: 'course_ve',
            question: "🎬 Super choice, {name}!\nOur Video Editing Course helps you create professional videos for social media, YouTube, and business.\n📚 Key Topics Covered:\nEditing Basics & Timeline\nTransitions & Effects\nColor Correction & Grading\nAudio Editing\nReels & YouTube Editing\netc...\n👉 What would you like to know next?",
            options: [
                { label: 'Fees', nextStep: 've_fees' },
                { label: 'Syllabus', nextStep: 've_syllabus' },
                { label: 'Contact Mentor', nextStep: 'contact_ve' },
                { label: 'Book Demo Session', nextStep: 'demo_date' }
            ],
            position: { x: 1800, y: 1400 }
        });

        await FlowStep.create({
            flowId,
            stepId: 've_fees',
            question: "💰 Our Video Editing Course starts from ₹14,999\n✅ Includes:\nHands-on editing practice\nReal-time projects\nPortfolio creation\nFreelancing guidance\nSoft skills training\n👉 What would you like to do next?",
            options: [
                { label: 'Syllabus', nextStep: 've_syllabus' },
                { label: 'Contact Mentor', nextStep: 'contact_ve' },
                { label: 'Book Demo Session', nextStep: 'demo_date' }
            ],
            position: { x: 2200, y: 1400 }
        });

        await FlowStep.create({
            flowId,
            stepId: 've_syllabus',
            question: "📄 Here is the detailed syllabus for the Video Editing Course 👇\n👉 [Download Syllabus PDF](https://bmacademy.com/syllabus/video-editing.pdf)\nLet me know if you need any clarification 😊",
            options: [
                { label: 'Contact Mentor', nextStep: 'contact_ve' },
                { label: 'Book Demo Session', nextStep: 'demo_date' }
            ],
            position: { x: 2200, y: 1550 }
        });

        await FlowStep.create({
            flowId,
            stepId: 'contact_ve',
            question: "👨‍🏫 Sure, {name}!\nYou can directly connect with our mentor for guidance:\n[📞 Call Now](tel:+919403892971)\n[💬 WhatsApp Us](https://wa.me/919944940051?text=Hi!%20I%20am%20interested%20in%20the%20Video%20Editing%20Course)\n\nFeel free to ask any doubts anytime 👍",
            nextStep: 'final_thanks',
            position: { x: 2200, y: 1700 }
        });

        // ==========================================
        // DEMO SESSION & CALENDAR (COMMON)
        // ==========================================
        await FlowStep.create({
            flowId,
            stepId: 'demo_date',
            question: "📅 Great decision, {name}!\n👉 Please select your preferred date for the demo session:",
            captureMapping: 'demo_date', // Open text field saves to demo_date
            nextStep: 'demo_time',
            position: { x: 2600, y: 600 }
        });

        await FlowStep.create({
            flowId,
            stepId: 'demo_time',
            question: "⏰ Please select your preferred time slot for the demo session:",
            captureMapping: 'demo_time',
            nextStep: 'final_thanks',
            position: { x: 3000, y: 600 }
        });

        // ==========================================
        // FINAL THANK YOU
        // ==========================================
        await FlowStep.create({
            flowId,
            stepId: 'final_thanks',
            question: "🙏 Thank you, {name}!\nWe’re happy to assist you.\nOur team will guide you throughout your learning journey 🚀\nIf you have any questions, feel free to message us anytime 😊",
            position: { x: 3400, y: 600 }
        });

        console.log('BM Academy Master Flow with all Courses Seeded Successfully!');
        process.exit();
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seedFlow();
