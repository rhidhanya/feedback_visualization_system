const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Subject name is required"],
            trim: true,
        },
        subjectCode: {
            type: String,
            required: [true, "Subject code is required"],
            uppercase: true,
            trim: true,
            unique: true,
        },
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            required: [true, "Department is required"],
        },
        // Faculty link — references the faculty User account
        faculty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        // Faculty details — kept as plain fields for quick lookups
        facultyName: {
            type: String,
            required: [true, "Faculty name is required"],
            trim: true,
        },
        facultyEmail: {
            type: String,
            lowercase: true,
            trim: true,
            default: "",
        },
        semester: {
            type: Number,
            required: [true, "Semester is required"],
            min: 1,
            max: 8,
        },
        academicYear: {
            type: String,
            required: [true, "Academic year is required"],
            trim: true,
            // Format: "2024-25"
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

// ─── Indexes ──────────────────────────────────────────────────────────────
subjectSchema.index({ department: 1, semester: 1 });
subjectSchema.index({ academicYear: 1 });
subjectSchema.index({ facultyName: 1 });

module.exports = mongoose.model("Subject", subjectSchema);
