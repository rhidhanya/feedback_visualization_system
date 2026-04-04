const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: ["student", "faculty", "admin", "domain_head", "dean", "principal", "hod"],
      default: "student",
    },
    // Domain heads only — which domain they manage
    assignedDomain: {
      type: String,
      trim: true,
      lowercase: true,
      // e.g. "transport", "mess", "hostel", "sanitation"
    },
    // Common contact field (e.g. for Incharge)
    contact: {
      type: String,
      trim: true,
      sparse: true,
    },
    // Faculty-specific fields
    facultyId: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    hodId: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    assignedSubjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    }],
    // Student-specific fields
    rollNumber: {
      type: String,
      trim: true,
      sparse: true, // Allows null for admin but unique for students
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      // Required for students, optional for admin
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
      // Only relevant for students
    },
    year: {
      type: String,
      trim: true,
    },
    section: {
      type: String,
      trim: true,
    },
    residenceType: {
      type: String,
      enum: ['hosteller', 'dayscholar'],
      // Only relevant for students
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ─── Pre-save hook: hash password before saving ───────────────────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcryptjs.genSalt(12);
  this.password = await bcryptjs.hash(this.password, salt);
});

// ─── Instance method: compare plain password with hashed ─────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcryptjs.compare(candidatePassword, this.password);
};

// ─── Indexes ──────────────────────────────────────────────────────────────
userSchema.index({ role: 1, department: 1, isActive: 1 });
userSchema.index({ semester: 1 });
userSchema.index({ name: 'text', email: 'text', rollNumber: 'text' }); // Full-text search for management pages
// Note: rollNumber index is defined via sparse:true in the schema field above

module.exports = mongoose.model("User", userSchema);
