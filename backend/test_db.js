const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/feedback_system');
  const Feedback = require('./models/Feedback');
  const fbs = await Feedback.find().limit(2).populate('subjectId');
  console.log(JSON.stringify(fbs, null, 2));
  process.exit(0);
}
run().catch(console.error);
