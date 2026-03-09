require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const connectDB = require('../config/db');

async function verifyHodEnhancements() {
    await connectDB();
    console.log('Connected to DB');

    const deptCode1 = 'CSE-DET';
    const deptCode2 = 'ECE-DET';

    await Department.deleteMany({ code: { $in: [deptCode1, deptCode2] } });
    await User.deleteMany({ email: /verify\.hod/ });

    const dept1 = await Department.create({ name: 'Computer Science', code: deptCode1 });
    const dept2 = await Department.create({ name: 'Electronics', code: deptCode2 });

    const hod = await User.create({
        name: 'HOD CSE',
        email: 'hod.verify.hod@bitsathy.in',
        password: 'password123',
        role: 'hod',
        department: dept1._id
    });

    const facultySame = await User.create({
        name: 'Faculty CSE',
        email: 'fac1.verify.hod@bitsathy.in',
        password: 'password123',
        role: 'faculty',
        department: dept1._id
    });

    const facultyOther = await User.create({
        name: 'Faculty ECE',
        email: 'fac2.verify.hod@bitsathy.in',
        password: 'password123',
        role: 'faculty',
        department: dept2._id
    });

    console.log('Test setup complete.');

    const { getRecipients } = require('../controllers/userController');

    const mockRes = () => {
        const res = {};
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (data) => { res.body = data; return res; };
        return res;
    };

    console.log('\n--- Scenario: HOD fetches recipients (should only see faculty from same dept) ---');
    const res = mockRes();
    const req = {
        user: { userId: hod._id, role: 'hod', department: hod.department }
    };
    await getRecipients(req, res);

    const recipientEmails = res.body.data.map(r => r.email);
    console.log('Recipient Emails:', recipientEmails);

    const success = recipientEmails.includes(facultySame.email) && !recipientEmails.includes(facultyOther.email);

    if (success) {
        console.log('\n✅ HOD RECIPIENT FILTERING VERIFICATION SUCCESSFUL');
    } else {
        console.log('\n❌ HOD RECIPIENT FILTERING VERIFICATION FAILED');
    }

    await Department.deleteMany({ code: { $in: [deptCode1, deptCode2] } });
    await User.deleteMany({ email: /verify\.hod/ });
    mongoose.disconnect();
}

verifyHodEnhancements();
