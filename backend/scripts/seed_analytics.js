/**
 * Analytics Seed Script — Phase 4
 *
 * Creates a RICH dataset of 18 students across 3 departments
 * and ~60 feedback submissions with deliberately varied ratings
 * so all 6 analytics endpoints return meaningful data.
 *
 * Rating design:
 *   Prof. Suresh Nair (CS301)      → HIGH ratings (4-5)  → avg ~4.4
 *   Prof. Meena Rao (CS401)        → MID  ratings (3-4)  → avg ~3.2
 *   Prof. Rajesh Pillai (IT301)    → LOW  ratings (1-2)  → avg ~2.1  ← low performer
 *   Prof. Suresh Nair (IT401)      → HIGH ratings (4-5)  → avg ~4.2
 *   Prof. Ganesh Menon (MECH301)   → MID  ratings (3-4)  → avg ~3.5
 *   Prof. Deepa Iyer (MECH401)     → LOW  ratings (2-3)  → avg ~2.3  ← low performer
 *
 * Semester 4 data uses academicYear "2023-24" to test trend.
 * Semester 3 data uses academicYear "2024-25".
 *
 * Run: node scripts/seed_analytics.js
 * ⚠️  Clears Feedback and User collections first (keeps Departments & Subjects)
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const Department = require("../models/Department");
const Subject = require("../models/Subject");
const User = require("../models/User");
const Feedback = require("../models/Feedback");

// ─── Helpers ──────────────────────────────────────────────────────────────
const rand = (min, max) => Math.round(min + Math.random() * (max - min));

const makeRatings = (low, high) => ({
    teachingQuality: rand(low, high),
    communication: rand(low, high),
    punctuality: rand(low, high),
    subjectKnowledge: rand(low, high),
    doubtClarification: rand(low, high),
});

const createStudent = async (name, email, dept, semester) =>
    User.create({
        name,
        email,
        password: "student123",
        role: "student",
        rollNumber: `${dept.code}${2024 - Math.floor(Math.random() * 3)}${String(rand(1, 99)).padStart(3, "0")}`,
        department: dept._id,
        semester,
    });

// ─── Main ─────────────────────────────────────────────────────────────────
const seed = async () => {
    await connectDB();
    console.log("⚙️  Connected. Running analytics seed...\n");

    // Clear feedback + users only (keep depts & subjects)
    await Promise.all([
        Feedback.deleteMany({}),
        User.deleteMany({}),
    ]);
    console.log("🗑️  Cleared Feedback and Users\n");

    // Get existing departments and subjects
    const [cs, it, mech] = await Promise.all([
        Department.findOne({ code: "CS" }),
        Department.findOne({ code: "IT" }),
        Department.findOne({ code: "MECH" }),
    ]);

    if (!cs || !it || !mech) {
        console.error("❌ Departments not found. Run seed.js first.\n");
        process.exit(1);
    }

    const subjects = {};
    for (const code of ["CS301", "CS401", "IT301", "IT401", "MECH301", "MECH401"]) {
        subjects[code] = await Subject.findOne({ subjectCode: code });
    }

    // ── Admin ─────────────────────────────────────────────────────────────
    const admin = await User.create({
        name: "Admin User",
        email: "admin@bitsathy.in",
        password: "admin123",
        role: "admin",
    });

    // ── Students: CS Sem 3 (will submit for CS301) ────────────────────────
    console.log("Creating students...");
    const csStudents3 = await Promise.all([
        createStudent("Ananya Krishnan", "ananya@student.edu", cs, 3),
        createStudent("Arjun Menon", "arjun@student.edu", cs, 3),
        createStudent("Divya Nair", "divya@student.edu", cs, 3),
        createStudent("Kiran Patel", "kiran@student.edu", cs, 3),
        createStudent("Lakshmi Rao", "lakshmi@student.edu", cs, 3),
        createStudent("Manoj Kumar", "manoj@student.edu", cs, 3),
    ]);

    // ── Students: CS Sem 4 (will submit for CS401) ────────────────────────
    const csStudents4 = await Promise.all([
        createStudent("Nithya Sharma", "nithya@student.edu", cs, 4),
        createStudent("Prathik Bhat", "prathik@student.edu", cs, 4),
        createStudent("Ranjith Das", "ranjith@student.edu", cs, 4),
    ]);

    // ── Students: IT Sem 3 (will submit for IT301) ────────────────────────
    const itStudents3 = await Promise.all([
        createStudent("Rohan Desai", "rohan@student.edu", it, 3),
        createStudent("Priya Joshi", "priya@student.edu", it, 3),
        createStudent("Suresh Thomas", "sureshT@student.edu", it, 3),
        createStudent("Tanya Mehta", "tanya@student.edu", it, 3),
    ]);

    // ── Students: IT Sem 4 (will submit for IT401) ────────────────────────
    const itStudents4 = await Promise.all([
        createStudent("Uday Singh", "uday@student.edu", it, 4),
        createStudent("Veena Pillai", "veena@student.edu", it, 4),
    ]);

    // ── Students: MECH Sem 3 (will submit for MECH301) ───────────────────
    const mechStudents3 = await Promise.all([
        createStudent("Sneha Patil", "sneha@student.edu", mech, 3),
        createStudent("Waqar Ali", "waqar@student.edu", mech, 3),
        createStudent("Yamini Reddy", "yamini@student.edu", mech, 3),
    ]);

    // ── Students: MECH Sem 4 (will submit for MECH401) ───────────────────
    const mechStudents4 = await Promise.all([
        createStudent("Zainab Shaikh", "zainab@student.edu", mech, 4),
        createStudent("Apoorv Verma", "apoorv@student.edu", mech, 4),
    ]);

    console.log(`✅ Created ${csStudents3.length + csStudents4.length + itStudents3.length + itStudents4.length + mechStudents3.length + mechStudents4.length} students + 1 admin`);

    // ── Feedback submissions ───────────────────────────────────────────────
    console.log("\nCreating feedback submissions...");

    const feedbacks = [];

    // CS301 → Prof. Suresh Nair → HIGH (4-5) → avg ≈ 4.4
    for (const s of csStudents3) {
        feedbacks.push(Feedback.create({
            studentId: s._id, subjectId: subjects.CS301._id,
            departmentId: cs._id, semester: 3, academicYear: "2024-25",
            ratings: makeRatings(4, 5),
            comments: "Great professor, very clear explanations.",
        }));
    }

    // CS401 → Prof. Meena Rao → MID (3-4) → avg ≈ 3.4
    for (const s of csStudents4) {
        feedbacks.push(Feedback.create({
            studentId: s._id, subjectId: subjects.CS401._id,
            departmentId: cs._id, semester: 4, academicYear: "2023-24",
            ratings: makeRatings(3, 4),
            comments: "Average teaching, could be more interactive.",
        }));
    }

    // IT301 → Prof. Rajesh Pillai → LOW (1-2) → avg ≈ 1.8  ← LOW PERFORMER
    for (const s of itStudents3) {
        feedbacks.push(Feedback.create({
            studentId: s._id, subjectId: subjects.IT301._id,
            departmentId: it._id, semester: 3, academicYear: "2024-25",
            ratings: makeRatings(1, 2),
            comments: "Needs significant improvement in teaching.",
        }));
    }

    // IT401 → Prof. Suresh Nair → HIGH (4-5) → avg ≈ 4.2
    for (const s of itStudents4) {
        feedbacks.push(Feedback.create({
            studentId: s._id, subjectId: subjects.IT401._id,
            departmentId: it._id, semester: 4, academicYear: "2023-24",
            ratings: makeRatings(4, 5),
            comments: "Excellent faculty, always helpful.",
        }));
    }

    // MECH301 → Prof. Ganesh Menon → MID (3-4) → avg ≈ 3.5
    for (const s of mechStudents3) {
        feedbacks.push(Feedback.create({
            studentId: s._id, subjectId: subjects.MECH301._id,
            departmentId: mech._id, semester: 3, academicYear: "2024-25",
            ratings: makeRatings(3, 4),
            comments: "Good knowledge, could improve communication.",
        }));
    }

    // MECH401 → Prof. Deepa Iyer → LOW (2-3) → avg ≈ 2.3  ← LOW PERFORMER
    for (const s of mechStudents4) {
        feedbacks.push(Feedback.create({
            studentId: s._id, subjectId: subjects.MECH401._id,
            departmentId: mech._id, semester: 4, academicYear: "2023-24",
            ratings: makeRatings(2, 3),
            comments: "Teaching could be more structured.",
        }));
    }

    await Promise.all(feedbacks);
    console.log(`✅ Created ${feedbacks.length} feedback submissions`);

    const total = await Feedback.countDocuments();
    console.log(`\n📊 Total feedback in DB: ${total}`);
    console.log(`   CS Dept  Sem 3 (2024-25): ${csStudents3.length} submissions`);
    console.log(`   CS Dept  Sem 4 (2023-24): ${csStudents4.length} submissions`);
    console.log(`   IT Dept  Sem 3 (2024-25): ${itStudents3.length} submissions  ← LOW PERF: Rajesh Pillai`);
    console.log(`   IT Dept  Sem 4 (2023-24): ${itStudents4.length} submissions`);
    console.log(`   MECH Dept Sem 3 (2024-25): ${mechStudents3.length} submissions`);
    console.log(`   MECH Dept Sem 4 (2023-24): ${mechStudents4.length} submissions  ← LOW PERF: Deepa Iyer`);

    console.log("\n──────────────────────────────────────────");
    console.log("🎉 Analytics seed complete!");
    console.log("\n📋 Test Login Credentials:");
    console.log("   Admin:   admin@bitsathy.in       / admin123");
    console.log("   Student: ananya@student.edu       / student123  (CS Sem 3)");
    console.log("   Student: nithya@student.edu       / student123  (CS Sem 4)");
    console.log("   Student: rohan@student.edu        / student123  (IT Sem 3)");
    console.log("──────────────────────────────────────────\n");

    await mongoose.disconnect();
    process.exit(0);
};

seed().catch((err) => {
    console.error("❌ Analytics seed failed:", err.message);
    process.exit(1);
});
