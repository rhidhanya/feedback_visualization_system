const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

async function checkRaw() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({ email: /admin|principal|dean/i });
    users.forEach(u => {
      console.log(`Email: ${u.email}, Role: ${u.role}, RoleType: ${typeof u.role}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkRaw();
