const mongoose = require('mongoose');
const User = require('./models/User');

async function test() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/collegepulse');
    const admin = await User.findOne({ role: 'admin' }).lean();
    require('fs').writeFileSync('/tmp/admin.json', JSON.stringify(admin, null, 2));
    process.exit(0);
  } catch(e) {
    require('fs').writeFileSync('/tmp/admin-err.txt', e.toString());
    process.exit(1);
  }
}
test();
