/**
 * seed_combined.js
 * ─────────────────────────────────────────────────────────────────
 * Creates ALL data needed for CollegePulse system:
 *
 *  ├── 8  Departments  (CSE, IT, CSBS, MECH, ECE, EEE, BIOTECH, AGRI)
 *  ├── 320 Subjects    (5 subjects × 8 semesters × 8 departments)
 *  ├── 64  Faculty     (8 per department)
 *  ├── 300 Students    (spread across depts × semesters)
 *  ├── 4  Domain Heads (Transport, Mess, Hostel, Sanitation)
 *  ├── 1  Dean
 *  ├── 1  Principal
 *  ├── 1  Admin
 *  └── 4  Domains      (Transport, Mess, Hostel, Sanitation configs)
 *
 * Usage:
 *   node scripts/seed_combined.js          → safe merge
 *   node scripts/seed_combined.js --reset  → wipe all & re-seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Department = require('../models/Department');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Domain = require('../models/Domain');
const Feedback = require('../models/Feedback');

const RESET = process.argv.includes('--reset');
const ACADEMIC_YEAR = '2025-26';

// ═══════════════════════════════════════════════════════════════════
// DATA DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

const DEPT_DEFS = [
    { name: 'Computer Science Engineering', code: 'CSE', cluster: 'CS Cluster', hodName: 'Dr. Rajesh Kumar' },
    { name: 'Information Technology', code: 'IT', cluster: 'CS Cluster', hodName: 'Dr. Priya Sharma' },
    { name: 'Computer Science & Business', code: 'CSBS', cluster: 'CS Cluster', hodName: 'Dr. Karthik Menon' },
    { name: 'Mechanical Engineering', code: 'MECH', cluster: 'Core Cluster', hodName: 'Dr. Anil Verma' },
    { name: 'Electronics & Communication', code: 'ECE', cluster: 'Core Cluster', hodName: 'Dr. Subramanian R' },
    { name: 'Electrical & Electronics', code: 'EEE', cluster: 'Core Cluster', hodName: 'Dr. Lakshmi Nair' },
    { name: 'Biotechnology', code: 'BIOTECH', cluster: 'Core Cluster', hodName: 'Dr. Shobha Iyer' },
    { name: 'Agriculture Engineering', code: 'AGRI', cluster: 'Core Cluster', hodName: 'Dr. Venkat Raman' },
];

// ── Faculty (8 per department = 64 total) ─────────────────────────
const FACULTY = {
    CSE: [
        { name: 'Prof. Suresh Nair', email: 'suresh.nair@bitsathy.in' },
        { name: 'Prof. Meena Rao', email: 'meena.rao@bitsathy.in' },
        { name: 'Prof. Arjun Pillai', email: 'arjun.pillai@bitsathy.in' },
        { name: 'Prof. Divya Krishnan', email: 'divya.krishnan@bitsathy.in' },
        { name: 'Prof. Naresh Babu', email: 'naresh.babu@bitsathy.in' },
        { name: 'Prof. Sangeetha Mohan', email: 'sangeetha.mohan@bitsathy.in' },
        { name: 'Prof. Vijay Kumar', email: 'vijay.kumar.cse@bitsathy.in' },
        { name: 'Prof. Anjali Mehta', email: 'anjali.mehta@bitsathy.in' },
    ],
    IT: [
        { name: 'Prof. Rajesh Pillai', email: 'rajesh.pillai@bitsathy.in' },
        { name: 'Prof. Kavitha Rajan', email: 'kavitha.rajan@bitsathy.in' },
        { name: 'Prof. Senthil Kumar', email: 'senthil.kumar@bitsathy.in' },
        { name: 'Prof. Rekha Nambiar', email: 'rekha.nambiar@bitsathy.in' },
        { name: 'Prof. Mohan Raj', email: 'mohan.raj@bitsathy.in' },
        { name: 'Prof. Padma Vasan', email: 'padma.vasan@bitsathy.in' },
        { name: 'Prof. Vivek Anand', email: 'vivek.anand@bitsathy.in' },
        { name: 'Prof. Nithya Lakshmi', email: 'nithya.lakshmi@bitsathy.in' },
    ],
    CSBS: [
        { name: 'Prof. Arun Balaji', email: 'arun.balaji@bitsathy.in' },
        { name: 'Prof. Mythili Prasad', email: 'mythili.prasad@bitsathy.in' },
        { name: 'Prof. Gopal Sundar', email: 'gopal.sundar@bitsathy.in' },
        { name: 'Prof. Janani Krishnan', email: 'janani.krishnan@bitsathy.in' },
        { name: 'Prof. Sunil Chandra', email: 'sunil.chandra@bitsathy.in' },
        { name: 'Prof. Vimala Devi', email: 'vimala.devi@bitsathy.in' },
        { name: 'Prof. Rajan Selvam', email: 'rajan.selvam@bitsathy.in' },
        { name: 'Prof. Deepika Srinivas', email: 'deepika.srinivas@bitsathy.in' },
    ],
    MECH: [
        { name: 'Prof. Ganesh Menon', email: 'ganesh.menon@bitsathy.in' },
        { name: 'Prof. Deepa Iyer', email: 'deepa.iyer@bitsathy.in' },
        { name: 'Prof. Balaji Subramanian', email: 'balaji.subramanian@bitsathy.in' },
        { name: 'Prof. Karan Mathur', email: 'karan.mathur@bitsathy.in' },
        { name: 'Prof. Saravanan K', email: 'saravanan.k@bitsathy.in' },
        { name: 'Prof. Renuka Devi', email: 'renuka.devi@bitsathy.in' },
        { name: 'Prof. Mohanraj P', email: 'mohanraj.p@bitsathy.in' },
        { name: 'Prof. Usha Rani', email: 'usha.rani.mech@bitsathy.in' },
    ],
    ECE: [
        { name: 'Prof. Ranjith Ramesh', email: 'ranjith.ramesh@bitsathy.in' },
        { name: 'Prof. Lavanya Bose', email: 'lavanya.bose@bitsathy.in' },
        { name: 'Prof. Sathish Kumar', email: 'sathish.kumar.ece@bitsathy.in' },
        { name: 'Prof. Meera Pillai', email: 'meera.pillai@bitsathy.in' },
        { name: 'Prof. Chandran Nair', email: 'chandran.nair@bitsathy.in' },
        { name: 'Prof. Bhuvana R', email: 'bhuvana.r@bitsathy.in' },
        { name: 'Prof. Anand Roshan', email: 'anand.roshan@bitsathy.in' },
        { name: 'Prof. Sumathy T', email: 'sumathy.t@bitsathy.in' },
    ],
    EEE: [
        { name: 'Prof. Vinod Krishnan', email: 'vinod.krishnan@bitsathy.in' },
        { name: 'Prof. Shanthi Pandian', email: 'shanthi.pandian@bitsathy.in' },
        { name: 'Prof. Murali Mohan', email: 'murali.mohan@bitsathy.in' },
        { name: 'Prof. Geetha Ravi', email: 'geetha.ravi@bitsathy.in' },
        { name: 'Prof. Prasanna Kumar', email: 'prasanna.kumar@bitsathy.in' },
        { name: 'Prof. Nalini Suresh', email: 'nalini.suresh@bitsathy.in' },
        { name: 'Prof. Prakash T', email: 'prakash.t@bitsathy.in' },
        { name: 'Prof. Saranya Devi', email: 'saranya.devi@bitsathy.in' },
    ],
    BIOTECH: [
        { name: 'Prof. Anitha Raj', email: 'anitha.raj@bitsathy.in' },
        { name: 'Prof. Sudhir Balan', email: 'sudhir.balan@bitsathy.in' },
        { name: 'Prof. Malathi S', email: 'malathi.s@bitsathy.in' },
        { name: 'Prof. Deepak Nambiar', email: 'deepak.nambiar@bitsathy.in' },
        { name: 'Prof. Preethi Menon', email: 'preethi.menon@bitsathy.in' },
        { name: 'Prof. Kiran Babu', email: 'kiran.babu@bitsathy.in' },
        { name: 'Prof. Vasantha Kumar', email: 'vasantha.kumar@bitsathy.in' },
        { name: 'Prof. Nirmala Devi', email: 'nirmala.devi@bitsathy.in' },
    ],
    AGRI: [
        { name: 'Prof. Balasubramanian V', email: 'balasub.v@bitsathy.in' },
        { name: 'Prof. Kamala Devi', email: 'kamala.devi@bitsathy.in' },
        { name: 'Prof. Selvaraj P', email: 'selvaraj.p@bitsathy.in' },
        { name: 'Prof. Hemavathy R', email: 'hemavathy.r@bitsathy.in' },
        { name: 'Prof. Pandian K', email: 'pandian.k@bitsathy.in' },
        { name: 'Prof. Suganya M', email: 'suganya.m@bitsathy.in' },
        { name: 'Prof. Thirumal N', email: 'thirumal.n@bitsathy.in' },
        { name: 'Prof. Valarmathy S', email: 'valarmathy.s@bitsathy.in' },
    ],
};

// ── 5 Subjects per semester × 8 semesters × 8 departments = 320 ──
const SUBJECT_TEMPLATES = {
    CSE: [
        ['Calculus & Linear Algebra', 'Engineering Physics', 'Engineering Chemistry', 'Engineering Graphics', 'Programming in C'],
        ['Probability & Statistics', 'Digital Systems Design', 'Data Structures', 'Object Oriented Programming', 'Computer Organization'],
        ['Design & Analysis of Algorithms', 'Operating Systems', 'Database Management Systems', 'Software Engineering', 'Discrete Mathematics'],
        ['Computer Networks', 'Compiler Design', 'Theory of Computation', 'Web Technologies', 'Microprocessors & Microcontrollers'],
        ['Artificial Intelligence', 'Machine Learning', 'Cloud Computing', 'Cryptography & Network Security', 'Mobile Application Development'],
        ['Deep Learning', 'Big Data Analytics', 'Internet of Things', 'Distributed Systems', 'Soft Computing'],
        ['Natural Language Processing', 'Computer Vision', 'Blockchain Technology', 'Software Testing & QA', 'Professional Ethics'],
        ['Project Work (Phase I)', 'Project Work (Phase II)', 'Entrepreneurship & Innovation', 'IPR & Patent Law', 'Industry Internship Report'],
    ],
    IT: [
        ['Engineering Mathematics I', 'Engineering Physics', 'Basic Electrical Engineering', 'Engineering Graphics', 'Problem Solving with Python'],
        ['Engineering Mathematics II', 'Data Structures & Algorithms', 'Digital Electronics', 'Database Design', 'Web Design & Development'],
        ['Computer Networks', 'System Analysis & Design', 'Java Programming', 'Software Project Management', 'Linux Administration'],
        ['Network Security', 'Cloud Infrastructure', 'Business Analytics', 'Mobile Computing', 'Object-Oriented Design'],
        ['Big Data Processing', 'AI & Data Mining', 'Enterprise Resource Planning', 'Digital Marketing Technology', 'UI/UX Design'],
        ['Machine Learning Applications', 'DevOps Practices', 'IT Service Management', 'Cyber Security Tools', 'API Development & Integration'],
        ['Capstone Project Planning', 'Emerging Technologies', 'IT Governance', 'Agile Methodologies', 'Information Systems Audit'],
        ['Final Project (IT)', 'Startup Technology', 'IT Consulting', 'Open Source Development', 'Industry Training Report'],
    ],
    CSBS: [
        ['Business Mathematics', 'Principles of Management', 'Accounting & Finance', 'Business Communication', 'Fundamentals of Computing'],
        ['Statistics for Business', 'Business Economics', 'Database for Business', 'Spreadsheet Analytics', 'Business Process Modeling'],
        ['Operations Research', 'Marketing Management', 'Business Intelligence Tools', 'ERP Systems', 'Data Visualization'],
        ['Supply Chain Management', 'CRM Technologies', 'Business Law & Ethics', 'Financial Analytics', 'Human Resource Technology'],
        ['E-Commerce Technologies', 'IT Project Management', 'Business Forecasting', 'Decision Making Models', 'Digital Transformation'],
        ['Business Analytics & ML', 'Enterprise Systems', 'Risk Management', 'Innovation & Startups', 'Corporate Strategy'],
        ['Business Capstone I', 'Fintech Applications', 'Consulting Skills', 'Global Business Environment', 'Mergers & Acquisitions (IT)'],
        ['Business Capstone II', 'Entrepreneurship Management', 'Social Media Analytics', 'CSR & Governance', 'Placement Readiness'],
    ],
    MECH: [
        ['Engineering Mathematics I', 'Engineering Physics', 'Engineering Chemistry', 'Engineering Graphics & AutoCAD', 'Workshop Practice'],
        ['Engineering Mathematics II', 'Mechanics of Solids', 'Engineering Thermodynamics', 'Manufacturing Processes I', 'Fluid Mechanics'],
        ['Design of Machine Elements', 'Kinematics of Machinery', 'Manufacturing Processes II', 'Material Science & Metallurgy', 'Thermal Engineering'],
        ['Dynamics of Machinery', 'Heat Transfer', 'CNC Machining & Robotics', 'Industrial Metrology', 'Automobile Engineering'],
        ['Advanced Manufacturing', 'Finite Element Analysis', 'Industrial Engineering', 'Refrigeration & Air Conditioning', 'Mechatronics'],
        ['CAD/CAM', 'Tribology', 'Non-Destructive Testing', 'Renewable Energy Systems', 'Robotics & Automation'],
        ['Product Design & Development', 'Industrial Safety & Management', 'Operations Management', 'Composite Materials', 'Hydraulics & Pneumatics'],
        ['Project (MECH Phase I)', 'Project (MECH Phase II)', 'Total Quality Management', 'Entrepreneurship for Engineers', 'Industry Internship'],
    ],
    ECE: [
        ['Engineering Mathematics I', 'Engineering Physics', 'Basic Electronics', 'Engineering Graphics', 'Problem Solving in Python'],
        ['Engineering Mathematics II', 'Network Analysis', 'Electronic Devices & Circuits', 'Digital Electronics', 'Signals & Systems'],
        ['Analog Circuits', 'Digital Communication', 'Electromagnetic Fields', 'Microprocessors & Interfaces', 'Linear Integrated Circuits'],
        ['VLSI Design', 'Communication Systems', 'Control Systems', 'Digital Signal Processing', 'Antenna & Wave Propagation'],
        ['RF & Microwave Engineering', 'Optical Communication', 'Robotics & Embedded Systems', 'Wireless Networks', 'Image Processing'],
        ['IoT System Design', 'FPGA Design', 'Satellite Communication', 'Medical Electronics', 'PCB Design & Testing'],
        ['AI for Signal Processing', '5G Technologies', 'Cognitive Radio Networks', 'Smart Grid Technology', 'Biomedical Signal Analysis'],
        ['Project (ECE Phase I)', 'Project (ECE Phase II)', 'Technology Entrepreneurship', 'Spectrum Management', 'Industry Training Report'],
    ],
    EEE: [
        ['Engineering Mathematics I', 'Engineering Physics', 'Basic Mechanical Engineering', 'Engineering Graphics', 'Introduction to EEE'],
        ['Engineering Mathematics II', 'Circuit Theory', 'Electronic Devices & Circuits', 'Electrical Machines I', 'Measurements & Instrumentation'],
        ['Power Systems I', 'Digital Electronics', 'Control Systems', 'Electrical Machines II', 'Electromagnetic Theory'],
        ['Power Systems II', 'Power Electronics', 'Microprocessors in Electrical Systems', 'High Voltage Engineering', 'Switchgear & Protection'],
        ['Power System Analysis', 'Special Electrical Machines', 'Renewable Energy Systems', 'Industrial Drives & Control', 'Digital Control Systems'],
        ['Power Quality', 'Smart Grid Technology', 'Energy Auditing & Management', 'Flexible AC Transmission', 'Electric Vehicles'],
        ['Substation Design', 'Distributed Generation', 'SCADA Systems', 'Energy Storage Technologies', 'Professional Ethics in Engineering'],
        ['Project (EEE Phase I)', 'Project (EEE Phase II)', 'Power Market Economics', 'Grid Integration of Renewables', 'Industry Internship'],
    ],
    BIOTECH: [
        ['Biological Chemistry I', 'Mathematics for Biotechnology', 'Physics for Life Sciences', 'Introduction to Biotechnology', 'Laboratory Skills'],
        ['Biological Chemistry II', 'Cell Biology & Genetics', 'Microbiology', 'Biophysics', 'Biostatistics'],
        ['Molecular Biology', 'Enzymology', 'Immunology', 'Bioinformatics I', 'Fermentation Technology'],
        ['Genetic Engineering', 'Downstream Processing', 'Plant Biotechnology', 'Bioinformatics II', 'Bioethics & IPR'],
        ['Industrial Biotechnology', 'Environmental Biotechnology', 'Medical Biotechnology', 'Genomics & Proteomics', 'Bioreactor Design'],
        ['Drug Delivery Systems', 'Animal Cell Technology', 'Systems Biology', 'Nano Biotechnology', 'Food Biotechnology'],
        ['Cancer Biology', 'Stem Cell Technology', 'Marine Biotechnology', 'Regulatory Affairs in Biotech', 'Biosafety & Risk Assessment'],
        ['Project (Biotech Phase I)', 'Project (Biotech Phase II)', 'Bioprocess Scale-up', 'Entrepreneurship in Biotech', 'Internship Report'],
    ],
    AGRI: [
        ['Agricultural Mathematics', 'Agricultural Physics', 'Agricultural Chemistry', 'Introduction to Agricultural Engineering', 'Farm Machinery I'],
        ['Soil & Water Conservation', 'Agricultural Biology', 'Irrigation & Drainage Engineering', 'Farm Machinery II', 'Agronomy I'],
        ['Land & Water Resources', 'Agricultural Mechanization', 'Post Harvest Technology', 'Agronomy II', 'Agricultural Meteorology'],
        ['Precision Agriculture', 'Agricultural Structures', 'Crop Science', 'Remote Sensing in Agriculture', 'Agricultural Economics'],
        ['GIS for Agriculture', 'Agricultural Electrification', 'Food Processing Engineering', 'Protected Cultivation', 'Agricultural Statistics'],
        ['Watershed Management', 'Renewable Energy in Agriculture', 'Agricultural Information Systems', 'Drip Irrigation Design', 'Weed Science'],
        ['Agri-Business Management', 'Rural Development Technology', 'Climate-Smart Agriculture', 'Vertical Farming Systems', 'Agricultural Policy'],
        ['Project (Agri Phase I)', 'Project (Agri Phase II)', 'Farm Management', 'Organic Farming Technology', 'Industry Attachment Report'],
    ],
};

// ── Domain configurations ─────────────────────────────────────────
const DOMAIN_DEFS = [
    {
        name: 'Transport', slug: 'transport', icon: 'FiTruck',
        description: 'College bus and transportation services feedback',
        residenceRestriction: 'none',
        questions: [
            { text: 'How would you rate the punctuality of college transport?', type: 'rating' },
            { text: 'How satisfied are you with the cleanliness of buses?', type: 'rating' },
            { text: 'How would you rate the behaviour of transport staff?', type: 'rating' },
            { text: 'How comfortable is the ride overall?', type: 'rating' },
            { text: 'Please share any additional feedback about transport.', type: 'text', required: false },
        ],
    },
    {
        name: 'Mess', slug: 'mess', icon: 'FiCoffee',
        description: 'Canteen and food services feedback',
        residenceRestriction: 'none',
        questions: [
            { text: 'How would you rate the quality of food served?', type: 'rating' },
            { text: 'How satisfied are you with the variety of menu items?', type: 'rating' },
            { text: 'How would you rate the cleanliness of the mess area?', type: 'rating' },
            { text: 'How would you rate the service speed?', type: 'rating' },
            { text: 'Please share any suggestions to improve the mess.', type: 'text', required: false },
        ],
    },
    {
        name: 'Hostel', slug: 'hostel', icon: 'FiHome',
        description: 'Hostel accommodation and facilities feedback',
        residenceRestriction: 'hosteller',
        questions: [
            { text: 'How would you rate the cleanliness of your hostel room?', type: 'rating' },
            { text: 'How satisfied are you with the facilities (water, electricity, Wi-Fi)?', type: 'rating' },
            { text: 'How would you rate the hostel staff behaviour and responsiveness?', type: 'rating' },
            { text: 'How safe and secure do you feel in the hostel?', type: 'rating' },
            { text: 'Please share any additional feedback about hostel facilities.', type: 'text', required: false },
        ],
    },
    {
        name: 'Sanitation', slug: 'sanitation', icon: 'FiTrash2',
        description: 'Campus cleanliness and sanitation services feedback',
        residenceRestriction: 'none',
        questions: [
            { text: 'How would you rate the cleanliness of restrooms?', type: 'rating' },
            { text: 'How satisfied are you with the waste disposal management?', type: 'rating' },
            { text: 'How would you rate campus outdoor cleanliness?', type: 'rating' },
            { text: 'How frequently are sanitation facilities maintained?', type: 'rating' },
            { text: 'Please report specific sanitation concerns or suggestions.', type: 'text', required: false },
        ],
    },
];

// ── Student names ─────────────────────────────────────────────────
const FIRST_NAMES = [
    'Aarav', 'Aditi', 'Aditya', 'Akash', 'Ananya', 'Arun', 'Arjun', 'Aswini', 'Bhavana', 'Chandrika',
    'Deepa', 'Deepika', 'Divya', 'Ganesh', 'Geethu', 'Govind', 'Hari', 'Harini', 'Harish', 'Ishaan',
    'Janani', 'Karthik', 'Kavitha', 'Keerthi', 'Krishnan', 'Lakshmi', 'Lavanya', 'Manoj', 'Meena', 'Megha',
    'Mohan', 'Nisha', 'Nithya', 'Padma', 'Pooja', 'Pradeep', 'Priya', 'Rahul', 'Rajan', 'Ramesh',
    'Ranjith', 'Rekha', 'Rohit', 'Saravanan', 'Saranya', 'Shruthi', 'Sindhu', 'Sneha', 'Sriram', 'Suresh',
    'Swathi', 'Tarun', 'Thamizh', 'Uma', 'Varsha', 'Vidhya', 'Vijay', 'Vimal', 'Vinod', 'Vishnu',
];
const LAST_NAMES = [
    'Krishnan', 'Nair', 'Pillai', 'Rao', 'Sharma', 'Kumar', 'Menon', 'Iyer', 'Subramaniam', 'Reddy',
    'Patel', 'Varma', 'Singh', 'Verma', 'Das', 'Rajan', 'Anandan', 'Srinivasan', 'Balaji', 'Kannan',
    'Selvam', 'Murugan', 'Chandra', 'Babu', 'Devi', 'Mehta', 'Mishra', 'Pandey', 'Ghosh', 'Roy',
];
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ═══════════════════════════════════════════════════════════════════
// SEED FUNCTION
// ═══════════════════════════════════════════════════════════════════
const seed = async () => {
    await connectDB();
    console.log('\n⚙️  Connected to DB. Running COMBINED seed...\n');

    if (RESET) {
        await Promise.all([Department, Subject, User, Domain, Feedback].map(M => M.deleteMany({})));
        console.log('🗑️  Cleared all collections (--reset flag)\n');
    } else {
        await User.deleteMany({});
        await Domain.deleteMany({});
        await Department.deleteMany({});
        await Subject.deleteMany({});
        console.log('🗑️  Cleared users, domains, departments, subjects for clean re-seed\n');
    }

    // ── 1. DEPARTMENTS ─────────────────────────────────────────────
    console.log('📂 Seeding 8 departments...');
    const deptDocs = await Department.insertMany(
        DEPT_DEFS.map(d => ({
            name: d.name, code: d.code, cluster: d.cluster,
            hodName: d.hodName,
            description: `${d.cluster} — ${d.code} Department`,
            isActive: true,
        }))
    );
    const deptMap = {};
    deptDocs.forEach(d => { deptMap[d.code] = d; });
    console.log(`✅ ${deptDocs.length} departments\n`);

    // ── 2. SUBJECTS (5 × 8 sems × 8 depts = 320) ──────────────────
    console.log('📚 Seeding 320 subjects (5 per department per semester)...');
    const allSubjects = [];
    for (const dept of DEPT_DEFS) {
        const deptDoc = deptMap[dept.code];
        const facPool = FACULTY[dept.code];
        const templates = SUBJECT_TEMPLATES[dept.code];
        for (let semIdx = 0; semIdx < 8; semIdx++) {
            const sem = semIdx + 1;
            for (let subIdx = 0; subIdx < 5; subIdx++) {
                const fac = facPool[subIdx % facPool.length];
                allSubjects.push({
                    name: templates[semIdx][subIdx],
                    subjectCode: `${dept.code}${sem}0${subIdx + 1}`,
                    department: deptDoc._id,
                    facultyName: fac.name,
                    facultyEmail: fac.email,
                    semester: sem,
                    academicYear: ACADEMIC_YEAR,
                    isActive: true,
                });
            }
        }
    }
    const subjectDocs = await Subject.insertMany(allSubjects);
    console.log(`✅ ${subjectDocs.length} subjects seeded\n`);

    // ── 3. ADMIN ───────────────────────────────────────────────────
    console.log('👤 Seeding admin...');
    await User.create({ name: 'System Admin', email: 'admin@bitsathy.in', password: 'admin123', role: 'admin' });
    console.log('   ✅ admin@bitsathy.in / admin123\n');

    // ── 4. DEAN & PRINCIPAL ────────────────────────────────────────
    console.log('🎓 Seeding Dean & Principal...');
    await User.create({ name: 'Dr. Amitabh Sharma', email: 'dean@bitsathy.in', password: 'admin123', role: 'dean' });
    await User.create({ name: 'Dr. Rajeshwar Rao', email: 'principal@bitsathy.in', password: 'admin123', role: 'principal' });
    console.log('   ✅ dean@bitsathy.in / admin123');
    console.log('   ✅ principal@bitsathy.in / admin123\n');

    // ── 5. DOMAIN HEADS (4 incharges) ─────────────────────────────
    console.log('🔑 Seeding 4 domain incharges...');
    const incharges = [
        { name: 'Mr. Ravi Kumar', email: 'transport-head@bitsathy.in', assignedDomain: 'transport' },
        { name: 'Ms. Sunita Sharma', email: 'mess-manager@bitsathy.in', assignedDomain: 'mess' },
        { name: 'Mr. Anil Mehta', email: 'hostel-manager@bitsathy.in', assignedDomain: 'hostel' },
        { name: 'Ms. Kavitha Nair', email: 'sanitation-head@bitsathy.in', assignedDomain: 'sanitation' },
    ];
    for (const inc of incharges) {
        await User.create({ ...inc, password: 'incharge123', role: 'domain_head' });
        console.log(`   ✅ ${inc.email} (${inc.assignedDomain}) / incharge123`);
    }
    console.log();

    // ── 6. FACULTY USERS ──────────────────────────────────────────
    console.log('👨‍🏫 Seeding 64 faculty users...');
    const facUserMap = {};
    let facCount = 0;
    for (const dept of DEPT_DEFS) {
        for (const fac of FACULTY[dept.code]) {
            const facUser = await User.create({
                name: fac.name,
                email: fac.email,
                password: 'faculty123',
                role: 'faculty',
                department: deptMap[dept.code]._id,
            });
            facUserMap[fac.email] = facUser._id;
            facCount++;
        }
    }
    // Link subjects ↔ faculty
    for (const subj of subjectDocs) {
        if (subj.facultyEmail && facUserMap[subj.facultyEmail]) {
            await User.findByIdAndUpdate(facUserMap[subj.facultyEmail], {
                $addToSet: { assignedSubjects: subj._id },
            });
            await Subject.findByIdAndUpdate(subj._id, { faculty: facUserMap[subj.facultyEmail] });
        }
    }
    console.log(`✅ ${facCount} faculty users (password: faculty123)\n`);

    // ── 7. STUDENTS (300) ─────────────────────────────────────────
    console.log('👩‍🎓 Seeding 300 students...');
    const usedEmails = new Set();
    let studentCount = 0;
    const studentsPerDept = Math.ceil(300 / DEPT_DEFS.length); // ~38
    for (const dept of DEPT_DEFS) {
        for (let i = 0; i < studentsPerDept && studentCount < 300; i++) {
            const sem = (i % 8) + 1;
            const firstName = rand(FIRST_NAMES);
            const lastName = rand(LAST_NAMES);
            let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@student.edu`;
            let suffix = 0;
            while (usedEmails.has(email)) { suffix++; email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}_${suffix}@student.edu`; }
            usedEmails.add(email);

            await User.create({
                name: `${firstName} ${lastName}`,
                email,
                password: 'student123',
                role: 'student',
                rollNumber: `${dept.code}${String(studentCount + 1).padStart(4, '0')}`,
                department: deptMap[dept.code]._id,
                semester: sem,
                residenceType: studentCount % 2 === 0 ? 'hosteller' : 'dayscholar',
            });
            studentCount++;
        }
    }
    console.log(`✅ ${studentCount} students (password: student123)\n`);

    // ── 8. DOMAIN CONFIGS ─────────────────────────────────────────
    console.log('🌐 Seeding 4 domain configurations...');
    for (const d of DOMAIN_DEFS) {
        await Domain.create({
            name: d.name,
            slug: d.slug,
            icon: d.icon,
            description: d.description,
            residenceRestriction: d.residenceRestriction,
            questions: d.questions,
            isActive: true,
        });
        console.log(`   ✅ ${d.slug} domain (${d.questions.length} questions)`);
    }
    console.log();

    // ══════════════════════════════════════════════════════════════
    console.log('══════════════════════════════════════════════════════════');
    console.log('🎉  COMBINED SEED COMPLETE!');
    console.log('══════════════════════════════════════════════════════════\n');
    console.log('📂 Departments (8):');
    DEPT_DEFS.forEach(d => console.log(`   ${d.cluster.padEnd(15)} │ ${d.code.padEnd(8)} │ ${d.name}`));
    console.log(`\n📚 Subjects: ${subjectDocs.length}  (5 subjects × 8 sems × 8 depts)`);
    console.log(`\n🔐 Login Credentials:`);
    console.log(`┌─────────────────────┬───────────────────────────────────┬─────────────┐`);
    console.log(`│ Role                │ Email                             │ Password    │`);
    console.log(`├─────────────────────┼───────────────────────────────────┼─────────────┤`);
    console.log(`│ Admin               │ admin@bitsathy.in                 │ admin123    │`);
    console.log(`│ Dean                │ dean@bitsathy.in                  │ admin123    │`);
    console.log(`│ Principal           │ principal@bitsathy.in             │ admin123    │`);
    console.log(`│ Transport Incharge  │ transport-head@bitsathy.in        │ incharge123 │`);
    console.log(`│ Mess Incharge       │ mess-manager@bitsathy.in          │ incharge123 │`);
    console.log(`│ Hostel Incharge     │ hostel-manager@bitsathy.in        │ incharge123 │`);
    console.log(`│ Sanitation Incharge │ sanitation-head@bitsathy.in       │ incharge123 │`);
    console.log(`│ Faculty (×64)       │ suresh.nair@bitsathy.in (example) │ faculty123  │`);
    console.log(`│ Students (×${studentCount})   │ e.g. priya.kumar1@student.edu    │ student123  │`);
    console.log(`└─────────────────────┴───────────────────────────────────┴─────────────┘`);
    console.log('\n🌐 Login pages:');
    console.log('   Admin:      /login/admin          → /admin/dashboard');
    console.log('   Dean:       /login/dean           → /monitor/dashboard');
    console.log('   Principal:  /login/principal      → /monitor/dashboard');
    console.log('   Faculty:    /login/faculty        → /faculty/dashboard');
    console.log('   Transport:  /login/transport-incharge → /domain-head/dashboard');
    console.log('   Mess:       /login/mess-incharge      → /domain-head/dashboard');
    console.log('   Hostel:     /login/hostel-incharge    → /domain-head/dashboard');
    console.log('   Sanitation: /login/sanitation-incharge → /domain-head/dashboard');
    console.log('   Student:    /login/student         → /student/home');
    console.log('══════════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);
};

seed().catch(err => {
    console.error('\n❌ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
});
