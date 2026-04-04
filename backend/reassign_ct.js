const mongoose = require('mongoose');
const User = require('./models/User');
const Subject = require('./models/Subject');
require('dotenv').config();

async function reassign() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const ctDeptId = '69bbb110d9272ca0ee15effc';
        const cseDeptId = '69afda089666f6a70a3ecb3f';
        const csbsDeptId = '69afda089666f6a70a3ecb41';

        const faculty = await User.find({ 
            role: 'faculty', 
            department: { $in: [cseDeptId, csbsDeptId] } 
        }).select('_id name');
        
        if (faculty.length === 0) {
            console.log("No faculty found in CSE/CSBS!");
            return;
        }

        const ctSubjects = await Subject.find({ department: ctDeptId });
        console.log(`Found ${ctSubjects.length} CT subjects to reassign.`);

        for (let i = 0; i < ctSubjects.length; i++) {
            const facultyMember = faculty[i % faculty.length];
            ctSubjects[i].faculty = facultyMember._id;
            await ctSubjects[i].save();
            console.log(`Assigned ${ctSubjects[i].name} to ${facultyMember.name}`);
        }

        console.log("Reassignment complete.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

reassign();
