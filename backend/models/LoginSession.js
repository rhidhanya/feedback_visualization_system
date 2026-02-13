const mongoose = require("mongoose");

const LoginSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["login", "signup"],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  ipAddress: String,
  userAgent: String
});

module.exports = mongoose.model("LoginSession", LoginSessionSchema);
