const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    try {
        console.log('Connecting to', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected');
        
        const User = require('./models/User');
        const hods = await User.find({ role: 'hod' }).lean();
        console.log('HOD Count:', hods.length);
        hods.forEach(h => {
            console.log(`Email: ${h.email}, Active: ${h.isActive}, Name: ${h.name}, Dept: ${h.department}`);
        });

        const users = await User.find({ email: /hod/i }).lean();
        console.log('Users with "hod" in email:', users.length);
        users.forEach(u => console.log(`Email: ${u.email}, Role: ${u.role}`));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
