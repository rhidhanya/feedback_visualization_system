const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        fromUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        toUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        domain: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ["negative_feedback", "admin_alert", "general"],
            default: "general",
        },
        title: { type: String, required: true, trim: true },
        message: { type: String, required: true, trim: true },
        feedbackRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DomainFeedback",
        },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

notificationSchema.index({ toUserId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ domain: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
