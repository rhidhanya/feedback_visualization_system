const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Sender is required"],
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Recipient is required"],
        },
        subject: {
            type: String,
            required: [true, "Subject is required"],
            trim: true,
            maxlength: 200,
        },
        body: {
            type: String,
            required: [true, "Message body is required"],
            trim: true,
            maxlength: 2000,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for fast lookups
messageSchema.index({ recipient: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
