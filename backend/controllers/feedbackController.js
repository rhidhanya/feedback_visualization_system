const Feedback = require("../models/Feedback");
const Subject = require("../models/Subject");
const User = require("../models/User");

// ─── POST /api/feedback ───────────────────────────────────────────────────
// Students submit feedback for a subject
exports.submitFeedback = async (req, res) => {
    try {
        const studentId = req.user.userId;
        const { subjectId, ratings, comments } = req.body;

        // Fetch the subject to get departmentId and semester/academicYear
        const subject = await Subject.findById(subjectId);
        if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });
        if (!subject.isActive) return res.status(400).json({ success: false, message: "Feedback is not open for this subject" });

        // Verify student belongs to the same department AND semester as the subject
        const student = await User.findById(studentId);
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });

        if (!student.department || !subject.department || student.department.toString() !== subject.department.toString()) {
            return res.status(403).json({
                success: false,
                message: "You cannot submit feedback for subjects outside your department",
            });
        }

        if (!student.semester || !subject.semester || student.semester !== subject.semester) {
            return res.status(403).json({
                success: false,
                message: "You can only submit feedback for your current semester subjects",
            });
        }

        // Create feedback — overallRating is auto-calculated in pre-save hook
        const feedback = await Feedback.create({
            studentId,
            subjectId,
            departmentId: subject.department,
            semester: subject.semester,
            academicYear: subject.academicYear,
            ratings,
            comments: comments || "",
        });

        // Emit socket event so admin dashboard updates in real-time
        if (req.io) {
            req.io.emit("feedbackUpdated", {
                subjectId,
                departmentId: subject.department,
                semester: subject.semester,
            });
            // Real-time session notification
            req.io.emit('session_notification', {
                type: 'feedback',
                message: `New feedback submitted for ${subject.subjectCode}`,
                timestamp: new Date()
            });
        }

        res.status(201).json({
            success: true,
            message: "Feedback submitted successfully",
            data: {
                id: feedback._id,
                overallRating: feedback.overallRating,
                ratings: feedback.ratings,
                createdAt: feedback.createdAt,
            },
        });
    } catch (err) {
        // Handle duplicate submission (compound unique index violation)
        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You have already submitted feedback for this subject this semester",
            });
        }
        console.error(err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── PUT /api/feedback/:id ────────────────────────────────────────────────
// Students can update their own feedback before the deadline
exports.updateFeedback = async (req, res) => {
    try {
        const studentId = req.user.userId;
        const { ratings, comments } = req.body;

        const feedback = await Feedback.findById(req.params.id).populate("subjectId");
        if (!feedback) {
            return res.status(404).json({ success: false, message: "Feedback not found" });
        }

        // Must own the feedback
        if (feedback.studentId.toString() !== studentId) {
            return res.status(403).json({ success: false, message: "Unauthorized to edit this feedback" });
        }

        // Make sure subject is active (deadline checking is usually handled at the SystemSettings/Subject level)
        if (!feedback.subjectId.isActive) {
            return res.status(400).json({ success: false, message: "Feedback editing is closed for this subject" });
        }

        // Update fields
        if (ratings) feedback.ratings = ratings;
        if (comments !== undefined) feedback.comments = comments;

        // Save will trigger the pre-save hook to recalculate overallRating
        await feedback.save();

        if (req.io) {
            req.io.emit("feedbackUpdated", {
                subjectId: feedback.subjectId._id,
                departmentId: feedback.departmentId,
                semester: feedback.semester,
            });
        }

        res.json({
            success: true,
            message: "Feedback updated successfully",
            data: {
                id: feedback._id,
                overallRating: feedback.overallRating,
                ratings: feedback.ratings,
                updatedAt: feedback.updatedAt,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── GET /api/feedback/my ─────────────────────────────────────────────────
// Student views their own submission history
exports.getMyFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.find({ studentId: req.user.userId })
            .populate("subjectId", "name subjectCode facultyName semester")
            .populate("departmentId", "name code")
            .sort({ createdAt: -1 });

        res.json({ success: true, count: feedback.length, data: feedback });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── GET /api/feedback/submitted-subjects ─────────────────────────────────
// Returns subject IDs the student has already submitted for — used by UI
// to disable the "Submit" button on subjects already rated
exports.getSubmittedSubjectIds = async (req, res) => {
    try {
        const docs = await Feedback.find(
            { studentId: req.user.userId },
            { subjectId: 1, _id: 0 }
        );
        const subjectIds = docs.map((d) => d.subjectId.toString());
        res.json({ success: true, data: subjectIds });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── GET /api/feedback (Admin) ────────────────────────────────────────────
// Paginated list of all feedback for admin review, with optional filters
exports.getAllFeedback = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 20);
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.department) filter.departmentId = req.query.department;
        if (req.query.semester) filter.semester = Number(req.query.semester);
        if (req.query.academicYear) filter.academicYear = req.query.academicYear;
        if (req.query.subject) filter.subjectId = req.query.subject;

        const [data, total] = await Promise.all([
            Feedback.find(filter)
                .populate("studentId", "name rollNumber")
                .populate("subjectId", "name subjectCode facultyName")
                .populate("departmentId", "name code")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Feedback.countDocuments(filter),
        ]);

        res.json({
            success: true,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── DELETE /api/feedback/:id (Admin only) ────────────────────────────────
// Admin can delete a feedback record (e.g., for corrections)
exports.deleteFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findByIdAndDelete(req.params.id);
        if (!feedback) {
            return res.status(404).json({ success: false, message: "Feedback not found" });
        }
        res.json({
            success: true,
            message: "Feedback deleted successfully",
            data: { id: feedback._id },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};
