const mongoose = require('mongoose');
require('dotenv').config();

async function checkHod() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        const users = await db.collection('users').find({ role: 'hod' }).toArray();
        
        console.log('HOD Users found:', users.length);
        for (const h of users) {
           console.log(`- Email: ${h.email}, Name: ${h.name}, DeptID: ${h.department}, Active: ${h.isActive}, role: ${h.role}`);
        }

        const depts = await db.collection('departments').find({}).toArray();
        console.log('Departments found:', depts.length);
        depts.forEach(d => console.log(`- ${d.code}: ${d._id}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkHod();
