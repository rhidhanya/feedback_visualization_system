const mongoose = require('mongoose');
const User = require('./models/User');
const Department = require('./models/Department');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGO_URI;

async function fixUsers() {
  try {
    if (!MONGODB_URI) {
      console.error("MONGO_URI not found in .env");
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB Atlas");

    // 1. Password Resets
    const facultyPassword = await bcrypt.hash('faculty123', 10);
    const hodPassword = await bcrypt.hash('hod123', 10);
    const inchargePassword = await bcrypt.hash('incharge123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    console.log("Hashing complete. Updating users...");

    // Update Faculty
    const facultyUpdate = await User.updateMany(
      { role: 'faculty' },
      { $set: { password: facultyPassword, isActive: true } }
    );
    console.log(`Updated ${facultyUpdate.modifiedCount} Faculty passwords`);

    // Update HODs
    const hodUpdate = await User.updateMany(
      { role: 'hod' },
      { $set: { password: hodPassword, isActive: true } }
    );
    console.log(`Updated ${hodUpdate.modifiedCount} HOD passwords`);

    // Update Incharges
    const inchargeUpdate = await User.updateMany(
      { role: 'domain_head' },
      { $set: { password: inchargePassword, isActive: true } }
    );
    console.log(`Updated ${inchargeUpdate.modifiedCount} Incharge passwords`);

    // Update Deans/Principals/Admins
    const monitorUpdate = await User.updateMany(
      { role: { $in: ['dean', 'principal', 'admin'] } },
      { $set: { password: adminPassword, isActive: true } }
    );
    console.log(`Updated ${monitorUpdate.modifiedCount} Admin/Monitor passwords`);

    console.log("✅ All passwords reset successfully");
    process.exit(0);
  } catch (err) {
    console.error("Error during fixUsers:", err);
    process.exit(1);
  }
}

fixUsers();
