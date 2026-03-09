const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/feedback_system');
    const User = require('./models/User');
    const u1 = await User.findOne({ role: 'student', residenceType: 'hosteller' }).select('email password');
    const u2 = await User.findOne({ role: 'student', residenceType: 'dayscholar' }).select('email password');
    console.log("Hosteller: ", u1 ? u1.email : "Not found");
    console.log("DayScholar: ", u2 ? u2.email : "Not found");
  } catch(e) { console.error(e) }
  process.exit(0);
}
run().catch(console.error);
