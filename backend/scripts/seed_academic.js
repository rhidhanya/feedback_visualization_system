/**
 * Academic Structure Seed Script
 *
 * Creates:
 *   - 8 Departments (Biotech, IT, CSE, MECH, ECE, EEE, CSBS, Agriculture)
 *     with cluster groupings: CS Cluster (IT, CSE, CSBS) | Core Cluster (MECH, ECE, EEE, Biotech, Agriculture)
 *   - 64 Faculty members (~8 per department)
 *   - 320 Subjects (5 subjects × 8 semesters × 8 departments)
 *   - 1 Admin user
 *   - 8 Sample students (one per department, sem 3)
 *
 * ⚠️  This script REPLACES existing departments, subjects, and feedback.
 *     It preserves existing User accounts unless --reset-users is passed.
 *
 * Run:  node scripts/seed_academic.js
 * Full: node scripts/seed_academic.js --reset-users
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const Department = require("../models/Department");
const Subject = require("../models/Subject");
const User = require("../models/User");
const Feedback = require("../models/Feedback");

const ACADEMIC_YEAR = "2024-25";
const RESET_USERS = process.argv.includes("--reset-users");

// ─── Department definitions ───────────────────────────────────────────────
const DEPARTMENTS = [
    { name: "Computer Science Engineering", code: "CSE", cluster: "CS Cluster", hodName: "Dr. Rajesh Kumar", hod_email: "hod.cse@bitsathy.in" },
    { name: "Information Technology", code: "IT", cluster: "CS Cluster", hodName: "Dr. Priya Sharma", hod_email: "hod.it@bitsathy.in" },
    { name: "Computer Science & Business", code: "CSBS", cluster: "CS Cluster", hodName: "Dr. Karthik Menon", hod_email: "hod.csbs@bitsathy.in" },
    { name: "Mechanical Engineering", code: "MECH", cluster: "Core Cluster", hodName: "Dr. Anil Verma", hod_email: "hod.mech@bitsathy.in" },
    { name: "Electronics & Communication", code: "ECE", cluster: "Core Cluster", hodName: "Dr. Subarmaniam R", hod_email: "hod.ece@bitsathy.in" },
    { name: "Electrical & Electronics", code: "EEE", cluster: "Core Cluster", hodName: "Dr. Lakshmi Nair", hod_email: "hod.eee@bitsathy.in" },
    { name: "Biotechnology", code: "BIOTECH", cluster: "Core Cluster", hodName: "Dr. Shobha Iyer", hod_email: "hod.biotech@bitsathy.in" },
    { name: "Agriculture Engineering", code: "AGRI", cluster: "Core Cluster", hodName: "Dr. Venkat Raman", hod_email: "hod.agri@bitsathy.in" },
];

// ─── Faculty Pool (8 per department = 64 total) ───────────────────────────
const FACULTY = {
    CSE: [
        { name: "Prof. Suresh Nair", email: "suresh.nair@bitsathy.in" },
        { name: "Prof. Meena Rao", email: "meena.rao@bitsathy.in" },
        { name: "Prof. Arjun Pillai", email: "arjun.pillai@bitsathy.in" },
        { name: "Prof. Divya Krishnan", email: "divya.krishnan@bitsathy.in" },
        { name: "Prof. Naresh Babu", email: "naresh.babu@bitsathy.in" },
        { name: "Prof. Sangeetha Mohan", email: "sangeetha.mohan@bitsathy.in" },
        { name: "Prof. Vijay Kumar", email: "vijay.kumar.cse@bitsathy.in" },
        { name: "Prof. Anjali Mehta", email: "anjali.mehta@bitsathy.in" },
    ],
    IT: [
        { name: "Prof. Rajesh Pillai", email: "rajesh.pillai@bitsathy.in" },
        { name: "Prof. Kavitha Rajan", email: "kavitha.rajan@bitsathy.in" },
        { name: "Prof. Senthil Kumar", email: "senthil.kumar@bitsathy.in" },
        { name: "Prof. Rekha Nambiar", email: "rekha.nambiar@bitsathy.in" },
        { name: "Prof. Mohan Raj", email: "mohan.raj@bitsathy.in" },
        { name: "Prof. Padma Vasan", email: "padma.vasan@bitsathy.in" },
        { name: "Prof. Vivek Anand", email: "vivek.anand@bitsathy.in" },
        { name: "Prof. Nithya Lakshmi", email: "nithya.lakshmi@bitsathy.in" },
    ],
    CSBS: [
        { name: "Prof. Arun Balaji", email: "arun.balaji@bitsathy.in" },
        { name: "Prof. Mythili Prasad", email: "mythili.prasad@bitsathy.in" },
        { name: "Prof. Gopal Sundar", email: "gopal.sundar@bitsathy.in" },
        { name: "Prof. Janani Krishnan", email: "janani.krishnan@bitsathy.in" },
        { name: "Prof. Sunil Chandra", email: "sunil.chandra@bitsathy.in" },
        { name: "Prof. Vimala Devi", email: "vimala.devi@bitsathy.in" },
        { name: "Prof. Rajan Selvam", email: "rajan.selvam@bitsathy.in" },
        { name: "Prof. Deepika Srinivas", email: "deepika.srinivas@bitsathy.in" },
    ],
    MECH: [
        { name: "Prof. Ganesh Menon", email: "ganesh.menon@bitsathy.in" },
        { name: "Prof. Deepa Iyer", email: "deepa.iyer@bitsathy.in" },
        { name: "Prof. Balaji Subramanian", email: "balaji.subramanian@bitsathy.in" },
        { name: "Prof. Karan Mathur", email: "karan.mathur@bitsathy.in" },
        { name: "Prof. Saravanan K", email: "saravanan.k@bitsathy.in" },
        { name: "Prof. Renuka Devi", email: "renuka.devi@bitsathy.in" },
        { name: "Prof. Mohanraj P", email: "mohanraj.p@bitsathy.in" },
        { name: "Prof. Usha Rani", email: "usha.rani.mech@bitsathy.in" },
    ],
    ECE: [
        { name: "Prof. Ranjith Ramesh", email: "ranjith.ramesh@bitsathy.in" },
        { name: "Prof. Lavanya Bose", email: "lavanya.bose@bitsathy.in" },
        { name: "Prof. Sathish Kumar", email: "sathish.kumar.ece@bitsathy.in" },
        { name: "Prof. Meera Pillai", email: "meera.pillai@bitsathy.in" },
        { name: "Prof. Chandran Nair", email: "chandran.nair@bitsathy.in" },
        { name: "Prof. Bhuvana R", email: "bhuvana.r@bitsathy.in" },
        { name: "Prof. Anand Roshan", email: "anand.roshan@bitsathy.in" },
        { name: "Prof. Sumathy T", email: "sumathy.t@bitsathy.in" },
    ],
    EEE: [
        { name: "Prof. Vinod Krishnan", email: "vinod.krishnan@bitsathy.in" },
        { name: "Prof. Shanthi Pandian", email: "shanthi.pandian@bitsathy.in" },
        { name: "Prof. Murali Mohan", email: "murali.mohan@bitsathy.in" },
        { name: "Prof. Geetha Ravi", email: "geetha.ravi@bitsathy.in" },
        { name: "Prof. Prasanna Kumar", email: "prasanna.kumar@bitsathy.in" },
        { name: "Prof. Nalini Suresh", email: "nalini.suresh@bitsathy.in" },
        { name: "Prof. Prakash T", email: "prakash.t@bitsathy.in" },
        { name: "Prof. Saranya Devi", email: "saranya.devi@bitsathy.in" },
    ],
    BIOTECH: [
        { name: "Prof. Anitha Raj", email: "anitha.raj@bitsathy.in" },
        { name: "Prof. Sudhir Balan", email: "sudhir.balan@bitsathy.in" },
        { name: "Prof. Malathi S", email: "malathi.s@bitsathy.in" },
        { name: "Prof. Deepak Nambiar", email: "deepak.nambiar@bitsathy.in" },
        { name: "Prof. Preethi Menon", email: "preethi.menon@bitsathy.in" },
        { name: "Prof. Kiran Babu", email: "kiran.babu@bitsathy.in" },
        { name: "Prof. Vasantha Kumar", email: "vasantha.kumar@bitsathy.in" },
        { name: "Prof. Nirmala Devi", email: "nirmala.devi@bitsathy.in" },
    ],
    AGRI: [
        { name: "Prof. Balasubramanian V", email: "balasub.v@bitsathy.in" },
        { name: "Prof. Kamala Devi", email: "kamala.devi@bitsathy.in" },
        { name: "Prof. Selvaraj P", email: "selvaraj.p@bitsathy.in" },
        { name: "Prof. Hemavathy R", email: "hemavathy.r@bitsathy.in" },
        { name: "Prof. Pandian K", email: "pandian.k@bitsathy.in" },
        { name: "Prof. Suganya M", email: "suganya.m@bitsathy.in" },
        { name: "Prof. Thirumal N", email: "thirumal.n@bitsathy.in" },
        { name: "Prof. Valarmathy S", email: "valarmathy.s@bitsathy.in" },
    ],
};

// ─── Subjects per department (5 subjects per semester, sem 1–8) ───────────
const SUBJECT_TEMPLATES = {
    CSE: [
        // Sem 1–2: Foundation
        ["Calculus & Linear Algebra", "Engineering Physics", "Engineering Chemistry", "Engineering Graphics", "Programming in C"],
        ["Probability & Statistics", "Digital Systems Design", "Data Structures", "Object Oriented Programming", "Computer Organization"],
        // Sem 3–4: Core
        ["Design & Analysis of Algorithms", "Operating Systems", "Database Management Systems", "Software Engineering", "Discrete Mathematics"],
        ["Computer Networks", "Compiler Design", "Theory of Computation", "Web Technologies", "Microprocessors & Microcontrollers"],
        // Sem 5–6: Advanced
        ["Artificial Intelligence", "Machine Learning", "Cloud Computing", "Cryptography & Network Security", "Mobile Application Development"],
        ["Deep Learning", "Big Data Analytics", "Internet of Things", "Distributed Systems", "Soft Computing"],
        // Sem 7–8: Electives & Project
        ["Natural Language Processing", "Computer Vision", "Blockchain Technology", "Software Testing & QA", "Professional Ethics"],
        ["Project Work (Phase I)", "Project Work (Phase II)", "Entrepreneurship & Innovation", "IPR & Patent Law", "Industry Internship Report"],
    ],
    IT: [
        ["Engineering Mathematics I", "Engineering Physics", "Basic Electrical Engineering", "Engineering Graphics", "Problem Solving with Python"],
        ["Engineering Mathematics II", "Data Structures & Algorithms", "Digital Electronics", "Database Design", "Web Design & Development"],
        ["Computer Networks", "System Analysis & Design", "Java Programming", "Software Project Management", "Linux Administration"],
        ["Network Security", "Cloud Infrastructure", "Business Analytics", "Mobile Computing", "Object-Oriented Design"],
        ["Big Data Processing", "AI & Data Mining", "Enterprise Resource Planning", "Digital Marketing Technology", "UI/UX Design"],
        ["Machine Learning Applications", "DevOps Practices", "IT Service Management", "Cyber Security Tools", "API Development & Integration"],
        ["Capstone Project Planning", "Emerging Technologies", "IT Governance", "Agile Methodologies", "Information Systems Audit"],
        ["Final Project (IT)", "Startup Technology", "IT Consulting", "Open Source Development", "Industry Training Report"],
    ],
    CSBS: [
        ["Business Mathematics", "Principles of Management", "Accounting & Finance", "Business Communication", "Fundamentals of Computing"],
        ["Statistics for Business", "Business Economics", "Database for Business", "Spreadsheet Analytics", "Business Process Modeling"],
        ["Operations Research", "Marketing Management", "Business Intelligence Tools", "ERP Systems", "Data Visualization"],
        ["Supply Chain Management", "CRM Technologies", "Business Law & Ethics", "Financial Analytics", "Human Resource Technology"],
        ["E-Commerce Technologies", "IT Project Management", "Business Forecasting", "Decision Making Models", "Digital Transformation"],
        ["Business Analytics & ML", "Enterprise Systems", "Risk Management", "Innovation & Startups", "Corporate Strategy"],
        ["Business Capstone I", "Mergers & Acquisitions (IT)", "Fintech Applications", "Consulting Skills", "Global Business Environment"],
        ["Business Capstone II", "Entrepreneurship Management", "Social Media Analytics", "CSR & Governance", "Placement Readiness"],
    ],
    MECH: [
        ["Engineering Mathematics I", "Engineering Physics", "Engineering Chemistry", "Engineering Graphics & AutoCAD", "Workshop Practice"],
        ["Engineering Mathematics II", "Mechanics of Solids", "Engineering Thermodynamics", "Manufacturing Processes I", "Fluid Mechanics"],
        ["Design of Machine Elements", "Kinematics of Machinery", "Manufacturing Processes II", "Material Science & Metallurgy", "Thermal Engineering"],
        ["Dynamics of Machinery", "Heat Transfer", "CNC Machining & Robotics", "Industrial Metrology", "Automobile Engineering"],
        ["Advanced Manufacturing", "Finite Element Analysis", "Industrial Engineering", "Refrigeration & Air Conditioning", "Mechatronics"],
        ["CAD/CAM", "Tribology", "Non-Destructive Testing", "Renewable Energy Systems", "Robotics & Automation"],
        ["Product Design & Development", "Industrial Safety & Management", "Operations Management", "Composite Materials", "Hydraulics & Pneumatics"],
        ["Project Work (MECH Phase I)", "Project Work (MECH Phase II)", "Total Quality Management", "Entrepreneurship for Engineers", "Industry Internship"],
    ],
    ECE: [
        ["Engineering Mathematics I", "Engineering Physics", "Basic Electronics", "Engineering Graphics", "Problem Solving in Python"],
        ["Engineering Mathematics II", "Network Analysis", "Electronic Devices & Circuits", "Digital Electronics", "Signals & Systems"],
        ["Analog Circuits", "Digital Communication", "Electromagnetic Fields", "Microprocessors & Interfaces", "Linear Integrated Circuits"],
        ["VLSI Design", "Communication Systems", "Control Systems", "Digital Signal Processing", "Antenna & Wave Propagation"],
        ["RF & Microwave Engineering", "Optical Communication", "Robotics & Embedded Systems", "Wireless Networks", "Image Processing"],
        ["IoT System Design", "FPGA Design", "Satellite Communication", "Medical Electronics", "PCB Design & Testing"],
        ["AI for Signal Processing", "5G Technologies", "Cognitive Radio Networks", "Smart Grid Technology", "Biomedical Signal Analysis"],
        ["Project (ECE Phase I)", "Project (ECE Phase II)", "Technology Entrepreneurship", "Spectrum Management", "Industry Training Report"],
    ],
    EEE: [
        ["Engineering Mathematics I", "Engineering Physics", "Basic Mechanical Engineering", "Engineering Graphics", "Introduction to EEE"],
        ["Engineering Mathematics II", "Circuit Theory", "Electronic Devices & Circuits", "Electrical Machines I", "Measurements & Instrumentation"],
        ["Power Systems I", "Digital Electronics", "Control Systems", "Electrical Machines II", "Electromagnetic Theory"],
        ["Power Systems II", "Power Electronics", "Microprocessors in Electrical Systems", "High Voltage Engineering", "Switchgear & Protection"],
        ["Power System Analysis", "Special Electrical Machines", "Renewable Energy Systems", "Industrial Drives & Control", "Digital Control Systems"],
        ["Power Quality", "Smart Grid Technology", "Energy Auditing & Management", "Flexible AC Transmission", "Electric Vehicles"],
        ["Substation Design", "Distributed Generation", "SCADA Systems", "Energy Storage Technologies", "Professional Ethics in Engineering"],
        ["Project (EEE Phase I)", "Project (EEE Phase II)", "Power Market Economics", "Grid Integration of Renewables", "Industry Internship"],
    ],
    BIOTECH: [
        ["Biological Chemistry I", "Mathematics for Biotechnology", "Physics for Life Sciences", "Introduction to Biotechnology", "Laboratory Skills"],
        ["Biological Chemistry II", "Cell Biology & Genetics", "Microbiology", "Biophysics", "Biostatistics"],
        ["Molecular Biology", "Enzymology", "Immunology", "Bioinformatics I", "Fermentation Technology"],
        ["Genetic Engineering", "Downstream Processing", "Plant Biotechnology", "Bioinformatics II", "Bioethics & IPR"],
        ["Industrial Biotechnology", "Environmental Biotechnology", "Medical Biotechnology", "Genomics & Proteomics", "Bioreactor Design"],
        ["Drug Delivery Systems", "Animal Cell Technology", "Systems Biology", "Nano Biotechnology", "Food Biotechnology"],
        ["Cancer Biology", "Stem Cell Technology", "Marine Biotechnology", "Regulatory Affairs in Biotech", "Biosafety & Risk Assessment"],
        ["Project (Biotech Phase I)", "Project (Biotech Phase II)", "Bioprocess Scale-up", "Entrepreneurship in Biotech", "Internship Report"],
    ],
    AGRI: [
        ["Agricultural Mathematics", "Agricultural Physics", "Agricultural Chemistry", "Introduction to Agricultural Engineering", "Farm Machinery I"],
        ["Soil & Water Conservation", "Agricultural Biology", "Irrigation & Drainage Engineering", "Farm Machinery II", "Agronomy I"],
        ["Land & Water Resources", "Agricultural Mechanization", "Post Harvest Technology", "Agronomy II", "Agricultural Meteorology"],
        ["Precision Agriculture", "Agricultural Structures", "Crop Science", "Remote Sensing in Agriculture", "Agricultural Economics"],
        ["GIS for Agriculture", "Agricultural Electrification", "Food Processing Engineering", "Protected Cultivation", "Agricultural Statistics"],
        ["Watershed Management", "Renewable Energy in Agriculture", "Agricultural Information Systems", "Drip Irrigation Design", "Weed Science"],
        ["Agri-Business Management", "Rural Development Technology", "Climate-Smart Agriculture", "Vertical Farming Systems", "Agricultural Policy"],
        ["Project (Agri Phase I)", "Project (Agri Phase II)", "Farm Management", "Organic Farming Technology", "Industry Attachment Report"],
    ],
};

// ─── Seed function ────────────────────────────────────────────────────────
const seed = async () => {
    await connectDB();
    console.log("⚙️  Connected to DB. Running academic structure seed...\n");

    // Clear academic data
    await Promise.all([
        Department.deleteMany({}),
        Subject.deleteMany({}),
        Feedback.deleteMany({}),
    ]);
    console.log("🗑️  Cleared departments, subjects, and feedback\n");

    if (RESET_USERS) {
        await User.deleteMany({});
        console.log("🗑️  Cleared all users (--reset-users flag)\n");
    } else {
        // Only clear students that used old non-@bitsathy.in emails
        const deleted = await User.deleteMany({ email: { $not: /@college\.edu$/ } });
        if (deleted.deletedCount > 0)
            console.log(`🗑️  Removed ${deleted.deletedCount} user(s) with non-bitsathy.in emails\n`);
    }

    // ── 1. Departments ─────────────────────────────────────────────────────
    console.log("📂 Seeding departments...");
    const deptDocs = await Department.insertMany(
        DEPARTMENTS.map(d => ({
            name: d.name,
            code: d.code,
            cluster: d.cluster,
            hodName: d.hodName,
            description: `${d.cluster} — ${d.code} Department`,
        }))
    );
    const deptMap = {}; // code → document
    deptDocs.forEach(d => { deptMap[d.code] = d; });
    console.log(`✅ ${deptDocs.length} departments seeded: ${deptDocs.map(d => d.code).join(", ")}\n`);

    // ── 2. Subjects (5 per semester × 8 semesters × 8 departments) ─────────
    console.log("📚 Seeding subjects (320 total — 5 × 8 sems × 8 depts)...");
    const allSubjects = [];

    for (const dept of DEPARTMENTS) {
        const deptDoc = deptMap[dept.code];
        const facultyPool = FACULTY[dept.code];
        const templates = SUBJECT_TEMPLATES[dept.code];

        for (let semIdx = 0; semIdx < 8; semIdx++) {
            const sem = semIdx + 1;
            const semSubjects = templates[semIdx];

            for (let subIdx = 0; subIdx < 5; subIdx++) {
                // Rotate through faculty pool (8 faculty, 5 subjects per sem = cycles nicely)
                const faculty = facultyPool[subIdx % facultyPool.length];
                const code = `${dept.code}${sem}0${subIdx + 1}`;

                allSubjects.push({
                    name: semSubjects[subIdx],
                    subjectCode: code,
                    department: deptDoc._id,
                    facultyName: faculty.name,
                    facultyEmail: faculty.email,
                    semester: sem,
                    academicYear: ACADEMIC_YEAR,
                    isActive: true,
                });
            }
        }
    }

    const subjectDocs = await Subject.insertMany(allSubjects);
    console.log(`✅ ${subjectDocs.length} subjects seeded across all departments and semesters\n`);

    // ── 3. Admin ────────────────────────────────────────────────────────────
    console.log("👤 Seeding admin...");
    const existingAdmin = await User.findOne({ email: "admin@bitsathy.in", role: "admin" });
    if (!existingAdmin) {
        await User.create({
            name: "System Admin",
            email: "admin@bitsathy.in",
            password: "password123",
            role: "admin",
        });
        console.log("✅ Admin created: admin@bitsathy.in / admin123");
    } else {
        console.log("ℹ️  Admin already exists, skipping");
    }

    // ── 4. Sample students (one per department, sem 3) ──────────────────────
    console.log("\n👩‍🎓 Seeding sample students (Sem 3, one per department)...");
    const studentData = [
        { name: "Ananya Krishnan", email: "ananya@bitsathy.in", roll: "CSE2024001", code: "CSE" },
        { name: "Rohan Desai", email: "rohan@bitsathy.in", roll: "IT2024001", code: "IT" },
        { name: "Meghna Pillai", email: "meghna@bitsathy.in", roll: "CSBS2024001", code: "CSBS" },
        { name: "Karthik Raju", email: "karthik@bitsathy.in", roll: "MECH2024001", code: "MECH" },
        { name: "Nisha Suresh", email: "nisha@bitsathy.in", roll: "ECE2024001", code: "ECE" },
        { name: "Tarun Elango", email: "tarun@bitsathy.in", roll: "EEE2024001", code: "EEE" },
        { name: "Sowmya Anandan", email: "sowmya@bitsathy.in", roll: "BIOTECH2024001", code: "BIOTECH" },
        { name: "Vignesh Pandi", email: "vignesh@bitsathy.in", roll: "AGRI2024001", code: "AGRI" },
    ];
    const createdStudents = [];
    for (const s of studentData) {
        const existing = await User.findOne({ email: s.email });
        if (!existing) {
            const student = await User.create({
                name: s.name,
                email: s.email,
                password: "password123",
                role: "student",
                rollNumber: s.roll,
                department: deptMap[s.code]._id,
                semester: 3,
            });
            createdStudents.push(student);
            console.log(`   ✅ ${s.email} (${s.code}, Sem 3)`);
        } else {
            console.log(`   ℹ️  ${s.email} already exists, skipping`);
        }
    }

    // ── Summary ─────────────────────────────────────────────────────────────
    console.log("\n══════════════════════════════════════════════════════");
    console.log("🎉 Academic Structure Seed Complete!");
    console.log("══════════════════════════════════════════════════════");
    console.log(`\n📂 Departments (8):`);
    for (const d of DEPARTMENTS) {
        console.log(`   ${d.cluster.padEnd(14)} │ ${d.code.padEnd(8)} │ ${d.name}`);
    }
    console.log(`\n📚 Subjects: ${subjectDocs.length} total`);
    console.log(`   • 8 departments × 8 semesters × 5 subjects = 320`);
    console.log(`\n👨‍🏫 Faculty: ${Object.values(FACULTY).flat().length} total`);
    console.log(`   • 8 faculty per department across 8 departments = 64`);
    console.log(`\n🔐 Login Credentials:`);
    console.log(`   Admin:   admin@bitsathy.in / password123`);
    console.log(`   Students (all password: password123):`);
    for (const s of studentData) {
        const dept = DEPARTMENTS.find(d => d.code === s.code);
        console.log(`     ${s.email.padEnd(28)} (${s.code} | ${dept.cluster} | Sem 3)`);
    }
    console.log("\n══════════════════════════════════════════════════════\n");

    await mongoose.disconnect();
    process.exit(0);
};

seed().catch(err => {
    console.error("❌ Seed failed:", err.message);
    console.error(err);
    process.exit(1);
});
