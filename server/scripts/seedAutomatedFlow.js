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

        const flowName = "ABM Groups Master Automation";
        let flow = await Flow.findOne({ name: flowName });
        if (flow) {
            console.log('Cleaning up existing flow steps...');
            await FlowStep.deleteMany({ flowId: flow._id });
        } else {
            flow = await Flow.create({ 
                name: flowName, 
                description: "Main business automation for ABM Groups",
                isActive: true,
                isPublished: true
            });
        }

        const flowId = flow._id;

        // --- STAGE 0: DATA COLLECTION ---
        const stepName = await FlowStep.create({
            flowId,
            stepId: 'start_name',
            question: "👋 Welcome to ABM Groups 🚀\n\nTo better assist you, may I have your **Full Name**?",
            captureMapping: 'name',
            isEntryPoint: true,
            position: { x: 0, y: 0 }
        });

        const stepEmail = await FlowStep.create({
            flowId,
            stepId: 'get_email',
            question: "Thanks {name}! And your **Email Address** please?",
            captureMapping: 'email',
            position: { x: 350, y: 0 }
        });
        stepName.nextStep = 'get_email';
        await stepName.save();

        const stepAddress = await FlowStep.create({
            flowId,
            stepId: 'get_address',
            question: "Got it. What's your **Location/Address**?",
            captureMapping: 'address',
            position: { x: 700, y: 0 }
        });
        stepEmail.nextStep = 'get_address';
        await stepEmail.save();

        // --- STAGE 1: MASTER ENTRY ---
        const stepMaster = await FlowStep.create({
            flowId,
            stepId: 'master_entry',
            question: "Excellent! We help you with:\n🎓 Career & Courses\n📈 Business Growth\n🏡 Property Investment\n💼 Jobs & Skill Development\n\n👉 **What are you looking for today?**",
            options: [
                { label: '1️⃣ Courses (BM Academy)', nextStep: 'academy_entry' },
                { label: '2️⃣ Marketing (BM TechX)', nextStep: 'techx_entry' },
                { label: '3️⃣ Real Estate', nextStep: 'realestate_entry' },
                { label: '4️⃣ Jobs (Core Talent)', nextStep: 'coretalent_entry' },
                { label: '5️⃣ Talk to Team', nextStep: 'talk_to_team' }
            ],
            position: { x: 1050, y: 0 }
        });
        stepAddress.nextStep = 'master_entry';
        await stepAddress.save();

        // --- BM ACADEMY FLOW ---
        const academyEntry = await FlowStep.create({
            flowId,
            stepId: 'academy_entry',
            question: "👋 Hi! Welcome to **BM Academy** 🚀\nPondicherry’s 1st AI-powered Career Academy\n\nWe help you:\n💰 Earn high-income skills\n💼 Get job opportunities\n📈 Start freelancing/business\n\n👉 **What are you looking for?**",
            tagsOnReach: ['BM Academy'],
            options: [
                { label: '1️⃣ AI Courses', nextStep: 'academy_ai' },
                { label: '2️⃣ Digital Marketing', nextStep: 'academy_dm' },
                { label: '3️⃣ Full Stack Development', nextStep: 'academy_fs' },
                { label: '4️⃣ Fees & Duration', nextStep: 'academy_fees' },
                { label: '5️⃣ Placement Details', nextStep: 'academy_placement' },
                { label: '6️⃣ Talk to Counselor', nextStep: 'talk_to_team' }
            ],
            position: { x: 1400, y: -450 }
        });

        await FlowStep.create({
            flowId,
            stepId: 'academy_ai',
            question: "🔥 **AI Course:**\n\n✔️ ChatGPT + AI Tools\n✔️ Automation skills\n✔️ Freelancing methods\n✔️ Beginner friendly\n\n⏳ **Duration:** 30–45 Days\n\n👉 **Next:**",
            options: [
                { label: '1️⃣ Fees', nextStep: 'academy_fees' },
                { label: '2️⃣ Syllabus', nextStep: 'academy_syllabus' },
                { label: '3️⃣ Talk to Expert', nextStep: 'talk_to_team' }
            ],
            position: { x: 1750, y: -650 }
        });

        await FlowStep.create({
            flowId,
            stepId: 'academy_dm',
            question: "📈 **Digital Marketing:**\n\n✔️ Meta Ads + Google Ads\n✔️ Instagram growth\n✔️ Lead generation\n✔️ Real projects\n\n⏳ **Duration:** 45–60 Days\n\n👉 **Next:**",
            options: [
                { label: '1️⃣ Fees', nextStep: 'academy_fees' },
                { label: '2️⃣ Syllabus', nextStep: 'academy_syllabus' },
                { label: '3️⃣ Talk to Expert', nextStep: 'talk_to_team' }
            ],
            position: { x: 1750, y: -450 }
        });

        await FlowStep.create({
            flowId,
            stepId: 'academy_fs',
            question: "💻 **Full Stack Development:**\n\n✔️ Frontend + Backend\n✔️ Live projects\n✔️ Portfolio building\n✔️ Placement training\n\n⏳ **Duration:** 3–6 Months\n\n👉 **Next:**",
            options: [
                { label: '1️⃣ Fees', nextStep: 'academy_fees' },
                { label: '2️⃣ Syllabus', nextStep: 'academy_syllabus' },
                { label: '3️⃣ Talk to Expert', nextStep: 'talk_to_team' }
            ],
            position: { x: 1750, y: -250 }
        });

        await FlowStep.create({
            flowId,
            stepId: 'academy_fees',
            question: "💰 **Fees Details:**\n\n✔️ Budget-friendly pricing\n✔️ EMI options available\n✔️ Scholarship seats (limited 🎯)\n\n👉 Fees vary based on:\n• Course\n• Batch type\n• Current offers\n\n👉 **What do you want?**",
            options: [
                { label: '1️⃣ Exact Fees', nextStep: 'talk_to_team' },
                { label: '2️⃣ Offers Available', nextStep: 'talk_to_team' },
                { label: '3️⃣ Book FREE Call', nextStep: 'talk_to_team' }
            ],
            position: { x: 2100, y: -500 }
        });

        await FlowStep.create({
            flowId,
            stepId: 'academy_syllabus',
            question: "📚 **Course Syllabus:**\n\n✔️ Step-by-step training\n✔️ Practical sessions\n✔️ Interview prep\n\n👉 **Download full syllabus here 👇**\n[https://bmacademy.com/syllabus.pdf]",
            position: { x: 2100, y: -250 }
        });

        await FlowStep.create({
            flowId,
            stepId: 'academy_placement',
            question: "🎯 **Placement Support:**\n\n✔️ Resume building\n✔️ Mock interviews\n✔️ Job referrals\n\n💼 Students are now:\n→ Working in companies\n→ Freelancing\n\n👉 **Want guidance?**",
            options: [
                { label: '1️⃣ Yes explain', nextStep: 'talk_to_team' },
                { label: '2️⃣ Book call', nextStep: 'talk_to_team' }
            ],
            position: { x: 1750, y: -50 }
        });


        // --- BM TECHX FLOW ---
        const techxEntry = await FlowStep.create({
            flowId,
            stepId: 'techx_entry',
            question: "👋 Hi! Welcome to **BM TechX** 🚀\nYour Growth Partner for Business & Marketing\n\nWe help you:\n📈 Generate quality leads\n💻 Build high-converting websites\n📊 Scale your business with ads\n🎯 Improve branding & presence\n\n👉 **What are you looking for?**",
            tagsOnReach: ['BM TechX'],
            options: [
                { label: '1️⃣ Lead Generation (Ads)', nextStep: 'techx_leadgen' },
                { label: '2️⃣ Social Media Marketing', nextStep: 'techx_smm' },
                { label: '3️⃣ Website Development', nextStep: 'techx_webdev' },
                { label: '4️⃣ Branding', nextStep: 'techx_branding' },
                { label: '5️⃣ Pricing Details', nextStep: 'techx_pricing' },
                { label: '6️⃣ Talk to Expert', nextStep: 'talk_to_team' }
            ],
            position: { x: 1400, y: 300 }
        });

        // TECHX: LEAD GEN
        await FlowStep.create({
            flowId,
            stepId: 'techx_leadgen',
            question: "🔥 **Lead Generation Service:**\n\n✔️ Meta Ads (Facebook & Instagram)\n✔️ High-quality enquiry leads\n✔️ Local targeting (Tamil Nadu & Pondy)\n✔️ Budget optimization strategy\n\n💰 **Starting from ₹4,500**\n\n👉 **Next:**",
            options: [
                { label: '1️⃣ Case Studies', nextStep: 'techx_case_studies' },
                { label: '2️⃣ Pricing Details', nextStep: 'techx_pricing' },
                { label: '3️⃣ Free Consultation', nextStep: 'talk_to_team' }
            ],
            position: { x: 1800, y: 150 }
        });

        // TECHX: SMM
        await FlowStep.create({
            flowId,
            stepId: 'techx_smm',
            question: "📱 **Social Media Growth:**\n\n✔️ Content creation (Post + Reels)\n✔️ Instagram growth strategy\n✔️ Engagement boosting\n✔️ Brand positioning\n\n👉 **Next:**",
            options: [
                { label: '1️⃣ Pricing', nextStep: 'techx_pricing' },
                { label: '2️⃣ Portfolio', nextStep: 'techx_case_studies' },
                { label: '3️⃣ Talk to Expert', nextStep: 'talk_to_team' }
            ],
            position: { x: 1800, y: 320 }
        });

        // TECHX: WEB DEV
        await FlowStep.create({
            flowId,
            stepId: 'techx_webdev',
            question: "🌐 **Website Development:**\n\n✔️ Business websites\n✔️ Landing pages (Lead focused)\n✔️ Mobile optimized\n✔️ SEO-ready structure\n\n💰 **Starting from ₹2,999**\n\n👉 **Next:**",
            options: [
                { label: '1️⃣ Demo Websites', nextStep: 'techx_case_studies' },
                { label: '2️⃣ Pricing', nextStep: 'techx_pricing' },
                { label: '3️⃣ Talk to Expert', nextStep: 'talk_to_team' }
            ],
            position: { x: 1800, y: 490 }
        });

        // TECHX: BRANDING
        await FlowStep.create({
            flowId,
            stepId: 'techx_branding',
            question: "🎨 **Branding Services:**\n\n✔️ Logo design\n✔️ Brand identity\n✔️ Creative ad designs\n✔️ Business positioning\n\n👉 **Next:**",
            options: [
                { label: '1️⃣ Portfolio', nextStep: 'techx_case_studies' },
                { label: '2️⃣ Pricing', nextStep: 'techx_pricing' },
                { label: '3️⃣ Free Consultation', nextStep: 'talk_to_team' }
            ],
            position: { x: 1800, y: 660 }
        });

        // TECHX: PRICING
        await FlowStep.create({
            flowId,
            stepId: 'techx_pricing',
            question: "💰 **Pricing Details:**\n\n✔️ Affordable packages\n✔️ Custom plans available\n✔️ ROI-focused strategy\n\n🔥 **Today Bonus:**\nFree strategy + competitor analysis 🎯\n\n👉 **What do you want?**",
            tagsOnReach: ['Interested in TechX Pricing'],
            options: [
                { label: '1️⃣ Exact Pricing', nextStep: 'talk_to_team' },
                { label: '2️⃣ Offers Available', nextStep: 'talk_to_team' },
                { label: '3️⃣ Book FREE Call', nextStep: 'talk_to_team' }
            ],
            position: { x: 2200, y: 350 }
        });

        // TECHX: PROOF
        await FlowStep.create({
            flowId,
            stepId: 'techx_case_studies',
            question: "📊 **Our Results:**\n\n✔️ Generated high-quality leads\n✔️ Reduced cost per lead\n✔️ Increased client conversions\n✔️ Worked with real estate & local businesses\n\n👉 **Want to see proof?**",
            options: [
                { label: '1️⃣ Case Studies', nextStep: 'talk_to_team' },
                { label: '2️⃣ Client Results', nextStep: 'talk_to_team' },
                { label: '3️⃣ Talk to Expert', nextStep: 'talk_to_team' }
            ],
            position: { x: 2200, y: 600 }
        });

        // TECHX: OBJECTION
        await FlowStep.create({
            flowId,
            stepId: 'techx_objection_worth',
            question: "Good question 👍\n\nWe focus on:\n✔️ Real business results\n✔️ ROI-driven marketing\n✔️ Quality leads (not just numbers)\n\n👉 **Want to see results or talk to expert?**",
            position: { x: 2200, y: 150 }
        });


        // --- GLOBAL TEAM NODE ---
        await FlowStep.create({
            flowId,
            stepId: 'talk_to_team',
            question: "📞 **Let's grow your business together!**\n\n👉 Book FREE strategy call:\n[https://calendly.com/bm-groups]\n\nOR\n\nSend:\n✔️ Name\n✔️ Business type\n\nOur expert will contact you 📲",
            assignmentAction: 'sales', 
            position: { x: 2600, y: 250 }
        });

        // --- OTHER ENTRIES ---
        await FlowStep.create({
            flowId,
            stepId: 'realestate_entry',
            question: "👋 Welcome to **Real Estate with Kamar** 🏡\nYour Trusted Property Partner in Pondicherry\n\n👉 **What are you looking for?**",
            tagsOnReach: ['Real Estate'],
            options: [
                { label: '1️⃣ Buy Property', nextStep: 'talk_to_team' },
                { label: '2️⃣ Sell Property', nextStep: 'talk_to_team' }
            ],
            position: { x: 1400, y: 1000 }
        });

        await FlowStep.create({
            flowId,
            stepId: 'coretalent_entry',
            question: "👋 Welcome to **Core Talent** 💼\nYour Career Growth Partner 🚀\n\n👉 **What are you looking for?**",
            tagsOnReach: ['Core Talent'],
            options: [
                { label: '1️⃣ Find Jobs', nextStep: 'talk_to_team' },
                { label: '2️⃣ Skill Training', nextStep: 'talk_to_team' }
            ],
            position: { x: 1400, y: 1300 }
        });

        console.log('BM TechX Flow Seeded Successfully!');
        process.exit();
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seedFlow();
