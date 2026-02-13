const mongoose = require("mongoose");

const fileStatSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true
  },
  uploadCount: { type: Number, default: 1 },
  downloadCount: { type: Number, default: 0 },
  lastUploadedAt: { type: Date, default: Date.now },
  metadata: [{
    columnName: String,
    type: { type: String, enum: ['numeric', 'categorical', 'date', 'text'] },
    sampleValues: [mongoose.Schema.Types.Mixed]
  }],
  chartConfig: { type: mongoose.Schema.Types.Mixed, default: {} }
});

// Compound unique index for fileName and userId
fileStatSchema.index({ fileName: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("FileStat", fileStatSchema);
