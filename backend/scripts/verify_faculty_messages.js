require('dotenv').config();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const connectDB = require('../config/db');

async function testMessageFiltering() {
    await connectDB();
    console.log('Connected to DB');

    // 1. Setup mock users
    const admin = await User.findOne({ role: 'admin' });
    const hod = await User.findOne({ role: 'hod' });
    const principal = await User.findOne({ role: 'principal' });
    const faculty = await User.findOne({ role: 'faculty' });

    if (!admin || !hod || !principal || !faculty) {
        console.error('Missing test users. Please run seed script first.');
        process.exit(1);
    }

    console.log(`Using Faculty: ${faculty.name} (${faculty._id})`);

    // 2. Clear old test messages
    await Message.deleteMany({ text: /Test Filter/ });

    // 3. Create test messages
    console.log('Creating test messages...');
    await Message.create([
        { sender: admin._id, senderRole: 'admin', receiverRoles: ['faculty'], text: 'Test Filter Admin' },
        { sender: hod._id, senderRole: 'hod', receiverRoles: ['faculty'], text: 'Test Filter HOD' },
        { sender: principal._id, senderRole: 'principal', receiverRoles: ['faculty'], text: 'Test Filter Principal' },
        { sender: faculty._id, senderRole: 'faculty', receiverRoles: ['hod'], text: 'Test Filter Sent By Faculty' },
    ]);

    // 4. Simulate getMessages for Faculty
    // We'll mimic the controller logic
    const userRole = 'faculty';
    const userId = faculty._id;

    let query = {
        $or: [
            { sender: userId },
            { 
                receiverRoles: userRole,
                ...(userRole === "faculty" ? { senderRole: { $in: ["hod", "principal"] } } : {})
            }
        ]
    };

    const messages = await Message.find(query).sort('-createdAt');
    
    console.log('\nRetrieved Messages for Faculty:');
    messages.forEach(m => {
        console.log(`- From: ${m.senderRole}, Text: ${m.text}`);
    });

    const texts = messages.map(m => m.text);
    
    const hasHod = texts.includes('Test Filter HOD');
    const hasPrincipal = texts.includes('Test Filter Principal');
    const hasAdmin = texts.includes('Test Filter Admin');
    const hasSent = texts.includes('Test Filter Sent By Faculty');

    console.log('\nAssertions:');
    console.log(`- HOD message shown: ${hasHod}`);
    console.log(`- Principal message shown: ${hasPrincipal}`);
    console.log(`- Admin message HIDDEN: ${!hasAdmin}`);
    console.log(`- Sent message shown: ${hasSent}`);

    if (hasHod && hasPrincipal && !hasAdmin && hasSent) {
        console.log('\n✅ VERIFICATION SUCCESSFUL');
    } else {
        console.log('\n❌ VERIFICATION FAILED');
    }

    await Message.deleteMany({ text: /Test Filter/ });
    mongoose.disconnect();
}

testMessageFiltering();
