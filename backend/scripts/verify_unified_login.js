require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const connectDB = require('../config/db');

async function testUnifiedLogin() {
    await connectDB();
    console.log('Connected to DB');

    // 1. Setup mock data
    const deptCode = 'TUNIT';
    let dept = await Department.findOne({ code: deptCode });
    if (!dept) {
        dept = await Department.create({ name: 'Test Unified Unit', code: deptCode });
    }

    const facultyEmail = 'faculty.test@bitsathy.in';
    const hodEmail = 'hod.test@bitsathy.in';

    await User.deleteMany({ email: { $in: [facultyEmail, hodEmail] } });

    const facultyUser = await User.create({
        name: 'Test Faculty',
        email: facultyEmail,
        password: 'password123',
        role: 'faculty',
        department: dept._id
    });

    const hodUser = await User.create({
        name: 'Test HOD',
        email: hodEmail,
        password: 'password123',
        role: 'hod',
        department: dept._id,
        hodId: 'TUH01'
    });

    console.log('Test users created.');

    // Mock controller context
    const { unifiedFacultyHodLogin } = require('../controllers/authController');

    const mockRes = () => {
        const res = {};
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (data) => { res.body = data; return res; };
        return res;
    };

    console.log('\n--- Scenario 1: Faculty Login (No Dept ID) ---');
    const res1 = mockRes();
    await unifiedFacultyHodLogin({ body: { email: facultyEmail, password: 'password123' } }, res1);
    console.log(`Status: ${res1.statusCode || 200}, Role: ${res1.body.user.role}, Success: ${res1.body.success}`);

    console.log('\n--- Scenario 2: HOD Login (With Correct Dept ID) ---');
    const res2 = mockRes();
    await unifiedFacultyHodLogin({ body: { email: hodEmail, password: 'password123', departmentCode: deptCode } }, res2);
    console.log(`Status: ${res2.statusCode || 200}, Role: ${res2.body.user.role}, Success: ${res2.body.success}`);

    console.log('\n--- Scenario 3: HOD Login (With Wrong Dept ID) ---');
    const res3 = mockRes();
    await unifiedFacultyHodLogin({ body: { email: hodEmail, password: 'password123', departmentCode: 'WRONG' } }, res3);
    console.log(`Status: ${res3.statusCode || 401}, Success: ${res3.body.success}, Message: ${res3.body.message}`);

    console.log('\n--- Scenario 4: Faculty Login (Entering HOD credentials but no Dept ID) ---');
    const res4 = mockRes();
    await unifiedFacultyHodLogin({ body: { email: hodEmail, password: 'password123' } }, res4);
    console.log(`Status: ${res4.statusCode || 403}, Success: ${res4.body.success}, Message: ${res4.body.message}`);

    console.log('\n--- Scenario 5: HOD Login (Entering Faculty credentials with Dept ID) ---');
    const res5 = mockRes();
    await unifiedFacultyHodLogin({ body: { email: facultyEmail, password: 'password123', departmentCode: deptCode } }, res5);
    console.log(`Status: ${res5.statusCode || 403}, Success: ${res5.body.success}, Message: ${res5.body.message}`);

    // Assertions
    const check1 = res1.body.user?.role === 'faculty' && res1.body.success === true;
    const check2 = res2.body.user?.role === 'hod' && res2.body.success === true;
    const check3 = res3.statusCode === 401 && res3.body.success === false;
    const check4 = res4.statusCode === 403 && res4.body.success === false;
    const check5 = res5.statusCode === 403 && res5.body.success === false;

    console.log('\nAssertion Details:');
    console.log(`- Check 1 (Faculty): ${check1}`);
    console.log(`- Check 2 (HOD): ${check2}`);
    console.log(`- Check 3 (Wrong Dept): ${check3}`);
    console.log(`- Check 4 (HOD as Faculty): ${check4}`);
    console.log(`- Check 5 (Faculty as HOD): ${check5}`);

    if (check1 && check2 && check3 && check4 && check5) {
        console.log('\n✅ UNIFIED LOGIN VERIFICATION SUCCESSFUL');
    } else {
        console.log('\n❌ UNIFIED LOGIN VERIFICATION FAILED');
    }

    // Cleanup
    await User.deleteMany({ email: { $in: [facultyEmail, hodEmail] } });
    await Department.deleteOne({ code: deptCode });
    mongoose.disconnect();
}

testUnifiedLogin();
