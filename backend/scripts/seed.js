/**
 * Seed Script — College Feedback System
 *
 * Creates:
 *   - 3 Departments (CS, IT, MECH)
 *   - 6 Subjects (2 per department, different semesters)
 *   - 1 Admin user
 *   - 3 Student users (one per department)
 *   - Sample feedback submissions
 *
 * Run: node scripts/seed.js
 * ⚠️  Drops all existing data in these collections first!
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const Department = require("../models/Department");
const Subject = require("../models/Subject");
const User = require("../models/User");
const Feedback = require("../models/Feedback");

const seed = async () => {
    await connectDB();
    console.log("⚙️  Connected to DB. Seeding...\n");

    // ─── Clear existing data ──────────────────────────────────────────────
    await Promise.all([
        Department.deleteMany({}),
        Subject.deleteMany({}),
        User.deleteMany({}),
        Feedback.deleteMany({}),
    ]);
    console.log("🗑️  Cleared existing collections\n");

    // ─── Departments ──────────────────────────────────────────────────────
    const [cs, it, mech] = await Department.insertMany([
        { name: "Computer Science", code: "CS", hodName: "Dr. Ravi Kumar" },
        { name: "Information Technology", code: "IT", hodName: "Dr. Priya Sharma" },
        { name: "Mechanical Engineering", code: "MECH", hodName: "Dr. Anil Verma" },
    ]);
    console.log("✅ Departments seeded:", [cs.code, it.code, mech.code].join(", "));

    // ─── Subjects ─────────────────────────────────────────────────────────
    const subjects = await Subject.insertMany([
        {
            name: "Data Structures",
            subjectCode: "CS301",
            department: cs._id,
            facultyName: "Prof. Suresh Nair",
            facultyEmail: "suresh.nair@bitsathy.in",
            semester: 3,
            academicYear: "2024-25",
        },
        {
            name: "Operating Systems",
            subjectCode: "CS401",
            department: cs._id,
            facultyName: "Prof. Meena Rao",
            facultyEmail: "meena.rao@bitsathy.in",
            semester: 4,
            academicYear: "2024-25",
        },
        {
            name: "Database Management Systems",
            subjectCode: "IT301",
            department: it._id,
            facultyName: "Prof. Rajesh Pillai",
            facultyEmail: "rajesh.pillai@bitsathy.in",
            semester: 3,
            academicYear: "2024-25",
        },
        {
            name: "Web Technologies",
            subjectCode: "IT401",
            department: it._id,
            facultyName: "Prof. Suresh Nair", // Same faculty teaches in IT too
            facultyEmail: "suresh.nair@bitsathy.in",
            semester: 4,
            academicYear: "2024-25",
        },
        {
            name: "Thermodynamics",
            subjectCode: "MECH301",
            department: mech._id,
            facultyName: "Prof. Ganesh Menon",
            facultyEmail: "ganesh.menon@bitsathy.in",
            semester: 3,
            academicYear: "2024-25",
        },
        {
            name: "Fluid Mechanics",
            subjectCode: "MECH401",
            department: mech._id,
            facultyName: "Prof. Deepa Iyer",
            facultyEmail: "deepa.iyer@bitsathy.in",
            semester: 4,
            academicYear: "2024-25",
        },
    ]);
    console.log("✅ Subjects seeded:", subjects.map((s) => s.subjectCode).join(", "));

    // ─── Admin User ───────────────────────────────────────────────────────
    const admin = await User.create({
        name: "Admin User",
        email: "admin@bitsathy.in",
        password: "admin123", // Will be hashed by pre-save hook
        role: "admin",
    });
    console.log("✅ Admin seeded:", admin.email);

    // ─── Student Users ────────────────────────────────────────────────────
    const [student1, student2, student3, faculty1] = await Promise.all([
        User.create({
            name: "Ananya Krishnan",
            email: "ananya.krishnan@bitsathy.in",
            password: "student123",
            role: "student",
            rollNumber: "CS2024001",
            department: cs._id,
            semester: 3,
        }),
        User.create({
            name: "Rohan Desai",
            email: "rohan.desai@bitsathy.in",
            password: "student123",
            role: "student",
            rollNumber: "IT2024001",
            department: it._id,
            semester: 3,
        }),
        User.create({
            name: "Sneha Patil",
            email: "sneha.patil@bitsathy.in",
            password: "student123",
            role: "student",
            rollNumber: "MECH2024001",
            department: mech._id,
            semester: 3,
        }),
        User.create({
            name: "Prof. Suresh Nair",
            email: "suresh.nair@bitsathy.in",
            password: "faculty123",
            role: "faculty",
            department: cs._id,
        }),
        User.create({
            name: "Dr. Amitabh Sharma",
            email: "dean@bitsathy.in",
            password: "admin123",
            role: "dean",
        }),
        User.create({
            name: "Dr. Rajeshwar Rao",
            email: "principal@bitsathy.in",
            password: "admin123",
            role: "principal",
        }),
    ]);
    console.log("✅ Students seeded: ananya@student.edu, rohan@student.edu, sneha@student.edu");
    console.log("✅ Dean & Principal seeded: dean@bitsathy.in, principal@bitsathy.in");
    console.log("✅ Faculty seeded: suresh.nair@bitsathy.in");

    // ─── Sample Feedback ──────────────────────────────────────────────────
    // CS students submit for CS301 (Sem 3)
    const cs301 = subjects.find((s) => s.subjectCode === "CS301");
    const it301 = subjects.find((s) => s.subjectCode === "IT301");
    const mech301 = subjects.find((s) => s.subjectCode === "MECH301");

    await Promise.all([
        Feedback.create({
            studentId: student1._id,
            subjectId: cs301._id,
            departmentId: cs._id,
            semester: 3,
            academicYear: "2024-25",
            ratings: {
                teachingQuality: 4,
                communication: 5,
                punctuality: 4,
                subjectKnowledge: 5,
                doubtClarification: 4,
            },
            comments: "Very engaging lectures with great examples.",
        }),
        Feedback.create({
            studentId: student2._id,
            subjectId: it301._id,
            departmentId: it._id,
            semester: 3,
            academicYear: "2024-25",
            ratings: {
                teachingQuality: 2,
                communication: 2,
                punctuality: 3,
                subjectKnowledge: 3,
                doubtClarification: 2,
            },
            comments: "Needs to improve clarity in explanations.",
        }),
        Feedback.create({
            studentId: student3._id,
            subjectId: mech301._id,
            departmentId: mech._id,
            semester: 3,
            academicYear: "2024-25",
            ratings: {
                teachingQuality: 3,
                communication: 4,
                punctuality: 5,
                subjectKnowledge: 4,
                doubtClarification: 3,
            },
            comments: "Good command of subject but needs more practice sessions.",
        }),
    ]);
    console.log("✅ Sample feedback seeded (3 submissions)\n");

    console.log("──────────────────────────────────────────");
    console.log("🎉 Seed complete!");
    console.log("\n📋 Login Credentials:");
    console.log("   Admin:   admin@bitsathy.in     / admin123");
    console.log("   Student: ananya@student.edu    / student123  (CS Sem 3)");
    console.log("   Student: rohan@student.edu     / student123  (IT Sem 3)");
    console.log("   Student: sneha@student.edu     / student123  (MECH Sem 3)");
    console.log("──────────────────────────────────────────\n");

    await mongoose.disconnect();
    process.exit(0);
};

seed().catch((err) => {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
});
