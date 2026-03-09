/**
 * seed_feedback_queries_fast.js
 * 
 * Fast seed script that creates/updates feedback and query data
 * Works with existing students or creates minimal test data
 * 
 * Run: node scripts/seed_feedback_queries_fast.js
 * Flags: --reset → clear Feedback & Query before seeding
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const connectDB = require('../config/db');

const User = require('../models/User');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const Feedback = require('../models/Feedback');
const Query = require('../models/Query');

const RESET = process.argv.includes('--reset');
const ACADEMIC_YEAR = '2025-26';

const DOMAINS = ['transport', 'mess', 'hostel', 'sanitation', 'academic'];

const QUERY_SUBJECTS_BY_DOMAIN = {
    transport: [
        'Bus timing delayed', 'Route change request', 'Overcrowding in bus', 'Unfair conductor behavior',
        'Route not passing near hostel', 'Bus breakdown frequency', 'Ticket price issue', 'Lost ID card on bus',
    ],
    mess: [
        'Food quality degraded', 'Timing issue for lunch', 'Hygiene concerns in kitchen', 'Lack of vegetarian options',
        'Billing discrepancy', 'Water shortage', 'Menu monotonous', 'Complaint about utensils',
    ],
    hostel: [
        'Room allocation issue', 'Water supply problem', 'Electricity fluctuation', 'Maintenance request delayed',
        'Noise disturbance at night', 'Internet connectivity poor', 'Guest visiting policy unclear', 'Laundry service complaint',
    ],
    sanitation: [
        'Bathroom cleanliness issue', 'Floor maintenance needed', 'Waste disposal problem', 'Insect infestation',
        'Drainage blocked', 'Hostel area dusty', 'Toilet seat broken', 'Corridor not cleaned regularly',
    ],
    academic: [
        'Assignment clarification needed', 'Exam schedule conflict', 'Grading evaluation concern', 'Lab equipment shortage',
        'Library book unavailable', 'Course content outdated', 'Faculty communication issue', 'Attendance policy unclear',
    ],
};

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

const FIRST_NAMES = [
    'Aarav', 'Aditi', 'Aditya', 'Akash', 'Ananya', 'Arun', 'Arjun', 'Aruna', 'Aswini',
    'Bhavana', 'Chandrika', 'Deepa', 'Deepika', 'Divya', 'Divyesh', 'Ganesh', 'Geethu', 'Govind', 'Hari',
    'Harini', 'Harish', 'Ishaan', 'Janani', 'Karthik', 'Kavitha', 'Keerthi', 'Krishnan', 'Kumar', 'Lakshmi',
];

const LAST_NAMES = [
    'Krishnan', 'Nair', 'Pillai', 'Rao', 'Sharma', 'Kumar', 'Menon', 'Iyer', 'Subramaniam', 'Reddy',
    'Patel', 'Varma', 'Singh', 'Verma', 'Das', 'Roy', 'Mehta', 'Ghosh', 'Mishra', 'Pandey',
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const generateRating = (mean = 3.5) => {
    const variation = (Math.random() - 0.5) * 2;
    let rating = mean + variation;
    rating = Math.max(1, Math.min(5, rating));
    return Math.round(rating * 10) / 10;
};

const seed = async () => {
    await connectDB();
    console.log('\n⚙️  Connected to DB. Running FAST FEEDBACK & QUERY seed...\n');

    if (RESET) {
        await Promise.all([
            Feedback.deleteMany({}),
            Query.deleteMany({}),
        ]);
        console.log('🗑️  Cleared Feedback & Query collections\n');
    }

    try {
        // ── 1. Fetch or create minimal data ──────────────────────────────────
        console.log('📥 Checking student data...');
        let students = await User.find({ role: 'student' }).limit(300);
        let subjects = await Subject.find({}).select('_id department semester');
        let deptHeads = await User.find({ role: 'domain_head' });
        let admin = await User.findOne({ role: 'admin' });

        // If no students exist, create minimal test data
        if (!students.length) {
            console.log('🚀 Creating minimal test data for demonstration...\n');

            // Create department
            let dept = await Department.findOne({ code: 'CSE' });
            if (!dept) {
                dept = await Department.create({
                    name: 'Computer Science Engineering',
                    code: 'CSE',
                    cluster: 'CS Cluster',
                    description: 'CSE Department',
                });
                console.log('   ✅ Created CSE Department');
            }

            // Use existing subjects from seed_full
            subjects = await Subject.find({}).select('_id department semester');
            if (subjects.length === 0) {
                console.log('   ⚠️  No subjects found in database.');
                console.log('   ℹ️  If you want feedback to work properly, run seed_full.js first.\n');
            } else {
                console.log(`   ✅ Found ${subjects.length} existing subjects\n`);
            }

            // Create admin if doesn't exist
            if (!admin) {
                admin = await User.create({
                    name: 'System Admin',
                    email: 'admin@bitsathy.in',
                    password: 'admin123',
                    role: 'admin',
                });
                console.log('   ✅ Created admin user');
            }

            // Create domain heads if don't exist
            const domainHeadEmails = [
                { email: 'transport-head@bitsathy.in', domain: 'transport' },
                { email: 'mess-manager@bitsathy.in', domain: 'mess' },
                { email: 'hostel-manager@bitsathy.in', domain: 'hostel' },
                { email: 'sanitation-incharge@bitsathy.in', domain: 'sanitation' },
            ];

            for (const dh of domainHeadEmails) {
                const existing = await User.findOne({ email: dh.email });
                if (!existing) {
                    await User.create({
                        name: `${dh.domain.charAt(0).toUpperCase() + dh.domain.slice(1)} Head`,
                        email: dh.email,
                        password: 'incharge123',
                        role: 'domain_head',
                        assignedDomain: dh.domain,
                    });
                }
            }
            deptHeads = await User.find({ role: 'domain_head' });
            console.log(`   ✅ Created/found ${deptHeads.length} domain heads\n`);

            // Create 300 test students
            console.log('👩‍🎓 Creating 300 test students...');
            const testStudents = [];
            for (let i = 0; i < 300; i++) {
                const sem = (i % 4) + 1;
                const firstName = rand(FIRST_NAMES);
                const lastName = rand(LAST_NAMES);
                testStudents.push({
                    name: `${firstName} ${lastName}`,
                    email: `student${i + 1}@bitsathy.in`,
                    password: 'student123',
                    role: 'student',
                    rollNumber: `CSE${String(i + 1).padStart(4, '0')}`,
                    department: dept._id,
                    semester: sem,
                    residenceType: i % 2 === 0 ? 'hosteller' : 'dayscholar',
                    academicYear: ACADEMIC_YEAR,
                });
            }
            students = await User.insertMany(testStudents);
            console.log(`   ✅ Created ${students.length} students (email format: student#@bitsathy.in)\n`);
        } else {
            console.log(`✅ Found ${students.length} existing students`);
            console.log(`✅ Found ${subjects.length} subjects`);
            console.log(`✅ Found ${deptHeads.length} domain heads\n`);
        }

        // ── 2. Create Feedback (80% of students) ────────────────────────────
        console.log('📝 Creating feedback records...');
        const feedbackCount = Math.floor(students.length * 0.8);
        const studentsWithFeedback = students.slice(0, feedbackCount);

        const feedbackRecords = [];
        for (const student of studentsWithFeedback) {
            const studentSubjects = subjects.filter(s => s.semester === student.semester);
            const numSubjects = Math.min(randInt(3, 5), studentSubjects.length);
            const selectedSubjects = studentSubjects.sort(() => Math.random() - 0.5).slice(0, numSubjects);

            for (const subj of selectedSubjects) {
                const baseRating = generateRating(3.6);
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
                    ][randInt(0, 4)] || '',
                });
            }
        }

        await Feedback.insertMany(feedbackRecords);
        console.log(`✅ Created ${feedbackRecords.length} feedback records\n`);

        // ── 3. Create Queries with varied statuses ──────────────────────────
        console.log('❓ Creating query records...');
        const queryCount = 150;
        const studentsWithQueries = students.sort(() => Math.random() - 0.5).slice(0, queryCount);

        const statusDistribution = {
            'Rectified': Math.floor(queryCount * 0.35),
            'In Progress': Math.floor(queryCount * 0.30),
            'Open': Math.floor(queryCount * 0.20),
            'Resolved': Math.floor(queryCount * 0.15),
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

                if (status !== 'Open') {
                    const domainHead = deptHeads.find(h => h.assignedDomain === domain);
                    if (domainHead) {
                        queryRecord.responses.push({
                            responder: domainHead._id,
                            responderRole: 'domain_head',
                            message: rand(DOMAIN_RESPONSES[domain]),
                            createdAt: new Date(Date.now() - randInt(1, 15) * 24 * 60 * 60 * 1000),
                        });
                    }

                    if (status === 'Rectified' && admin) {
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

        // ── Summary ──────────────────────────────────────────────────────────
        console.log('══════════════════════════════════════════════════════════');
        console.log('🎉 Feedback & Query Seed Successful!');
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
        console.log('\n🎯 Dashboard Ready!');
        console.log('   ✓ Students have logged in (records created)');
        console.log('   ✓ Feedback ratings available for analytics');
        console.log('   ✓ Queries raised across all domains');
        console.log('   ✓ Domain heads have responded to queries');
        console.log('   ✓ Varied query statuses showing progress');
        console.log('══════════════════════════════════════════════════════════\n');

        await mongoose.disconnect();
        process.exit(0);

    } catch (err) {
        console.error('❌ Error:', err.message);
        await mongoose.disconnect();
        process.exit(1);
    }
};

seed().catch(err => {
    console.error('❌ Seed failed:', err.message, '\n', err);
    process.exit(1);
});
