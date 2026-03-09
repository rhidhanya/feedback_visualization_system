require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');
const connectDB = require('../config/db');

async function verifyPrincipalMessaging() {
    await connectDB();
    console.log('Connected to DB');

    const principalEmail = 'principal.verify@bitsathy.in';
    const hodEmail = 'hod.verify@bitsathy.in';

    await User.deleteMany({ email: { $in: [principalEmail, hodEmail] } });
    await Message.deleteMany({ text: /Verification Message/ });

    const principal = await User.create({
        name: 'Verify Principal',
        email: principalEmail,
        password: 'password123',
        role: 'principal'
    });

    const hod = await User.create({
        name: 'Verify HOD',
        email: hodEmail,
        password: 'password123',
        role: 'hod',
        hodId: 'VHOD-01'
    });

    console.log('Test users created.');

    const { sendMessage, getMessages } = require('../controllers/messageController');

    const mockRes = () => {
        const res = {};
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (data) => { res.body = data; return res; };
        return res;
    };

    console.log('\n--- Scenario 1: Principal sends targeted message to HOD ---');
    const sendRes = mockRes();
    const sendReq = {
        user: { userId: principal._id, role: 'principal' },
        body: {
            receiverRoles: ['hod'],
            receiver: hod._id,
            subject: 'Verification Subject',
            text: 'Verification Message Targeted'
        }
    };
    await sendMessage(sendReq, sendRes);
    console.log(`Message Created: ${sendRes.body.success}`);

    console.log('\n--- Scenario 2: HOD retrieves their messages ---');
    const getRes = mockRes();
    const getReq = { user: { userId: hod._id, role: 'hod' } };
    await getMessages(getReq, getRes);
    
    const targetedMsg = getRes.body.data.find(m => m.subject === 'Verification Subject');
    console.log(`Found Targeted Message: ${!!targetedMsg}`);
    if (targetedMsg) {
        console.log(`- Subject: ${targetedMsg.subject}`);
        console.log(`- Text: ${targetedMsg.text}`);
        console.log(`- Receiver matches HOD: ${targetedMsg.receiver?._id.toString() === hod._id.toString()}`);
    }

    console.log('\n--- Scenario 3: Another user (Principal) retrieves messages ---');
    // Principal should see it as a sent message
    const getResP = mockRes();
    const getReqP = { user: { userId: principal._id, role: 'principal' } };
    await getMessages(getReqP, getResP);
    const sentMsg = getResP.body.data.find(m => m.subject === 'Verification Subject');
    console.log(`Principal sees sent message: ${!!sentMsg}`);

    const success = sendRes.body.success && targetedMsg && targetedMsg.receiver?._id.toString() === hod._id.toString() && !!sentMsg;

    if (success) {
        console.log('\n✅ PRINCIPAL MESSAGING VERIFICATION SUCCESSFUL');
    } else {
        console.log('\n❌ PRINCIPAL MESSAGING VERIFICATION FAILED');
    }

    await User.deleteMany({ email: { $in: [principalEmail, hodEmail] } });
    await Message.deleteMany({ text: /Verification Message/ });
    mongoose.disconnect();
}

verifyPrincipalMessaging();
