const mongoose = require('mongoose');
const Department = require('./models/Department');
const User = require('./models/User');
const Subject = require('./models/Subject');
require('dotenv').config();

async function getIds() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const depts = await Department.find({ code: { $in: ['CT', 'CSE', 'CSBS'] } });
        console.log("Departments found:", depts.map(d => ({ code: d.code, id: d._id })));

        const ctDept = depts.find(d => d.code === 'CT');
        const cseDept = depts.find(d => d.code === 'CSE');
        const csbsDept = depts.find(d => d.code === 'CSBS');

        if (!ctDept) {
            console.log("CT Dept not found!");
            return;
        }

        const faculty = await User.find({ 
            role: 'faculty', 
            department: { $in: [cseDept?._id, csbsDept?._id].filter(Boolean) } 
        }).select('name email department');
        
        console.log("Faculty from CSE/CSBS found:", faculty.length);
        console.log(JSON.stringify(faculty, null, 2));

        const ctSubjects = await Subject.find({ department: ctDept._id }).populate('faculty', 'name');
        console.log("CT Subjects found:", ctSubjects.length);
        console.log(JSON.stringify(ctSubjects.map(s => ({ name: s.name, faculty: s.faculty?.name })), null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

getIds();
