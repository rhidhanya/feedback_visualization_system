const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["rating", "text", "choice", "multi", "date", "time", "file"],
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
});

const feedbackSchema = new mongoose.Schema({
  userId: {   // 🔥 ADD THIS
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  formName: {
    type: String,
    default: "Unknown Form"
  },
  responses: {
    type: [responseSchema],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Feedback", feedbackSchema);