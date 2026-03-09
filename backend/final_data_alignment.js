const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");
const Subject = require("./models/Subject");
const Department = require("./models/Department");
const Feedback = require("./models/Feedback");

const MONGO_URI = process.env.MONGO_URI;

async function alignData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB...");

        // 1. Get all departments
        const departments = await Department.find().lean();
        const deptMap = {};
        departments.forEach(d => deptMap[d._id.toString()] = d);
        console.log(`Found ${departments.length} departments.`);

        // 2. Clear existing subjects to start fresh with correct alignment
        console.log("Wiping existing subjects for re-alignment...");
        await Subject.deleteMany({});

        // 3. Get all faculties
        const faculties = await User.find({ role: "faculty" }).lean();
        console.log(`Found ${faculties.length} faculties.`);

        // 4. Create Subjects properly aligned to Faculty Department
        console.log("Creating aligned subjects...");
        const subjectNames = [
            "Introductory Concepts", "System Engineering", "Advanced Methodology", "Professional Ethics",
            "Design Thinking", "Laboratory Practice", "Theoretical Models", "Capstone Project"
        ];

        for (const dept of departments) {
            const deptFaculties = faculties.filter(f => f.department.toString() === dept._id.toString());
            
            if (deptFaculties.length === 0) {
                console.warn(`Warning: No faculty found for department ${dept.name}`);
                continue;
            }

            const subjectsToCreate = [];
            for (let sem = 1; sem <= 8; sem++) {
                // Assign a faculty from the SAME department
                const faculty = deptFaculties[sem % deptFaculties.length];
                
                subjectsToCreate.push({
                    name: `${subjectNames[sem-1]} in ${dept.code}`,
                    subjectCode: `${dept.code}${sem}01`,
                    department: dept._id,
                    semester: sem,
                    faculty: faculty._id,
                    facultyName: faculty.name,
                    facultyEmail: faculty.email,
                    academicYear: "2024-25",
                    isActive: true
                });
            }
            await Subject.insertMany(subjectsToCreate);
            console.log(`Created 8 aligned subjects for ${dept.code}`);
        }

        // 5. Seeding Feedback (Ensuring 20+ per Dept/Sem)
        console.log("Seeding feedback entries (Target: 20+ per dept/sem)...");
        const allSubjects = await Subject.find().lean();
        const students = await User.find({ role: "student" }).limit(50).lean();
        
        if (students.length < 20) {
            console.warn("Warning: Fewer than 20 students found. Feedback might overlap or be limited.");
        }

        const comments = [
            "Excellent teaching style.", "Very helpful in doubt sessions.", "Sessions are very interactive.",
            "Course material is well organized.", "Punctuality is appreciated.", "Could improve on speed of delivery.",
            "Great subject knowledge.", "Clear explanations with real-world examples.", "Passionate about the subject.",
            "Encourages student participation."
        ];

        for (const subj of allSubjects) {
            const currentCount = await Feedback.countDocuments({ subjectId: subj._id });
            const needed = Math.max(0, 25 - currentCount); // Target 25 to be safe

            if (needed > 0) {
                console.log(`Seeding ${needed} feedbacks for ${subj.subjectCode} (${subj.name})...`);
                const feedbackToSeed = [];
                for (let i = 0; i < needed; i++) {
                    const student = students[i % students.length];
                    const ratings = {
                        teachingQuality: Math.floor(Math.random() * 2) + 4, // 4-5
                        communication: Math.floor(Math.random() * 2) + 4,
                        punctuality: Math.floor(Math.random() * 2) + 4,
                        subjectKnowledge: Math.floor(Math.random() * 2) + 4,
                        doubtClarification: Math.floor(Math.random() * 2) + 3 // 3-5
                    };
                    
                    feedbackToSeed.push({
                        studentId: student._id,
                        subjectId: subj._id,
                        departmentId: subj.department,
                        semester: subj.semester,
                        academicYear: subj.academicYear,
                        ratings: ratings,
                        comments: comments[Math.floor(Math.random() * comments.length)]
                    });
                }
                // Use ordered: false to skip duplicates if index exists
                try {
                    await Feedback.insertMany(feedbackToSeed, { ordered: false });
                } catch (e) {
                    // Ignore bulk write errors (duplicates)
                }
            }
        }

        console.log("Data alignment and seeding completed successfully.");
        // Final sanity check
        const finalCount = await Feedback.countDocuments();
        console.log(`Total Feedback Records: ${finalCount}`);
        
        process.exit(0);
    } catch (err) {
        console.error("Alignment failed:", err);
        process.exit(1);
    }
}

alignData();
