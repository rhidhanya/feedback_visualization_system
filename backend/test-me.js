const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function test() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/collegepulse');
    const admin = await User.findOne({ role: 'admin' }).lean();
    console.log(admin);
    process.exit(0);
  } catch(e) {
    console.log(e);
    process.exit(1);
  }
}
test();
