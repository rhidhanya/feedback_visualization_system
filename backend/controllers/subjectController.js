const Subject = require("../models/Subject");
const User = require("../models/User");

// ─── GET /api/subjects ─────────────────────────────────────────────────────
exports.getSubjects = async (req, res) => {
    try {
        const filter = {};

        if (req.user.role === "student") {
            const student = await User.findById(req.user.userId);
            if (!student) return res.status(404).json({ success: false, message: "Student not found" });
            filter.department = student.department;
            filter.semester = student.semester;
            filter.isActive = true;
        }

        if (req.user.role === "admin") {
            if (req.query.department) filter.department = req.query.department;
            if (req.query.semester) filter.semester = Number(req.query.semester);
            if (req.query.academicYear) filter.academicYear = req.query.academicYear;
            if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";
        }

        const subjects = await Subject.find(filter)
            .populate("department", "name code")
            .populate("faculty", "name email")
            .sort({ semester: 1, name: 1 });

        res.json({ success: true, count: subjects.length, data: subjects });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── GET /api/subjects/my ─────────────────────────────────────────────────
exports.getMySubjects = async (req, res) => {
    try {
        const student = await User.findById(req.user.userId).populate("department", "name code");
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });

        if (!student.department || !student.semester) {
            return res.json({ success: true, count: 0, data: [] });
        }

        const subjects = await Subject.find({
            department: student.department._id || student.department,
            semester: student.semester,
            isActive: true,
        })
            .populate("department", "name code")
            .populate("faculty", "name email")
            .sort({ name: 1 });

        res.json({ success: true, count: subjects.length, data: subjects });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── GET /api/subjects/:id ─────────────────────────────────────────────────
exports.getSubjectById = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id)
            .populate("department", "name code")
            .populate("faculty", "name email");
        if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });
        res.json({ success: true, data: subject });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── POST /api/subjects (Admin only) ─────────────────────────────────────
exports.createSubject = async (req, res) => {
    try {
        const { name, subjectCode, department, faculty, facultyName, facultyEmail, semester, academicYear } = req.body;

        const required = { name, subjectCode, department, semester, academicYear };
        for (const [key, val] of Object.entries(required)) {
            if (!val) return res.status(400).json({ success: false, message: `${key} is required` });
        }

        let resolvedFacultyName = facultyName;
        if (faculty && !resolvedFacultyName) {
            const facultyUser = await User.findById(faculty).select("name");
            if (facultyUser) resolvedFacultyName = facultyUser.name;
        }
        if (!resolvedFacultyName) {
            return res.status(400).json({ success: false, message: "facultyName is required" });
        }

        const subject = await Subject.create({
            name, subjectCode, department,
            faculty: faculty || null,
            facultyName: resolvedFacultyName,
            facultyEmail: facultyEmail || "",
            semester, academicYear,
        });

        if (faculty) {
            await User.findByIdAndUpdate(faculty, { $addToSet: { assignedSubjects: subject._id } });
        }

        const populated = await subject.populate([
            { path: "department", select: "name code" },
            { path: "faculty", select: "name email" },
        ]);
        res.status(201).json({ success: true, message: "Subject created", data: populated });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: "Subject code already exists" });
        }
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── PUT /api/subjects/:id (Admin only) ──────────────────────────────────
exports.updateSubject = async (req, res) => {
    try {
        const { name, faculty, facultyName, facultyEmail, semester, academicYear, isActive } = req.body;

        let resolvedFacultyName = facultyName;
        if (faculty && !resolvedFacultyName) {
            const facultyUser = await User.findById(faculty).select("name");
            if (facultyUser) resolvedFacultyName = facultyUser.name;
        }

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (facultyEmail !== undefined) updates.facultyEmail = facultyEmail;
        if (semester !== undefined) updates.semester = semester;
        if (academicYear !== undefined) updates.academicYear = academicYear;
        if (isActive !== undefined) updates.isActive = isActive;
        if (faculty !== undefined) updates.faculty = faculty || null;
        if (resolvedFacultyName) updates.facultyName = resolvedFacultyName;

        const subject = await Subject.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
            .populate("department", "name code")
            .populate("faculty", "name email");

        if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });

        if (faculty !== undefined) {
            await User.updateMany({ assignedSubjects: req.params.id }, { $pull: { assignedSubjects: req.params.id } });
            if (faculty) {
                await User.findByIdAndUpdate(faculty, { $addToSet: { assignedSubjects: subject._id } });
            }
        }

        res.json({ success: true, message: "Subject updated", data: subject });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── DELETE /api/subjects/:id (Admin only) ───────────────────────────────
exports.deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findByIdAndDelete(req.params.id);
        if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });

        await User.updateMany(
            { assignedSubjects: req.params.id },
            { $pull: { assignedSubjects: req.params.id } }
        );

        res.json({ success: true, message: "Subject deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};
