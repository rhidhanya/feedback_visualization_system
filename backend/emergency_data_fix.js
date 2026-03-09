const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");
const Subject = require("./models/Subject");
const Department = require("./models/Department");
const Feedback = require("./models/Feedback");

const MONGO_URI = process.env.MONGO_URI;

async function runFix() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB...");

        // 1. Get all departments
        const departments = await Department.find().lean();
        console.log(`Found ${departments.length} departments.`);

        // 2. Load all faculties
        const faculties = await User.find({ role: "faculty" }).limit(20).lean();
        
        // 3. Ensure subjects exist for all departments
        for (const dept of departments) {
            const existingCount = await Subject.countDocuments({ department: dept._id });
            console.log(`Dept: ${dept.code} currently has ${existingCount} subjects.`);
            
            if (existingCount === 0) {
                console.log(`Creating default subjects for ${dept.code}...`);
                const demoSubjects = [
                    { name: "Fundamentals of " + dept.code, code: "101" },
                    { name: "Systems in " + dept.code, code: "201" },
                    { name: "Design for " + dept.code, code: "301" },
                    { name: "Ethics in " + dept.code, code: "401" },
                    { name: "Data Science for " + dept.code, code: "501" },
                    { name: "Applications of " + dept.code, code: "601" },
                    { name: "Advanced " + dept.code, code: "701" },
                    { name: "Project in " + dept.code, code: "801" }
                ];
                
                const subjectsToCreate = demoSubjects.map((s, idx) => ({
                    name: s.name,
                    subjectCode: `${dept.code}${s.code}`,
                    department: dept._id,
                    semester: idx + 1,
                    faculty: faculties[idx % faculties.length]?._id || null,
                    facultyName: faculties[idx % faculties.length]?.name || "Unassigned Faculty",
                    academicYear: "2024-25",
                    isActive: true
                }));
                
                try {
                    await Subject.insertMany(subjectsToCreate, { ordered: false });
                    console.log(`Successfully seeded subjects for ${dept.code}`);
                } catch (e) {
                    console.log(`Note: Some subjects already existed for ${dept.code}`);
                }
            }
        }

        // 4. Load all subjects for re-linking
        const allSubjects = await Subject.find().lean();
        const subLookup = {}; // deptId_semester -> [subjectIds]
        allSubjects.forEach(s => {
            const key = `${s.department}_${s.semester}`;
            if (!subLookup[key]) subLookup[key] = [];
            subLookup[key].push(s._id);
        });

        // 5. Re-link Orphaned Feedbacks
        console.log("Re-linking orphaned feedbacks...");
        const orphanedFeedbacks = await Feedback.find().lean();
        console.log(`Total feedbacks to process: ${orphanedFeedbacks.length}`);

        let relinkedCount = 0;
        let deptRelinkedCount = 0;
        let skippedCount = 0;

        for (const fb of orphanedFeedbacks) {
            let updates = {};
            let currentDeptId = fb.departmentId;

            // Fix department if currently orphan
            const deptIdStr = fb.departmentId?.toString();
            const deptMatch = departments.find(d => d._id.toString() === deptIdStr);
            if (!deptMatch) {
                currentDeptId = departments[0]._id;
                updates.departmentId = currentDeptId;
                deptRelinkedCount++;
            }

            // Fix subject link if orphan
            const subIdStr = fb.subjectId?.toString();
            const subMatch = allSubjects.find(s => s._id.toString() === subIdStr);
            if (!subMatch) {
                const key = `${currentDeptId}_${fb.semester}`;
                const validSubs = subLookup[key] || subLookup[`${departments[0]._id}_${fb.semester}`];
                
                if (validSubs && validSubs.length > 0) {
                    updates.subjectId = validSubs[0];
                    relinkedCount++;
                }
            }

            if (Object.keys(updates).length > 0) {
                try {
                    // Use findOneAndUpdate with runValidators: false just to be safe
                    // But importantly, we handle the error if it violates the unique index
                    await Feedback.updateOne({ _id: fb._id }, { $set: updates });
                } catch (err) {
                    if (err.code === 11000) {
                        // console.log(`Skipping duplicate feedback for student ${fb.studentId} on re-linked subject.`);
                        skippedCount++;
                    } else {
                        console.error(`Update failed for ${fb._id}:`, err.message);
                    }
                }
            }
        }

        console.log(`Fix Summary:`);
        console.log(`- Updated department links: ${deptRelinkedCount}`);
        console.log(`- Re-linked subjects: ${relinkedCount}`);
        console.log(`- Skipped (Duplicates): ${skippedCount}`);
        console.log(`All operations completed.`);
        process.exit(0);
    } catch (err) {
        console.error("Critical Failure:", err);
        process.exit(1);
    }
}

runFix();
