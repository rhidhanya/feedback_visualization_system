const mongoose = require('mongoose');
const User = require('./models/User');

async function test() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/collegepulse');
    const admin = await User.findOne({ role: 'admin' }).lean();
    require('fs').writeFileSync('./admin.json', JSON.stringify({ admin }, null, 2));
    console.log("Written successfully to ./admin.json");
    process.exit(0);
  } catch(e) {
    require('fs').writeFileSync('./admin-err.txt', e.toString());
    console.log("Error:", e);
    process.exit(1);
  }
}
test();
