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

        // CLEANUP
        await FlowStep.deleteMany({});
        await FollowUp.deleteMany({});
        await Flow.deleteMany({});

        // --- MASTER FLOW ---
        const masterFlow = await Flow.create({
            name: 'ABM Connect - Final Core Talents Flow',
            description: 'Professional career growth, training, and placement flow for Core Talents.',
            isPublished: true,
            isActive: true
        });

        // ================================================================
        // COMMON STAGE 1: GREETING & USER DETAILS
        // ================================================================

        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'hi',
            isEntryPoint: true,
            question: '👋 Hi! Welcome to BM Group 🚀\nWe’re excited to help you with your career, business, and investments!\n👉 May I know your name? (Letters only)',
            captureMapping: 'name',
            nextStep: 'capture_phone'
        });

        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'capture_phone',
            question: '😊 Thank you, {name}!\n👉 Could you please share your phone number?',
            captureMapping: 'phone',
            nextStep: 'capture_location'
        });

        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'capture_location',
            question: '📞 Thanks, {name}!\n👉 Please tell us your location (City/Area) (Letters only)',
            captureMapping: 'location',
            nextStep: 'main_menu'
        });

        // ================================================================
        // COMMON STAGE 2: SERVICE SELECTION
        // ================================================================

        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'main_menu',
            question: '📍 Got it, {name}! Thanks for sharing.\n\nHere’s how we can help you 👇\n✨ We help you with:\n\n👉 **What are you looking for today?**',
            options: [
                { label: '🎓 BM Academy – Career & Courses', nextStep: 'academy_entry' },
                { label: '💼 Core Talents – Jobs & Skill Development', nextStep: 'talents_entry' },
                { label: '🏡 Namma Pondy Properties – Property Investment', nextStep: 'namma_pondy_entry' },
                { label: '📈 BM TechX – Business Growth & Marketing', nextStep: 'techx_entry' }
            ]
        });

        // ================================================================
        // I. BM ACADEMY FLOW
        // ================================================================
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'academy_entry', question: '🎓 Welcome to BM Academy 🚀\n👉 Please choose a course:', options: [ { label: 'Digital Marketing', nextStep: 'course_dm' }, { label: 'Full Stack Development', nextStep: 'course_fs' }, { label: 'Data Analytics', nextStep: 'course_da' }, { label: 'Video Editing', nextStep: 'course_ve' } ] });
        const academyNextOptions = [ { label: 'Syllabus', nextStep: 'academy_syllabus' }, { label: 'Contact Mentor', nextStep: 'academy_mentor' }, { label: 'Book Demo Session', nextStep: 'academy_demo_date' } ];
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'course_dm', question: '🔥 Digital Marketing Course\n📚 Key Topics: SEO, SMM, Paid Ads\n💰 Fees: Starts from ₹14,999', captureMapping: 'service_enquiry', options: academyNextOptions });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'course_fs', question: '💻 Full Stack Development\n📚 Key Topics: React, Node.js, Next.js\n💰 Fees: Starts from ₹18,999', captureMapping: 'service_enquiry', options: academyNextOptions });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'course_da', question: '📊 Data Analytics\n📚 Key Topics: Python, Power BI, SQL\n💰 Fees: Starts from ₹22,999', captureMapping: 'service_enquiry', options: academyNextOptions });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'course_ve', question: '🎬 Video Editing\n📚 Key Topics: Premiere Pro, Reels\n💰 Fees: Starts from ₹14,999', captureMapping: 'service_enquiry', options: academyNextOptions });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'academy_syllabus', question: '📄 Here is the detailed syllabus:\n- Java: https://drive.google.com/file/d/13T7Hso7y-EyLVDQMd4lUZ-6wHI1pb-G4/view\n- MEAN: https://drive.google.com/file/d/1e_xuM7jeROgey-UsgIvU1SOtkzXsYr73/view\n- MERN: https://drive.google.com/file/d/1Qo-z9VH1UPYidbjhqGkmY6GMe2haTj66/view', options: [ { label: 'Contact Mentor', nextStep: 'academy_mentor' }, { label: 'Book Demo Session', nextStep: 'academy_demo_date' }, { label: '➕ Enquire More', nextStep: 'multi_enquiry_loop' } ] });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'academy_mentor', question: '👨‍‍🏫 Connect with Mentor:\n📞 9403892971\n💬 https://wa.me/919944940051', options: [ { label: 'Book Demo Session', nextStep: 'academy_demo_date' }, { label: '🏁 Finish & Submit', nextStep: 'final_thank_you' } ] });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'academy_demo_date', question: '📅 Please select your preferred **date** for the demo session:', captureMapping: 'demo_date', nextStep: 'academy_demo_time' });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'academy_demo_time', question: '✅ Now choose an available **time slot**:', captureMapping: 'demo_time', nextStep: 'multi_enquiry_loop' });

        // ================================================================
        // II. CORE TALENTS FLOW (OVERHAUL)
        // ================================================================

        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'talents_entry',
            question: '👋 Hi {name}! Welcome to **Core Talent** 💼\nYour Career Growth Partner 🚀\n\nWe help you:\n✔️ Get job opportunities\n✔️ Improve your skills\n✔️ Get placement support\n✔️ Build your career faster\n\n👉 What are you looking for?',
            options: [
                { label: '1️⃣ Find Jobs', nextStep: 'talents_job_intro' },
                { label: '2️⃣ Skill Training', nextStep: 'talents_training_entry' },
                { label: '3️⃣ Placement Support', nextStep: 'talents_placement_intro' },
                { label: '4️⃣ Talk to Team', nextStep: 'talents_team_msg' }
            ]
        });

        // --- Path 1: Find Jobs ---
        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'talents_job_intro',
            question: 'Great 👍 Let’s help you get a job fast!\n\n📄 **Available Opportunities:**\n✔️ Fresher Jobs\n✔️ Experienced Roles\n✔️ Local Company Openings\n✔️ Immediate Joining\n\n👉 Let’s collect your profile details first.',
            options: [ { label: 'Collect Basic Details', nextStep: 'talents_job_details' } ]
        });

        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'talents_job_details',
            question: '📝 **Step 1: Profile Details**\n👉 Please share your **Qualification & Experience** (Letters only):',
            captureMapping: 'job_qual_exp',
            nextStep: 'talents_job_location'
        });

        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'talents_job_location',
            question: '📍 **Preferred Location**\n👉 Where would you like to work? (Letters only):',
            captureMapping: 'job_pref_location',
            nextStep: 'talents_job_resume'
        });

        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'talents_job_resume',
            question: '📄 **Step 2: Resume Upload**\n👉 Please upload your resume (PDF/Doc):',
            captureType: 'file',
            captureMapping: 'resume',
            nextStep: 'talents_job_finish'
        });

        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'talents_job_finish',
            question: '✅ **Thank you! Your details have been received**\n🚀 Our team will:\n✔️ Review your profile\n✔️ Match with suitable jobs\n✔️ Contact you shortly\n\n(We have added this to your enquiry list)',
            nextStep: 'multi_enquiry_loop'
        });

        // --- Path 2: Skill Training ---
        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'talents_training_entry',
            question: '🚀 Upgrade your skills & grow your career faster!\n\n📚 **Our Training Programs**\n🎓 Includes:\n✔️ Practical training\n✔️ Real-time projects\n✔️ Certification\n\n👉 Choose a program to see details:',
            options: [
                { label: '🎓 Digital Marketing', nextStep: 'course_dm' },
                { label: '💻 Full Stack Development', nextStep: 'course_fs' },
                { label: '📊 Data Analytics', nextStep: 'course_da' },
                { label: '🎬 Video Editing', nextStep: 'course_ve' },
                { label: '💼 Job-Ready Skills', nextStep: 'academy_mentor' }
            ]
        });

        // --- Path 3: Placement Support ---
        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'talents_placement_intro',
            question: 'We don’t just train — we place 👍\n\n📄 **Placement Opportunities:**\n✔️ Fresher Jobs | ✔️ Local Company Openings\n✔️ Immediate Joining | ✔️ Expert Guidance\n\n👉 How would you like to proceed?',
            options: [
                { label: 'Collect Basic Details', nextStep: 'talents_job_details' },
                { label: 'Talk to mentor', nextStep: 'talents_team_msg' }
            ]
        });

        // --- Path 4: Talk to Team ---
        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'talents_team_msg',
            question: 'Perfect 👍\nYou can directly connect with our mentor for guidance:\n📞 Call: 9403892971\n💬 WhatsApp: https://wa.me/919944940051\nFeel free to ask any doubts anytime 👍',
            nextStep: 'multi_enquiry_loop'
        });

        // ================================================================
        // III. REAL ESTATE WITH KAMAR FLOW
        // ================================================================
        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'namma_pondy_entry',
            question: '👋 Hi! Welcome to **Real Estate with Kamar** 🏡\nYour Trusted Property Partner in Pondicherry\n\n👉 What are you looking for?',
            options: [
                { label: '1️⃣ Buy Property', nextStep: 'prop_buy_budget' },
                { label: '2️⃣ Sell Property', nextStep: 'prop_sell_type' },
                { label: '3️⃣ Investment Advice', nextStep: 'prop_invest_entry' },
                { label: '4️⃣ Talk to Expert', nextStep: 'prop_expert_msg' }
            ]
        });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'prop_buy_budget', question: 'Great choice 👍 👉 Tell me your **Budget Range**:', captureMapping: 'property_budget', options: [ { label: '10L – 20L', nextStep: 'prop_buy_location' }, { label: '20L – 50L', nextStep: 'prop_buy_location' }, { label: '50L+', nextStep: 'prop_buy_location' } ] });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'prop_buy_location', question: 'Got it! Preferred Location? (Letters only)', captureMapping: 'property_pref_location', nextStep: 'prop_buy_cta' });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'prop_buy_cta', question: '📞 9403892971\n💬 https://wa.me/919944940051', options: [ { label: 'Show Property', nextStep: 'prop_showcase_final' } ] });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'prop_sell_type', question: 'Property Type? (Letters only)', captureMapping: 'property_type', nextStep: 'prop_sell_location' });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'prop_sell_location', question: 'Location? (Letters only)', captureMapping: 'property_sell_location', nextStep: 'prop_sell_price' });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'prop_sell_price', question: 'Expected Price?', captureMapping: 'property_price', nextStep: 'prop_sell_finish' });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'prop_sell_finish', question: '✅ Thank you!', nextStep: 'multi_enquiry_loop' });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'prop_invest_entry', question: '📊 Hot Locations: ECR, Villianur\n👉 What do you want?', options: [ { label: 'Current Deals', nextStep: 'prop_showcase_final' }, { label: 'ROI Details', nextStep: 'prop_invest_roi' } ] });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'prop_invest_roi', question: '📈 15-20% ROI annually.', options: [ { label: 'Show Deals', nextStep: 'prop_showcase_final' } ] });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'prop_showcase_final', question: '🏡 **Featured Properties**\n🔥 Limited plots available', options: [ { label: 'Photos', nextStep: 'prop_media_msg' }, { label: '👉 DOUBT', nextStep: 'prop_objections_start' } ] });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'prop_media_msg', question: 'Sending links... 👉 Trust Details?', options: [ { label: 'Yes', nextStep: 'prop_trust_final' } ] });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'prop_trust_final', question: '🤝 Verified only | Transparent pricing\n👉 Doubts?', options: [ { label: 'DOUBT', nextStep: 'prop_objections_start' } ] });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'prop_objections_start', question: 'What is your doubt?', options: [ { label: 'Is this genuine?', nextStep: 'prop_obs_genuine' }, { label: 'Price High', nextStep: 'prop_obs_price' }, { label: 'Team', nextStep: 'prop_expert_msg' } ] });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'prop_obs_genuine', question: '100% genuine 👍', options: [ { label: 'Show Property', nextStep: 'prop_showcase_final' } ] });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'prop_obs_price', question: 'Budget options available.', options: [ { label: 'Under 10L', nextStep: 'prop_showcase_final' } ] });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'prop_expert_msg', question: '📞 9403892971\n💬 https://wa.me/919944940051', nextStep: 'multi_enquiry_loop' });

        // ================================================================
        // IV. BM TECHX FLOW
        // ================================================================
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'techx_entry', question: '👋 Welcome to BM TechX 🚀\n👉 What are you looking for?', options: [ { label: '1️⃣ Ads / Leads', nextStep: 'tech_leads' }, { label: '2️⃣ Social Media', nextStep: 'tech_smm' }, { label: '3️⃣ Website', nextStep: 'tech_web' }, { label: '4️⃣ Branding', nextStep: 'tech_branding' } ] });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'tech_leads', question: '🔥 Lead Generation\n💰 Starts from ₹4,999', options: [ { label: 'Case Studies', nextStep: 'tech_demo_calendar_date' }, { label: 'Free Consultation', nextStep: 'tech_demo_calendar_date' } ] });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'tech_smm', question: '📱 Social Media Growth\n💰 Starts from ₹4,999/mo', options: [ { label: 'Portfolio', nextStep: 'tech_demo_calendar_date' }, { label: 'Talk to Expert', nextStep: 'tech_expert_msg' } ] });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'tech_web', question: '🌐 Website Development\n💰 Starts from ₹2,999', options: [ { label: 'Portfolio', nextStep: 'tech_demo_calendar_date' }, { label: 'Talk to Expert', nextStep: 'tech_expert_msg' } ] });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'tech_branding', question: '🎨 Branding Services', options: [ { label: 'Portfolio', nextStep: 'tech_demo_calendar_date' }, { label: 'Free Consultation', nextStep: 'tech_demo_calendar_date' } ] });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'tech_demo_calendar_date', question: '📅 Please select your preferred **date**:', captureMapping: 'demo_date', nextStep: 'tech_demo_calendar_time' });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'tech_demo_calendar_time', question: '✅ Now choose a **time slot**:', captureMapping: 'demo_time', nextStep: 'multi_enquiry_loop' });
        await FlowStep.create({ flowId: masterFlow._id, stepId: 'tech_expert_msg', question: '📞 9403892971\n💬 WhatsApp: https://wa.me/919944940051', nextStep: 'multi_enquiry_loop' });

        // ================================================================
        // UNIVERSAL MULTI-ENQUIRY LOOP & END
        // ================================================================

        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'multi_enquiry_loop',
            question: 'I’ve added that to your enquiry list! ✅\n\nWould you like to enquire about **anything else** or finish?',
            options: [
                { label: '➕ Add Another Service', nextStep: 'main_menu' },
                { label: '🏁 Finish & Submit All', nextStep: 'final_thank_you' }
            ]
        });

        await FlowStep.create({
            flowId: masterFlow._id,
            stepId: 'final_thank_you',
            question: '🙏 Thank you, {name}!\nOur team will guide you throughout the process 🚀\n\nIf you have any questions, feel free to message us anytime 😊',
            tagsOnReach: ['Final Submission']
        });

        console.log('--- FINAL CORE TALENTS OVERHAUL SEEDED SUCCESS ---');
        process.exit();
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
};

seed();
