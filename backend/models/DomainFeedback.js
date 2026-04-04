const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
    {
        questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
        questionText: { type: String, default: "" },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, trim: true, default: "" },
    },
    { _id: false }
);

const domainFeedbackSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Student ID is required"],
        },
        domainSlug: {
            type: String,
            required: [true, "Domain slug is required"],
            lowercase: true,
            trim: true,
        },
        answers: {
            type: [answerSchema],
            validate: [arr => arr.length > 0, "At least one answer is required"],
        },
        overallRating: {
            type: Number,
            min: 1,
            max: 5,
        },
        generalComment: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },
        semester: {
            type: Number,
            required: true,
            min: 1,
            max: 8,
        },
        academicYear: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: true }
);

// Auto-calculate overallRating from rating answers
domainFeedbackSchema.pre("save", function () {
    const ratingAnswers = this.answers.filter(a => a.rating != null);
    if (ratingAnswers.length > 0) {
        const sum = ratingAnswers.reduce((acc, a) => acc + a.rating, 0);
        this.overallRating = Math.round((sum / ratingAnswers.length) * 100) / 100;
    }
});

// Prevent duplicate: one student per domain per semester
domainFeedbackSchema.index(
    { studentId: 1, domainSlug: 1, semester: 1 },
    { unique: true, name: "unique_student_domain_semester" }
);

domainFeedbackSchema.index({ domainSlug: 1, overallRating: 1, semester: 1 });
domainFeedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model("DomainFeedback", domainFeedbackSchema);
