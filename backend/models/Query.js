const mongoose = require("mongoose");

const querySchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        domain: {
            type: String, // 'transport', 'mess', 'hostel', 'sanitation', 'academic'
            required: true,
            lowercase: true,
            trim: true,
        },
        subject: {
            type: String, // title of the query/issue
            required: true,
            trim: true,
        },
        description: {
            type: String, // details
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["Open", "In Progress", "Resolved", "Rectified"],
            default: "Open",
        },
        responses: [
            {
                responder: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                responderRole: String, // 'admin', 'domain_head', 'dean', 'principal'
                message: String,
                createdAt: { type: Date, default: Date.now }
            }
        ]
    },
    { timestamps: true }
);

module.exports = mongoose.model("Query", querySchema);
