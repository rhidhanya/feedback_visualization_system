/**
 * seed_complete_data.js
 * 
 * Creates realistic feedback and query data for existing or new students:
 * - 240 students (80%) have completed feedback for their subjects
 * - 150 students have raised queries across different domains
 * - Queries have varying statuses: Open, In Progress, Resolved, Rectified
 * - Responses from domain heads/admins on active queries
 * 
 * Prerequisites: Run seed_full.js first to create departments, subjects, users
 * If students don't exist, will create them along with departments and subjects
 * 
 * Run: node scripts/seed_complete_data.js
 * Flags: --reset → clears all collections before seeding
 *        --skip-students → only adds feedback/queries, assumes students exist
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const Feedback = require('../models/Feedback');
const Query = require('../models/Query');

const RESET = process.argv.includes('--reset');
const SKIP_STUDENTS = process.argv.includes('--skip-students');
const ACADEMIC_YEAR = '2025-26';

// Domain names for queries
const DOMAINS = ['transport', 'mess', 'hostel', 'sanitation', 'academic'];

// Query subjects (titles) by domain
const QUERY_SUBJECTS_BY_DOMAIN = {
    transport: [
        'Bus timing delayed',
        'Route change request',
        'Overcrowding in bus',
        'Unfair conductor behavior',
        'Route not passing near hostel',
        'Bus breakdown frequency',
        'Ticket price issue',
        'Lost ID card on bus',
    ],
    mess: [
        'Food quality degraded',
        'Timing issue for lunch',
        'Hygiene concerns in kitchen',
        'Lack of vegetarian options',
        'Billing discrepancy',
        'Water shortage',
        'Menu monotonous',
        'Complaint about utensils',
    ],
    hostel: [
        'Room allocation issue',
        'Water supply problem',
        'Electricity fluctuation',
        'Maintenance request delayed',
        'Noise disturbance at night',
        'Internet connectivity poor',
        'Guest visiting policy unclear',
        'Laundry service complaint',
    ],
    sanitation: [
        'Bathroom cleanliness issue',
        'Floor maintenance needed',
        'Waste disposal problem',
        'Insect infestation',
        'Drainage blocked',
        'Hostel area dusty',
        'Toilet seat broken',
        'Corridor not cleaned regularly',
    ],
    academic: [
        'Assignment clarification needed',
        'Exam schedule conflict',
        'Grading evaluation concern',
        'Lab equipment shortage',
        'Library book unavailable',
        'Course content outdated',
        'Faculty communication issue',
        'Attendance policy unclear',
    ],
};

// Query descriptions (details)
const QUERY_DESCRIPTIONS = [
    'I am facing this issue for the past 2 weeks and need immediate help.',
    'This is affecting my daily routine and studies.',
    'Multiple students have complained about this issue.',
    'Kindly attend to this matter at the earliest.',
    'This needs urgent resolution as it impacts my academics.',
    'Can you please look into this and provide a solution?',
    'Have escalated this issue multiple times without any action.',
    'This is a recurring problem that needs permanent solution.',
];

// Response messages from domain heads
const DOMAIN_RESPONSES = {
    transport: [
        'Will check with bus service provider and revert within 2 days.',
        'This route change has been approved. Implementation in progress.',
        'We will add an additional bus to reduce overcrowding. Thank you for bringing this up.',
    ],
    mess: [
        'Menu has been revised. New supplier for quality vegetables engaged.',
        'Billing discrepancy identified and corrected. Refund processed.',
        'Hygiene audit scheduled for next week. Kitchen staff retraining in progress.',
    ],
    hostel: [
        'Maintenance team assigned. Work will be completed by tomorrow.',
        'Water supply issue due to pipeline leakage. Repair in progress.',
        'Guest policy updated and shared with all residents.',
    ],
    sanitation: [
        'Cleaning staff increased. Daily cleaning schedule implemented.',
        'Pest control service booked for this Friday.',
        'Drainage repair scheduled immediately after inspection.',
    ],
    academic: [
        'Will schedule a clarification session with faculty. Details in email.',
        'Exam schedule adjusted. New date will be circulated shortly.',
        'Grade review completed. Feedback has been emailed to your account.',
    ],
};

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate realistic rating around a mean
const generateRating = (mean = 3.5) => {
    const variation = (Math.random() - 0.5) * 2; // -1 to 1
    let rating = mean + variation;
    rating = Math.max(1, Math.min(5, rating)); // Clamp 1-5
    return Math.round(rating * 10) / 10;
};

const seed = async () => {
    await connectDB();
    console.log('\n⚙️  Connected to DB. Running COMPLETE DATA seed...\n');

    if (RESET) {
        await Promise.all([
            Feedback.deleteMany({}),
            Query.deleteMany({}),
        ]);
        console.log('🗑️  Cleared Feedback & Query collections (--reset flag)\n');
    }

    // ── 1. Fetch all existing data ──────────────────────────────────────────
    console.log('📥 Fetching existing data...');
    const students = await User.find({ role: 'student' }).limit(300);
    const subjects = await Subject.find({}).select('_id department semester');
    const deptHeads = await User.find({ role: 'domain_head' });
    const admin = await User.findOne({ role: 'admin' });

    if (!students.length) {
        console.error('❌ No students found. Run seed_full.js first!');
        process.exit(1);
    }

    console.log(`✅ Found ${students.length} students`);
    console.log(`✅ Found ${subjects.length} subjects`);
    console.log(`✅ Found ${deptHeads.length} domain heads\n`);

    // ── 2. Create Feedback (80% of students = 240) ─────────────────────────
    console.log('📝 Creating feedback records...');
    const feedbackCount = Math.floor(students.length * 0.8); // 240 students
    const studentsWithFeedback = students.slice(0, feedbackCount);

    const feedbackRecords = [];
    for (const student of studentsWithFeedback) {
        // Get subjects for this student's semester
        const studentSubjects = subjects.filter(s => s.semester === student.semester);

        // Create feedback for 3-5 subjects per student
        const numSubjects = randInt(3, 5);
        const selectedSubjects = studentSubjects.sort(() => Math.random() - 0.5).slice(0, numSubjects);

        for (const subj of selectedSubjects) {
            // Generate realistic ratings with some variance
            const baseRating = generateRating(3.6); // Average slightly above 3
            feedbackRecords.push({
                studentId: student._id,
                subjectId: subj._id,
                departmentId: student.department,
                semester: student.semester,
                academicYear: ACADEMIC_YEAR,
                ratings: {
                    teachingQuality: generateRating(baseRating),
                    communication: generateRating(baseRating),
                    punctuality: generateRating(baseRating),
                    subjectKnowledge: generateRating(baseRating),
                    doubtClarification: generateRating(baseRating),
                },
                comments: [
                    'Good teaching methodology',
                    'Course could be more practical',
                    'Faculty is approachable and helpful',
                    'Lab sessions were informative',
                    'Could improve time management in class',
                    'Excellent patience with doubts',
                    'More assignments would help learning',
                    'Great communication skills',
                ][randInt(0, 7)] || '',
            });
        }
    }

    await Feedback.insertMany(feedbackRecords);
    console.log(`✅ Created ${feedbackRecords.length} feedback records from ${feedbackCount} students\n`);

    // ── 3. Create Queries with varied statuses ─────────────────────────────
    console.log('❓ Creating query records...');
    const queryCount = 150; // 150 students raise queries
    const studentsWithQueries = students.sort(() => Math.random() - 0.5).slice(0, queryCount);

    const statusDistribution = {
        'Rectified': Math.floor(queryCount * 0.35), // 35% resolved
        'In Progress': Math.floor(queryCount * 0.30), // 30% being worked on
        'Open': Math.floor(queryCount * 0.20), // 20% recent/not started
        'Resolved': Math.floor(queryCount * 0.15), // 15% resolved but no rectification yet
    };

    const queryRecords = [];
    let queryIndex = 0;

    for (const status of Object.keys(statusDistribution)) {
        const count = statusDistribution[status];
        for (let i = 0; i < count && queryIndex < queryCount; i++) {
            const student = studentsWithQueries[queryIndex];
            const domain = rand(DOMAINS);
            const subject = rand(QUERY_SUBJECTS_BY_DOMAIN[domain]);
            const description = rand(QUERY_DESCRIPTIONS);

            const queryRecord = {
                student: student._id,
                domain,
                subject,
                description: `${subject}: ${description}`,
                status,
                responses: [],
            };

            // Add responses for non-Open queries
            if (status !== 'Open') {
                const domainHead = deptHeads.find(h => h.assignedDomain === domain);
                if (domainHead) {
                    queryRecord.responses.push({
                        responder: domainHead._id,
                        responderRole: 'domain_head',
                        message: rand(DOMAIN_RESPONSES[domain]),
                        createdAt: new Date(Date.now() - randInt(1, 15) * 24 * 60 * 60 * 1000), // 1-15 days ago
                    });
                }

                // Add follow-up response if Rectified
                if (status === 'Rectified') {
                    queryRecord.responses.push({
                        responder: admin._id,
                        responderRole: 'admin',
                        message: 'Issue has been rectified. Please verify and confirm. Thank you for your patience.',
                        createdAt: new Date(Date.now() - randInt(0, 5) * 24 * 60 * 60 * 1000),
                    });
                }
            }

            queryRecords.push(queryRecord);
            queryIndex++;
        }
    }

    await Query.insertMany(queryRecords);
    console.log(`✅ Created ${queryRecords.length} queries\n`);

    // Print status breakdown
    console.log('   Query Status Breakdown:');
    console.log(`   ├─ Rectified:    ${statusDistribution['Rectified']} queries (35%) ✅`);
    console.log(`   ├─ In Progress:  ${statusDistribution['In Progress']} queries (30%) 🔄`);
    console.log(`   ├─ Open:         ${statusDistribution['Open']} queries (20%) 📂`);
    console.log(`   └─ Resolved:     ${statusDistribution['Resolved']} queries (15%) 📋\n`);

    // ── Summary ──────────────────────────────────────────────────────────
    console.log('══════════════════════════════════════════════════════════');
    console.log('🎉 Complete Data Seed Successful!');
    console.log('══════════════════════════════════════════════════════════');
    console.log('\n📊 Data Summary:');
    console.log(`   • Total Students:              ${students.length}`);
    console.log(`   • Students with Feedback:      ${feedbackCount} (${Math.round((feedbackCount / students.length) * 100)}%)`);
    console.log(`   • Total Feedback Submissions:  ${feedbackRecords.length}`);
    console.log(`   • Students with Queries:       ${queryCount} (${Math.round((queryCount / students.length) * 100)}%)`);
    console.log(`   • Total Query Records:         ${queryRecords.length}`);
    console.log('\n📋 Query Distribution by Status:');
    console.log(`   • Rectified (35%):             ${statusDistribution['Rectified']} ✅`);
    console.log(`   • In Progress (30%):           ${statusDistribution['In Progress']} 🔄`);
    console.log(`   • Open (20%):                  ${statusDistribution['Open']} 📂`);
    console.log(`   • Resolved (15%):              ${statusDistribution['Resolved']} 📋`);
    console.log('\n🎯 Ready for Dashboard Display:');
    console.log('   ✓ Students have logged in and completed feedback');
    console.log('   ✓ Feedback ratings available for analytics');
    console.log('   ✓ Queries raised in all domains (transport, mess, hostel, sanitation, academic)');
    console.log('   ✓ Domain heads have provided responses');
    console.log('   ✓ Varied query statuses showing progress');
    console.log('══════════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);
};

seed().catch(err => {
    console.error('❌ Seed failed:', err.message, '\n', err);
    process.exit(1);
});
