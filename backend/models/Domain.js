const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
    {
        text: { type: String, required: true, trim: true },
        type: { type: String, enum: ["rating", "text"], default: "rating" },
        required: { type: Boolean, default: true },
    },
    { _id: true }
);

const domainSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Domain name is required"],
            trim: true,
        },
        slug: {
            type: String,
            required: [true, "Domain slug is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: { type: String, trim: true, default: "" },
        icon: { type: String, default: "FiGrid" },
        questions: [questionSchema],
        residenceRestriction: {
            type: String,
            enum: ['hosteller', 'dayscholar', 'none'],
            default: 'none'
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Domain", domainSchema);
