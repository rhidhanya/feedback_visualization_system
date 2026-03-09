const mongoose = require("mongoose");

const ratingsSchema = new mongoose.Schema(
  {
    teachingQuality: {
      type: Number,
      required: [true, "Teaching quality rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    communication: {
      type: Number,
      required: [true, "Communication rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    punctuality: {
      type: Number,
      required: [true, "Punctuality rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    subjectKnowledge: {
      type: Number,
      required: [true, "Subject knowledge rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    doubtClarification: {
      type: Number,
      required: [true, "Doubt clarification rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
  },
  { _id: false } // No separate _id for the embedded subdocument
);

const feedbackSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student ID is required"],
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject ID is required"],
    },
    // Denormalized for fast analytics aggregations (avoids $lookup at query time)
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department ID is required"],
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
    ratings: {
      type: ratingsSchema,
      required: [true, "Ratings are required"],
    },
    // Auto-calculated by backend before save — never set by client
    overallRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comments: {
      type: String,
      trim: true,
      maxlength: [1000, "Comments cannot exceed 1000 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ─── Pre-save hook: auto-calculate overallRating ──────────────────────────
feedbackSchema.pre("save", function () {
  const { teachingQuality, communication, punctuality, subjectKnowledge, doubtClarification } =
    this.ratings;

  const avg =
    (teachingQuality + communication + punctuality + subjectKnowledge + doubtClarification) / 5;

  // Round to 2 decimal places
  this.overallRating = Math.round(avg * 100) / 100;
});

// ─── CRITICAL: Compound unique index ──────────────────────────────────────
// Prevents a student from submitting duplicate feedback for the same
// subject in the same semester
feedbackSchema.index(
  { studentId: 1, subjectId: 1, semester: 1 },
  { unique: true, name: "unique_student_subject_semester" }
);

// ─── Additional indexes for analytics queries ─────────────────────────────
feedbackSchema.index({ departmentId: 1 });
feedbackSchema.index({ semester: 1, academicYear: 1 });
feedbackSchema.index({ overallRating: 1 });
feedbackSchema.index({ subjectId: 1, overallRating: -1 });

module.exports = mongoose.model("Feedback", feedbackSchema);