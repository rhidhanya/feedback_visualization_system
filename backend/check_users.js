const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const connectDB = require('./config/db');

async function checkUsers() {
    await connectDB();
    const domainHeads = await User.find({ role: 'domain_head' }).select('+password');
    console.log('Domain Head Users:');
    domainHeads.forEach(u => {
        console.log(`Email: "${u.email}", Domain: "${u.assignedDomain}", Active: ${u.isActive}`);
    });
    
    const sample = await User.findOne({ email: 'ravi.kumar@bitsathy.in' }).select('+password');
    if (sample) {
        console.log('\nSample User (Ravi Kumar):');
        console.log(JSON.stringify(sample, null, 2));
    } else {
        console.log('\nRavi Kumar not found with exact email "ravi.kumar@bitsathy.in"');
    }
    
    mongoose.disconnect();
}

checkUsers();
