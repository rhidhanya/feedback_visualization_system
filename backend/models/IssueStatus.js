const mongoose = require("mongoose");

const issueStatusSchema = new mongoose.Schema(
    {
        notificationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Notification",
            required: true,
        },
        feedbackRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DomainFeedback",
        },
        domain: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["Pending", "In Progress", "Rectified", "Closed"],
            default: "Pending",
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        adminNote: { type: String, trim: true, default: "" },
        headResponse: { type: String, trim: true, default: "" },
    },
    { timestamps: true }
);

issueStatusSchema.index({ domain: 1, status: 1 });
issueStatusSchema.index({ notificationId: 1 });

module.exports = mongoose.model("IssueStatus", issueStatusSchema);
