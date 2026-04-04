const User = require("../models/User");
const Feedback = require("../models/Feedback");
const Subject = require("../models/Subject");
const bcryptjs = require("bcryptjs");

// ─── GET /api/users  (Admin only) ─────────────────────────────────────────
// List all users. Optionally filter by role / department / isActive.
exports.getUsers = async (req, res) => {
    try {
        const filter = {};
        if (req.query.role) filter.role = req.query.role;
        if (req.query.department) filter.department = req.query.department;
        if (req.query.semester) filter.semester = Number(req.query.semester);
        if (req.query.isActive !== undefined && req.query.isActive !== '') filter.isActive = req.query.isActive === "true";

        // Support search by name or email
        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: "i" } },
                { email: { $regex: req.query.search, $options: "i" } },
                { rollNumber: { $regex: req.query.search, $options: "i" } }
            ];
        }

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 50);
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find(filter)
                .populate("department", "name code")
                .populate("assignedSubjects", "name subjectCode semester")
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(filter),
        ]);

        res.json({
            success: true,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: users,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── GET /api/users/:id  (Admin only) ─────────────────────────────────────
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate("department", "name code")
            .populate("assignedSubjects", "name subjectCode semester")
            .select("-password");

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // If student, also return how many subjects they've submitted feedback for
        let feedbackCount = 0;
        if (user.role === "student") {
            feedbackCount = await Feedback.countDocuments({ studentId: user._id });
        }

        res.json({ success: true, data: { ...user.toObject(), feedbackCount } });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── PATCH /api/users/:id/toggle-status  (Admin only) ────────────────────
// Activate or deactivate a student account
exports.toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Prevent admin from deactivating themselves
        if (user._id.toString() === req.user.userId) {
            return res.status(400).json({ success: false, message: "You cannot deactivate your own account" });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({
            success: true,
            message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
            data: { id: user._id, name: user.name, isActive: user.isActive },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── PATCH /api/users/:id/semester  (Admin only) ─────────────────────────
exports.updateSemester = async (req, res) => {
    try {
        const { semester } = req.body;
        const sem = Number(semester);

        if (!semester || isNaN(sem) || sem < 1 || sem > 8) {
            return res.status(400).json({ success: false, message: "Semester must be between 1 and 8" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { semester: sem },
            { new: true, runValidators: true }
        ).select("-password").populate("department", "name code");

        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        if (user.role !== "student") return res.status(400).json({ success: false, message: "Only students have semesters" });

        res.json({ success: true, message: "Semester updated", data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── POST /api/users/faculty  (Admin only) ────────────────────────────────
// Admin creates a faculty account directly — faculty can login immediately
exports.createFaculty = async (req, res) => {
    try {
        const { name, email, password, department, assignedSubjects, facultyId } = req.body;

        if (!name || !email || !password || !department) {
            return res.status(400).json({
                success: false,
                message: "Name, email, password, and department are required",
            });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }

        // Create the faculty user — password will be hashed by pre-save hook
        const faculty = await User.create({
            name,
            email,
            password,
            role: "faculty",
            department,
            assignedSubjects: assignedSubjects || [],
            facultyId,
        });

        // If subjects assigned, sync facultyName on those subjects
        if (assignedSubjects && assignedSubjects.length > 0) {
            await Subject.updateMany(
                { _id: { $in: assignedSubjects } },
                { $set: { faculty: faculty._id, facultyName: name } }
            );
        }

        const populated = await User.findById(faculty._id)
            .populate("department", "name code")
            .populate("assignedSubjects", "name subjectCode semester")
            .select("-password");

        res.status(201).json({
            success: true,
            message: "Faculty account created successfully",
            data: populated,
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── POST /api/users/domain-head  (Admin only) ─────────────────────────
// Admin creates a domain head account directly
exports.createDomainHead = async (req, res) => {
    try {
        const { name, email, password, assignedDomain, department, contact } = req.body;

        if (!name || !email || !password || !assignedDomain) {
            return res.status(400).json({
                success: false,
                message: "Name, email, password, and assigned field are required",
            });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }

        // Create the domain head user
        const domainHead = await User.create({
            name,
            email,
            password,
            role: "domain_head",
            assignedDomain,
            department,
            contact,
        });

        res.status(201).json({
            success: true,
            message: "Domain head account created successfully",
            data: {
                id: domainHead._id,
                name: domainHead.name,
                email: domainHead.email,
                role: domainHead.role,
                assignedDomain: domainHead.assignedDomain
            },
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── GET /api/users/faculty  (Admin only) ─────────────────────────────────
exports.getFaculty = async (req, res) => {
    try {
        const faculty = await User.find({ role: "faculty" })
            .populate("department", "name code")
            .populate("assignedSubjects", "name subjectCode semester")
            .select("-password")
            .sort({ name: 1 });

        res.json({ success: true, count: faculty.length, data: faculty });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── PUT /api/users/faculty/:id  (Admin only) ─────────────────────────────
exports.updateFaculty = async (req, res) => {
    try {
        const { name, email, department, assignedSubjects, password, facultyId } = req.body;

        const faculty = await User.findOne({ _id: req.params.id, role: "faculty" });
        if (!faculty) return res.status(404).json({ success: false, message: "Faculty not found" });

        if (name) faculty.name = name;
        if (email) faculty.email = email;
        if (department) faculty.department = department;
        if (assignedSubjects !== undefined) faculty.assignedSubjects = assignedSubjects;
        if (password) faculty.password = password; // will be re-hashed by pre-save hook
        if (facultyId !== undefined) faculty.facultyId = facultyId;

        await faculty.save();

        // Update facultyName on previously-assigned subjects and newly-assigned subjects
        if (assignedSubjects !== undefined) {
            // Remove this faculty from all subjects (then re-assign below)
            await Subject.updateMany(
                { faculty: faculty._id },
                { $set: { faculty: null } }
            );
            if (assignedSubjects.length > 0) {
                await Subject.updateMany(
                    { _id: { $in: assignedSubjects } },
                    { $set: { faculty: faculty._id, facultyName: faculty.name } }
                );
            }
        }

        const populated = await User.findById(faculty._id)
            .populate("department", "name code")
            .populate("assignedSubjects", "name subjectCode semester")
            .select("-password");

        res.json({ success: true, message: "Faculty updated", data: populated });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── DELETE /api/users/faculty/:id  (Admin only) ──────────────────────────
exports.deleteFaculty = async (req, res) => {
    try {
        const faculty = await User.findOne({ _id: req.params.id, role: "faculty" });
        if (!faculty) return res.status(404).json({ success: false, message: "Faculty not found" });

        // Clear faculty link from subjects
        await Subject.updateMany(
            { faculty: faculty._id },
            { $set: { faculty: null } }
        );

        await faculty.deleteOne();
        res.json({ success: true, message: "Faculty deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── PUT /api/users/:id  (Admin only) ─────────────────────────────────────
exports.updateUser = async (req, res) => {
    try {
        const { name, email, department, semester, rollNumber, isActive, assignedDomain, contact, year, section } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (email !== undefined) updates.email = email;
        if (department !== undefined) updates.department = department;
        if (semester !== undefined) updates.semester = Number(semester);
        if (rollNumber !== undefined) updates.rollNumber = rollNumber;
        if (isActive !== undefined) updates.isActive = isActive;
        if (assignedDomain !== undefined) updates.assignedDomain = assignedDomain;
        if (contact !== undefined) updates.contact = contact;
        if (year !== undefined) updates.year = year;
        if (section !== undefined) updates.section = section;

        const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
            .populate("department", "name code")
            .select("-password");

        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, message: "User updated", data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── DELETE /api/users/:id  (Admin only) ──────────────────────────────────
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        if (user._id.toString() === req.user.userId) {
            return res.status(400).json({ success: false, message: "Cannot delete your own account" });
        }
        await user.deleteOne();
        res.json({ success: true, message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── POST /api/users/student  (Admin only) ────────────────────────────────────
// Admin creates a student account — bypasses the @bitsathy.in email restriction
exports.createStudent = async (req, res) => {
    try {
        const { name, email, password, department, rollNumber, semester, residenceType, year, section } = req.body;

        if (!name || !email || !password || !department || !rollNumber) {
            return res.status(400).json({
                success: false,
                message: "Name, email, password, department, and roll number are required",
            });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }

        const student = await User.create({
            name,
            email,
            password,
            role: "student",
            department,
            rollNumber,
            semester,
            residenceType,
            year,
            section,
        });

        const populated = await User.findById(student._id)
            .populate("department", "name code")
            .select("-password");

        res.status(201).json({
            success: true,
            message: "Student account created successfully",
            data: populated,
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: "Email or Roll Number already registered" });
        }
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};
// ─── GET /api/users/recipients  (Admin/Principal/HOD) ─────────────────────────
exports.getRecipients = async (req, res) => {
    try {
        const role = (req.user.role || "").toLowerCase();
        let filter = { isActive: true };

        if (role === 'admin' || role === 'principal') {
            filter.role = { $in: ["hod", "domain_head", "principal", "faculty"] };
        } else if (role === 'faculty') {
            filter.role = { $in: ["hod", "principal"] };
        } else if (role === 'hod') {
            // HOD can message faculty in their department — look up from DB since JWT has no department
            const hodUser = await User.findById(req.user.userId || req.user.id).select("department");
            filter.role = "faculty";
            if (hodUser?.department) {
                filter.department = hodUser.department;
            }
        } else {
            return res.status(403).json({ success: false, message: "Unauthorized to fetch recipients" });
        }

        const recipients = await User.find(filter)
            .select("name email role assignedDomain department")
            .populate("department", "name code")
            .sort({ role: 1, name: 1 });

        res.json({ success: true, count: recipients.length, data: recipients });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};
