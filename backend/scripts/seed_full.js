/**
 * seed_full.js
 * Creates:
 *  – 1  Admin    (admin@bitsathy.in / admin123)
 *  – 1  Dean     (dean@bitsathy.in / admin123)
 *  – 1  Principal(principal@bitsathy.in / admin123)
 *  – 4  Incharges(domain_head role, one per domain, incharge123)
 *  – 100 Faculty   (faculty123, linked to subjects)
 *  – 300 Students  (student123, spread across 8 depts × semesters)
 *
 * Run: node scripts/seed_full.js
 * Flags: --reset   → clears ALL collections before seeding
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Department = require('../models/Department');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Feedback = require('../models/Feedback');

const RESET = process.argv.includes('--reset');
const ACADEMIC_YEAR = '2025-26';

// ── Departments ───────────────────────────────────────────────────────────
const DEPT_DEFS = [
    { name: 'Computer Science Engineering', code: 'CSE', cluster: 'CS Cluster' },
    { name: 'Information Technology', code: 'IT', cluster: 'CS Cluster' },
    { name: 'Computer Science & Business', code: 'CSBS', cluster: 'CS Cluster' },
    { name: 'Mechanical Engineering', code: 'MECH', cluster: 'Core Cluster' },
    { name: 'Electronics & Communication', code: 'ECE', cluster: 'Core Cluster' },
    { name: 'Electrical & Electronics', code: 'EEE', cluster: 'Core Cluster' },
    { name: 'Biotechnology', code: 'BIO', cluster: 'Core Cluster' },
    { name: 'Agriculture Engineering', code: 'AGRI', cluster: 'Core Cluster' },
];

// ── Faculty Pool (12-13 per dept = 100 total) ─────────────────────────────
const FACULTY = {
    CSE: [
        'suresh.nair', 'meena.rao', 'arjun.pillai', 'divya.krishnan', 'naresh.babu',
        'sangeetha.mohan', 'vijay.kumar.cse', 'anjali.mehta', 'priya.cs', 'karan.cs',
        'lakshmi.cs', 'rahul.cs', 'deepika.cs',
    ],
    IT: [
        'rajesh.pillai', 'kavitha.rajan', 'senthil.kumar', 'rekha.nambiar', 'mohan.raj',
        'padma.vasan', 'vivek.anand', 'nithya.lakshmi', 'arun.it', 'jaya.it',
        'siva.it', 'mala.it',
    ],
    CSBS: [
        'arun.balaji', 'mythili.prasad', 'gopal.sundar', 'janani.krishnan', 'sunil.chandra',
        'vimala.devi', 'rajan.selvam', 'deepika.srinivas', 'preethi.csbs', 'karthi.csbs',
        'usha.csbs', 'nisha.csbs',
    ],
    MECH: [
        'ganesh.menon', 'deepa.iyer', 'balaji.subramanian', 'karan.mathur', 'saravanan.k',
        'renuka.devi', 'mohanraj.p', 'usha.rani.mech', 'anand.mech', 'priya.mech',
        'ravi.mech', 'sai.mech',
    ],
    ECE: [
        'ranjith.ramesh', 'lavanya.bose', 'sathish.kumar.ece', 'meera.pillai', 'chandran.nair',
        'bhuvana.r', 'anand.roshan', 'sumathy.t', 'gowri.ece', 'vikram.ece',
        'harini.ece', 'prasad.ece',
    ],
    EEE: [
        'vinod.krishnan', 'shanthi.pandian', 'murali.mohan', 'geetha.ravi', 'prasanna.kumar',
        'nalini.suresh', 'prakash.t', 'saranya.devi', 'suresh.eee', 'devi.eee',
        'balu.eee', 'kalpana.eee',
    ],
    BIO: [
        'anitha.raj', 'sudhir.balan', 'malathi.s', 'deepak.nambiar', 'preethi.menon',
        'kiran.babu', 'vasantha.kumar', 'nirmala.devi', 'sowmya.bio', 'gopal.bio',
        'kavya.bio', 'rohit.bio',
    ],
    AGRI: [
        'balasub.v', 'kamala.devi', 'selvaraj.p', 'hemavathy.r', 'pandian.k',
        'suganya.m', 'thirumal.n', 'valarmathy.s', 'arul.agri', 'devi.agri',
        'karthik.agri', 'priya.agri',
    ],
};

// ── Subject templates (5 subjects × 8 semesters × dept) ──────────────────
const SUBJECT_TEMPLATES = {
    CSE: [
        ['Calculus & Linear Algebra', 'Engineering Physics', 'Programming in C', 'Engineering Graphics', 'Basics of Electrical Engg'],
        ['Data Structures', 'OOP with Java', 'Digital Systems Design', 'Probability & Statistics', 'Environmental Science'],
        ['Design & Analysis of Algorithms', 'Operating Systems', 'DBMS', 'Software Engineering', 'Discrete Mathematics'],
        ['Computer Networks', 'Compiler Design', 'Theory of Computation', 'Web Technologies', 'Microprocessors'],
        ['Artificial Intelligence', 'Machine Learning', 'Cloud Computing', 'Cryptography', 'Mobile App Dev'],
        ['Deep Learning', 'Big Data', 'IoT', 'Distributed Systems', 'Elective I'],
        ['NLP', 'Computer Vision', 'Blockchain', 'Software Testing', 'Professional Ethics'],
        ['Project Phase I', 'Project Phase II', 'Entrepreneurship', 'IPR & Patent Law', 'Internship Report'],
    ],
    IT: [
        ['Engineering Mathematics I', 'Engineering Physics', 'Problem Solving Python', 'Basic EE', 'Engg Graphics'],
        ['Engineering Mathematics II', 'DSA', 'Digital Electronics', 'Database Design', 'Web Design'],
        ['Computer Networks', 'System Analysis & Design', 'Java Programming', 'Linux Admin', 'SPM'],
        ['Network Security', 'Cloud Infrastructure', 'Business Analytics', 'Mobile Computing', 'OOD'],
        ['Big Data Processing', 'AI & Data Mining', 'ERP', 'Digital Marketing', 'UI/UX Design'],
        ['Machine Learning Applications', 'DevOps', 'ITSM', 'Cyber Security', 'API Dev'],
        ['Capstone Planning', 'Emerging Technologies', 'IT Governance', 'Agile', 'IS Audit'],
        ['Final Project', 'Startup Tech', 'IT Consulting', 'Open Source', 'Industry Report'],
    ],
    CSBS: [
        ['Business Mathematics', 'Principles of Management', 'Accounting & Finance', 'Communication', 'Fundamentals of Computing'],
        ['Statistics for Business', 'Business Economics', 'Database for Business', 'Spreadsheet Analytics', 'BPM'],
        ['Operations Research', 'Marketing Management', 'BI Tools', 'ERP Systems', 'Data Visualization'],
        ['Supply Chain Management', 'CRM Tech', 'Business Law', 'Financial Analytics', 'HR Tech'],
        ['E-Commerce', 'IT Project Mgmt', 'Business Forecasting', 'Decision Models', 'Digital Transformation'],
        ['Business Analytics & ML', 'Enterprise Systems', 'Risk Management', 'Innovation', 'Corporate Strategy'],
        ['Business Capstone I', 'Fintech Applications', 'Consulting Skills', 'Global Business', 'M&A (IT)'],
        ['Business Capstone II', 'Entrepreneurship Mgmt', 'Social Media Analytics', 'CSR', 'Placement Readiness'],
    ],
    MECH: [
        ['Engg Math I', 'Engg Physics', 'Engg Chemistry', 'Engg Graphics', 'Workshop Practice'],
        ['Engg Math II', 'Mechanics of Solids', 'Thermodynamics', 'Manufacturing Processes I', 'Fluid Mechanics'],
        ['Machine Elements', 'Kinematics', 'Manufacturing Processes II', 'Material Science', 'Thermal Engineering'],
        ['Dynamics of Machinery', 'Heat Transfer', 'CNC & Robotics', 'Industrial Metrology', 'Automobile Engg'],
        ['Advanced Manufacturing', 'FEA', 'Industrial Engg', 'Refrigeration', 'Mechatronics'],
        ['CAD/CAM', 'Tribology', 'NDT', 'Renewable Energy', 'Robotics & Automation'],
        ['Product Design', 'Industrial Safety', 'Operations Mgmt', 'Composite Materials', 'Hydraulics'],
        ['Project MECH I', 'Project MECH II', 'TQM', 'Entrepreneurship', 'Internship'],
    ],
    ECE: [
        ['Engg Math I', 'Engg Physics', 'Basic Electronics', 'Engg Graphics', 'Problem Solving'],
        ['Engg Math II', 'Network Analysis', 'EDC', 'Digital Electronics', 'Signals & Systems'],
        ['Analog Circuits', 'Digital Communication', 'EM Fields', 'Microprocessors', 'LIC'],
        ['VLSI Design', 'Communication Systems', 'Control Systems', 'DSP', 'Antenna & Wave Propagation'],
        ['RF & Microwave', 'Optical Communication', 'Robotics & Embedded Systems', 'Wireless Networks', 'Image Processing'],
        ['IoT System Design', 'FPGA Design', 'Satellite Communication', 'Medical Electronics', 'PCB Design'],
        ['AI for Signal Processing', '5G Technologies', 'Cognitive Radio', 'Smart Grid', 'Biomedical Signal'],
        ['Project ECE I', 'Project ECE II', 'Tech Entrepreneurship', 'Spectrum Management', 'Industry Report'],
    ],
    EEE: [
        ['Engg Math I', 'Engg Physics', 'Basic Mechanical Engg', 'Engg Graphics', 'Intro to EEE'],
        ['Engg Math II', 'Circuit Theory', 'Electronic Devices', 'Electrical Machines I', 'Measurements'],
        ['Power Systems I', 'Digital Electronics', 'Control Systems', 'Electrical Machines II', 'EM Theory'],
        ['Power Systems II', 'Power Electronics', 'Microprocessors in EE', 'High Voltage Engg', 'Switchgear & Protection'],
        ['Power System Analysis', 'Special Machines', 'Renewable Energy', 'Industrial Drives', 'Digital Control'],
        ['Power Quality', 'Smart Grid', 'Energy Auditing', 'FACTS', 'Electric Vehicles'],
        ['Substation Design', 'Distributed Gen', 'SCADA', 'Energy Storage', 'Professional Ethics'],
        ['Project EEE I', 'Project EEE II', 'Power Market Economics', 'Grid Integration', 'Internship'],
    ],
    BIO: [
        ['Biological Chemistry I', 'Maths for Biotech', 'Physics for Life Sciences', 'Intro to Biotech', 'Lab Skills'],
        ['Biological Chemistry II', 'Cell Biology & Genetics', 'Microbiology', 'Biophysics', 'Biostatistics'],
        ['Molecular Biology', 'Enzymology', 'Immunology', 'Bioinformatics I', 'Fermentation Technology'],
        ['Genetic Engineering', 'Downstream Processing', 'Plant Biotech', 'Bioinformatics II', 'Bioethics & IPR'],
        ['Industrial Biotech', 'Environmental Biotech', 'Medical Biotech', 'Genomics & Proteomics', 'Bioreactor Design'],
        ['Drug Delivery', 'Animal Cell Tech', 'Systems Biology', 'Nano Biotech', 'Food Biotech'],
        ['Cancer Biology', 'Stem Cell Tech', 'Marine Biotech', 'Regulatory Affairs', 'Biosafety'],
        ['Project Biotech I', 'Project Biotech II', 'Bioprocess Scale-up', 'Entrepreneurship', 'Internship'],
    ],
    AGRI: [
        ['Agricultural Mathematics', 'Agricultural Physics', 'Agricultural Chemistry', 'Intro to Agri Engg', 'Farm Machinery I'],
        ['Soil & Water Conservation', 'Agricultural Biology', 'Irrigation & Drainage', 'Farm Machinery II', 'Agronomy I'],
        ['Land & Water Resources', 'Agricultural Mechanization', 'Post Harvest Tech', 'Agronomy II', 'Agri Meteorology'],
        ['Precision Agriculture', 'Agricultural Structures', 'Crop Science', 'Remote Sensing', 'Agricultural Economics'],
        ['GIS for Agriculture', 'Agricultural Electrification', 'Food Processing', 'Protected Cultivation', 'Agricultural Statistics'],
        ['Watershed Management', 'Renewable Energy in Agri', 'Agricultural IS', 'Drip Irrigation', 'Weed Science'],
        ['Agri-Business Mgmt', 'Rural Development', 'Climate-Smart Agri', 'Vertical Farming', 'Agricultural Policy'],
        ['Project Agri I', 'Project Agri II', 'Farm Management', 'Organic Farming', 'Industry Report'],
    ],
};

// Indian first/last name pools for realistic student names
const FIRST_NAMES = [
    'Aarav', 'Aditi', 'Aditya', 'Akash', 'Ananya', 'Ananya', 'Arun', 'Arjun', 'Aruna', 'Aswini',
    'Bhavana', 'Chandrika', 'Deepa', 'Deepika', 'Divya', 'Divyesh', 'Ganesh', 'Geethu', 'Govind', 'Hari',
    'Harini', 'Harish', 'Ishaan', 'Janani', 'Karthik', 'Kavitha', 'Keerthi', 'Krishnan', 'Kumar', 'Lakshmi',
    'Lavanya', 'Manoj', 'Meena', 'Megha', 'Mohan', 'Monisha', 'Nisha', 'Nithya', 'Padma', 'Pooja',
    'Pradeep', 'Priya', 'Rahul', 'Rajan', 'Ramesh', 'Ranjith', 'Rekha', 'Rohit', 'Saravanan', 'Saranya',
    'Shruthi', 'Sindhu', 'Sneha', 'Sriram', 'Suresh', 'Swathi', 'Tarun', 'Thamizh', 'Uma', 'Varsha',
    'Vidhya', 'Vijay', 'Vimal', 'Vinod', 'Vishnu', 'Yamuna', 'Yogesh', 'Yuvaraj', 'Ziya', 'Renuka',
];
const LAST_NAMES = [
    'Krishnan', 'Nair', 'Pillai', 'Rao', 'Sharma', 'Kumar', 'Menon', 'Iyer', 'Subramaniam', 'Reddy',
    'Patel', 'Varma', 'Singh', 'Verma', 'Das', 'Roy', 'Mehta', 'Ghosh', 'Mishra', 'Pandey',
    'Rajan', 'Anandan', 'Srinivasan', 'Balaji', 'Kannan', 'Selvam', 'Murugan', 'Chandra', 'Babu', 'Devi',
];
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const seed = async () => {
    await connectDB();
    console.log('\n⚙️  Connected to DB. Running FULL seed...\n');

    if (RESET) {
        await Promise.all([
            Department.deleteMany({}),
            Subject.deleteMany({}),
            User.deleteMany({}),
            Feedback.deleteMany({}),
        ]);
        console.log('🗑️  Cleared all collections (--reset flag)\n');
    } else {
        // Remove old non-bitsathy.in users to avoid duplication issues
        await User.deleteMany({});
        console.log('🗑️  Cleared users for clean re-seed\n');
    }

    // ── 1. Departments ─────────────────────────────────────────────────────
    console.log('📂 Seeding departments...');
    await Department.deleteMany({});
    const deptDocs = await Department.insertMany(
        DEPT_DEFS.map(d => ({
            name: d.name, code: d.code, cluster: d.cluster,
            description: `${d.cluster} — ${d.code} Department`,
        }))
    );
    const deptMap = {}; // code → doc
    deptDocs.forEach(d => { deptMap[d.code] = d; });
    console.log(`✅ ${deptDocs.length} departments\n`);

    // ── 2. Subjects (5 × 8 sems × 8 depts = 320) ─────────────────────────
    console.log('📚 Seeding 320 subjects...');
    await Subject.deleteMany({});
    const allSubjects = [];
    for (const dept of DEPT_DEFS) {
        const deptDoc = deptMap[dept.code];
        const facPool = FACULTY[dept.code];
        const templates = SUBJECT_TEMPLATES[dept.code];
        for (let semIdx = 0; semIdx < 8; semIdx++) {
            const sem = semIdx + 1;
            for (let si = 0; si < 5; si++) {
                const facEmail = `${facPool[si % facPool.length]}@bitsathy.in`;
                allSubjects.push({
                    name: templates[semIdx][si],
                    subjectCode: `${dept.code}${sem}0${si + 1}`,
                    department: deptDoc._id,
                    facultyName: `Prof. ${facPool[si % facPool.length].replace(/\./g, ' ').split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}`,
                    facultyEmail: facEmail,
                    semester: sem,
                    academicYear: ACADEMIC_YEAR,
                    isActive: true,
                });
            }
        }
    }
    const subjectDocs = await Subject.insertMany(allSubjects);
    console.log(`✅ ${subjectDocs.length} subjects\n`);

    // ── 3. Admin ─────────────────────────────────────────────────────────
    console.log('👤 Seeding admin...');
    await User.create({ name: 'System Admin', email: 'admin@bitsathy.in', password: 'admin123', role: 'admin' });
    console.log('   ✅ admin@bitsathy.in / admin123\n');

    // ── 4. Dean & Principal ───────────────────────────────────────────────
    console.log('🎓 Seeding dean & principal...');
    await User.create({ name: 'Dr. Amitabh Sharma', email: 'dean@bitsathy.in', password: 'admin123', role: 'dean' });
    await User.create({ name: 'Dr. Rajeshwar Rao', email: 'principal@bitsathy.in', password: 'admin123', role: 'principal' });
    console.log('   ✅ dean@bitsathy.in / admin123');
    console.log('   ✅ principal@bitsathy.in / admin123\n');

    // ── 5. Domain Incharges ───────────────────────────────────────────────
    console.log('🔑 Seeding 4 domain incharges...');
    const incharges = [
        { name: 'Mr. Ravi Kumar', email: 'transport-head@bitsathy.in', assignedDomain: 'transport', password: 'password', role: 'domain_head' },
        { name: 'Ms. Sunita Sharma', email: 'mess-manager@bitsathy.in', assignedDomain: 'mess', password: 'password', role: 'domain_head' },
        { name: 'Mr. Anil Mehta', email: 'hostel-manager@bitsathy.in', password: 'password', assignedDomain: 'hostel', role: 'domain_head' },
        { name: 'Dr. Suresh Pillai', email: 'sanitation-head@bitsathy.in', password: 'password', assignedDomain: 'sanitation', role: 'domain_head' },
    ];
    for (const inc of incharges) {
        await User.create(inc);
    }
    console.log('   ✅ Used password "password" for incharges\n');

    // ── 5.5. HOD Users ────────────────────────────────────────────────────────
    console.log('👑 Seeding HODs for CSE, IT, and EEE...');
    const hodDefs = [
        { name: 'Dr. T. Senthil', email: 'cse-hod@bitsathy.in', hodId: 'CSH01', deptCode: 'CSE', password: 'password', role: 'hod' },
        { name: 'Dr. M. Lakshmi', email: 'it-hod@bitsathy.in', hodId: 'ITH01', deptCode: 'IT', password: 'password', role: 'hod' },
        { name: 'Dr. K. Nithya', email: 'eee-hod@bitsathy.in', hodId: 'EEH01', deptCode: 'EEE', password: 'password', role: 'hod' }
    ];
    
    let hodCount = 0;
    for (const def of hodDefs) {
        if (deptMap[def.deptCode]) {
            await User.create({
                ...def,
                department: deptMap[def.deptCode]._id
            });
            hodCount++;
        }
    }
    console.log(`   ✅ Seeded ${hodCount} HODs with password "password"\n`);

    // ── 6. Faculty (100 users across 8 depts) ─────────────────────────────
    console.log('👨‍🏫 Seeding 100 faculty users...');
    let facultyCount = 0;
    const facUserMap = {}; // email → userId
    for (const dept of DEPT_DEFS) {
        const facPool = FACULTY[dept.code];
        for (const facKey of facPool) {
            const email = `${facKey}@bitsathy.in`;
            const displayName = `Prof. ${facKey.replace(/\./g, ' ').split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}`;
            const facUser = await User.create({
                name: displayName, email,
                password: 'faculty123',
                role: 'faculty',
                department: deptMap[dept.code]._id,
            });
            facUserMap[email] = facUser._id;
            facultyCount++;
        }
    }

    // Link assignedSubjects to faculty
    for (const subj of subjectDocs) {
        if (subj.facultyEmail && facUserMap[subj.facultyEmail]) {
            await User.findByIdAndUpdate(facUserMap[subj.facultyEmail], {
                $addToSet: { assignedSubjects: subj._id }
            });
            await Subject.findByIdAndUpdate(subj._id, {
                faculty: facUserMap[subj.facultyEmail]
            });
        }
    }
    console.log(`✅ ${facultyCount} faculty users (password: faculty123)\n`);

    // ── 7. Students (300) ─────────────────────────────────────────────────
    console.log('👩‍🎓 Seeding 300 students...');
    const RESIDENCE_TYPES = ['hosteller', 'dayscholar'];
    let studentCount = 0;
    const studentsPerDept = Math.ceil(300 / DEPT_DEFS.length); // ~38
    const usedEmails = new Set();

    for (const dept of DEPT_DEFS) {
        for (let i = 0; i < studentsPerDept && studentCount < 300; i++) {
            const sem = (i % 8) + 1;
            const firstName = rand(FIRST_NAMES);
            const lastName = rand(LAST_NAMES);
            const displayName = `${firstName} ${lastName}`;
            const baseEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
            let email = `${baseEmail}${i + 1}@bitsathy.in`;
            // Ensure uniqueness
            while (usedEmails.has(email)) {
                email = `${baseEmail}${i + 1}_${rand(['a', 'b', 'c', 'd'])}@bitsathy.in`;
            }
            usedEmails.add(email);

            await User.create({
                name: displayName,
                email,
                password: 'student123',
                role: 'student',
                rollNumber: `${dept.code}${String(studentCount + 1).padStart(4, '0')}`,
                department: deptMap[dept.code]._id,
                semester: sem,
                residenceType: RESIDENCE_TYPES[studentCount % 2],
                academicYear: ACADEMIC_YEAR,
            });
            studentCount++;
        }
    }
    console.log(`✅ ${studentCount} students (password: student123)\n`);

    // ── Summary ──────────────────────────────────────────────────────────
    console.log('══════════════════════════════════════════════════');
    console.log('🎉 Full Seed Complete!');
    console.log('══════════════════════════════════════════════════');
    console.log('\n🔐 Login Credentials Summary:');
    console.log('┌────────────────────────────────────────────────────┐');
    console.log('│ Role          │ Email                   │ Password   │');
    console.log('├───────────────┼─────────────────────────┼────────────┤');
    console.log('│ Admin         │ admin@bitsathy.in       │ admin123   │');
    console.log('│ Dean          │ dean@bitsathy.in        │ admin123   │');
    console.log('│ Principal     │ principal@bitsathy.in   │ admin123   │');
    console.log('│ Incharge (×4) │ transport-head@...      │ incharge123│');
    console.log('│               │ mess-manager@...        │            │');
    console.log('│               │ hostel-manager@...      │            │');
    console.log('│               │ sanitation-incharge@... │            │');
    console.log('│ Faculty (×100)│ suresh.nair@bitsathy.in │ faculty123 │');
    console.log('│ Students(×300)│ e.g. ananya.krishnan1@  │ student123 │');
    console.log('│               │ student.edu             │            │');
    console.log('└────────────────────────────────────────────────────┘');
    console.log('\n🌐 Login Pages:');
    console.log('  Admin:    /login/admin     → /admin/dashboard');
    console.log('  Faculty:  /login/faculty   → /faculty/dashboard');
    console.log('  Dean:     /login/dean      → /monitor/dashboard');
    console.log('  Principal:/login/principal → /monitor/dashboard');
    console.log('  Incharge: /login/<domain>-head → /domain-head/dashboard');
    console.log('  Student:  /login/student   → /student/home');
    console.log('══════════════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);
};

seed().catch(err => {
    console.error('❌ Seed failed:', err.message, '\n', err);
    process.exit(1);
});
