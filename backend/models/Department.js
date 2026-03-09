const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Department name is required"],
            trim: true,
            unique: true,
        },
        code: {
            type: String,
            required: [true, "Department code is required"],
            uppercase: true,
            trim: true,
            unique: true,
            maxlength: [10, "Code cannot exceed 10 characters"],
        },
        hodName: {
            type: String,
            trim: true,
            default: "",
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        cluster: {
            type: String,
            trim: true,
            default: "",
            // e.g. "CS Cluster" or "Core Cluster"
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Department", departmentSchema);
