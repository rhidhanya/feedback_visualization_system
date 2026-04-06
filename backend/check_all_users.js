const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
    
    const users = await User.find({}, "name email role isActive");
    console.log(`Total users: ${users.length}`);
    
    users.forEach(u => {
      console.log(`- ${u.name} (${u.email}) : ${u.role} (Active: ${u.isActive})`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUsers();
