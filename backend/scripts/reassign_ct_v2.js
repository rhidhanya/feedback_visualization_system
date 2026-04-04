const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Department = require('../models/Department');
require('dotenv').config(); // Load from process.cwd() should work if run from backend/

async function reassign() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // 1. Find the departments
        const depts = await Department.find({ 
            code: { $in: ['CT', 'CSE', 'CSBS'] } 
        });
        
        const ctDept = depts.find(d => d.code === 'CT');
        const cseDepts = depts.filter(d => ['CSE', 'CSBS'].includes(d.code)).map(d => d._id);

        if (!ctDept) {
            console.error("CT Department not found!");
            process.exit(1);
        }

        console.log(`Target Dept (CT): ${ctDept._id}`);
        console.log(`Source Depts (CSE/CSBS): ${cseDepts}`);

        // 2. Find ALL faculty in CSE/CSBS
        const allFaculty = await User.find({ 
            role: 'faculty', 
            department: { $in: cseDepts } 
        }).select('_id name email');

        console.log(`Found ${allFaculty.length} total faculty members in CSE/CSBS.`);

        // 3. Find which faculty are already assigned to SUBJECTS
        const assignedFacultyIds = await Subject.distinct('faculty', { faculty: { $ne: null } });
        
        // 4. Filter for UNOCCUPIED faculty (those NOT in assignedFacultyIds)
        const unoccupiedFaculty = allFaculty.filter(f => !assignedFacultyIds.some(id => id.equals(f._id)));

        console.log(`Found ${unoccupiedFaculty.length} unoccupied faculty members.`);

        if (unoccupiedFaculty.length === 0) {
            console.log("No unoccupied faculty found! Using all CSE/CSBS faculty instead as fallback.");
        }

        const facultyToUse = unoccupiedFaculty.length > 0 ? unoccupiedFaculty : allFaculty;

        // 5. Find CT subjects
        const ctSubjects = await Subject.find({ department: ctDept._id });
        console.log(`Found ${ctSubjects.length} subjects in CT department.`);

        if (ctSubjects.length === 0) {
            console.log("No CT subjects found to reassign.");
            process.exit(0);
        }

        // 6. Perform reassignment
        for (let i = 0; i < ctSubjects.length; i++) {
            const facultyMember = facultyToUse[i % facultyToUse.length];
            
            ctSubjects[i].faculty = facultyMember._id;
            ctSubjects[i].facultyName = facultyMember.name;
            ctSubjects[i].facultyEmail = facultyMember.email;
            
            await ctSubjects[i].save();
            console.log(`Assigned Subject: ${ctSubjects[i].name} (${ctSubjects[i].subjectCode}) -> Faculty: ${facultyMember.name}`);
        }

        console.log("Reassignment complete.");
        process.exit(0);
    } catch (err) {
        console.error("Error during reassignment:", err);
        process.exit(1);
    }
}

reassign();
