const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        senderRole: {
            type: String, // 'dean', 'principal', 'admin', 'domain_head'
            required: true,
        },
        receiverRoles: [{
            type: String, // roles that can view this message
        }],
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        domainContext: {
            type: String, // optional, ties message to a specific domain e.g. 'hostel'
            trim: true,
        },
        subject: {
            type: String,
            trim: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
        },
        readBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }]
    },
    { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
