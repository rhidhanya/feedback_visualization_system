const Department = require("../models/Department");
const User = require("../models/User");
const Subject = require("../models/Subject");
const Feedback = require("../models/Feedback");

// ─── Seed default departments if none exist ──────────────────────────────────
exports.seedDepartments = async () => {
    try {
        const count = await Department.countDocuments();
        if (count > 0) return; // Already seeded

        const defaults = [
            { name: "Computer Science", code: "CS", hodName: "", description: "Computer Science & Engineering" },
            { name: "Information Technology", code: "IT", hodName: "", description: "Information Technology" },
            { name: "Electronics", code: "EC", hodName: "", description: "Electronics & Communication Engineering" },
            { name: "Mechanical", code: "ME", hodName: "", description: "Mechanical Engineering" },
            { name: "Civil", code: "CE", hodName: "", description: "Civil Engineering" },
        ];

        await Department.insertMany(defaults);
        console.log("✅ Default departments seeded");
    } catch (err) {
        // Ignore duplicate key errors (already seeded)
        if (err.code !== 11000) {
            console.error("Seed departments error:", err.message);
        }
    }
};

// ─── Seed default admin: ensure admin@bitsathy.in exists for login ───────────
exports.seedAdmin = async () => {
    try {
        const defaultEmail = "admin@bitsathy.in";
        const existing = await User.findOne({ email: defaultEmail });
        if (existing) return;

        await User.create({
            name: "System Admin",
            email: defaultEmail,
            password: "admin123",
            role: "admin",
            isActive: true,
        });
        console.log("✅ Default admin ready: admin@bitsathy.in / admin123");
    } catch (err) {
        if (err.code !== 11000) {
            console.error("Seed admin error:", err.message);
        }
    }
};

// ─── GET /api/admin/stats — Overview counts for admin dashboard ─────────────
exports.getAdminStats = async (req, res) => {
    try {
        const [totalFaculty, totalStudents, totalSubjects, totalFeedback, departments] = await Promise.all([
            User.countDocuments({ role: "faculty" }),
            User.countDocuments({ role: "student" }),
            Subject.countDocuments(),
            Feedback.countDocuments(),
            Department.countDocuments(),
        ]);

        res.json({
            success: true,
            data: { totalFaculty, totalStudents, totalSubjects, totalFeedback, departments }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ── Faculty ──────────────────────────────────────────────────────────────────

// POST /api/admin/faculty
exports.createFaculty = async (req, res) => {
    try {
        const { name, email, password, department, assignedSubjects } = req.body;

        if (!name || !email || !password || !department) {
            return res.status(400).json({ success: false, message: "Name, email, password, and department are required" });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }

        const faculty = await User.create({
            name, email, password, role: "faculty",
            department, assignedSubjects: assignedSubjects || [], isActive: true,
        });

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

        res.status(201).json({ success: true, message: "Faculty created", data: populated });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ success: false, message: "Email already registered" });
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// GET /api/admin/faculty
exports.getFaculty = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = { role: "faculty" };
        if (req.query.department) filter.department = req.query.department;
        if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";
        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: "i" } },
                { email: { $regex: req.query.search, $options: "i" } }
            ];
        }

        const [faculty, total] = await Promise.all([
            User.find(filter)
                .populate("department", "name code")
                .populate("assignedSubjects", "name subjectCode semester")
                .select("-password")
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(filter)
        ]);

        res.json({ 
            success: true, 
            count: faculty.length, 
            total,
            pages: Math.ceil(total / limit),
            currentPage: page,
            data: faculty 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// PUT /api/admin/faculty/:id
exports.updateFaculty = async (req, res) => {
    try {
        const { name, email, department, assignedSubjects, password } = req.body;
        const faculty = await User.findOne({ _id: req.params.id, role: "faculty" });
        if (!faculty) return res.status(404).json({ success: false, message: "Faculty not found" });

        if (name) faculty.name = name;
        if (email) faculty.email = email;
        if (department) faculty.department = department;
        if (assignedSubjects !== undefined) faculty.assignedSubjects = assignedSubjects;
        if (password && password.length >= 6) faculty.password = password;

        await faculty.save();

        if (assignedSubjects !== undefined) {
            await Subject.updateMany({ faculty: faculty._id }, { $set: { faculty: null } });
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

// DELETE /api/admin/faculty/:id
exports.deleteFaculty = async (req, res) => {
    try {
        const faculty = await User.findOne({ _id: req.params.id, role: "faculty" });
        if (!faculty) return res.status(404).json({ success: false, message: "Faculty not found" });

        await Subject.updateMany({ faculty: faculty._id }, { $set: { faculty: null } });
        await faculty.deleteOne();
        res.json({ success: true, message: "Faculty deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ── Subjects ─────────────────────────────────────────────────────────────────

// GET /api/admin/subjects
exports.getSubjects = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.department) filter.department = req.query.department;
        if (req.query.semester) filter.semester = Number(req.query.semester);

        const [subjects, total] = await Promise.all([
            Subject.find(filter)
                .populate("department", "name code")
                .populate("faculty", "name email")
                .sort({ semester: 1, name: 1 })
                .skip(skip)
                .limit(limit),
            Subject.countDocuments(filter)
        ]);

        res.json({ 
            success: true, 
            count: subjects.length, 
            total,
            pages: Math.ceil(total / limit),
            currentPage: page,
            data: subjects 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// POST /api/admin/subjects
exports.createSubject = async (req, res) => {
    try {
        const { name, subjectCode, department, faculty, facultyName, semester, academicYear } = req.body;

        if (!name || !subjectCode || !department || !semester || !academicYear) {
            return res.status(400).json({ success: false, message: "name, subjectCode, department, semester, academicYear are required" });
        }

        let resolvedFacultyName = facultyName || "";
        let resolvedFacultyId = faculty || null;

        if (faculty && !resolvedFacultyName) {
            const fac = await User.findById(faculty).select("name");
            if (fac) resolvedFacultyName = fac.name;
        }

        // facultyName required if no faculty ObjectId given
        if (!resolvedFacultyName) {
            return res.status(400).json({ success: false, message: "Faculty name or faculty ID is required" });
        }

        const subject = await Subject.create({
            name, subjectCode, department,
            faculty: resolvedFacultyId,
            facultyName: resolvedFacultyName,
            semester: Number(semester),
            academicYear,
            isActive: true,
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
        if (err.code === 11000) return res.status(409).json({ success: false, message: "Subject code already exists" });
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// PUT /api/admin/subjects/:id
exports.updateSubject = async (req, res) => {
    try {
        const { name, faculty, facultyName, semester, academicYear, isActive } = req.body;

        let resolvedFacultyName = facultyName;
        if (faculty && !resolvedFacultyName) {
            const fac = await User.findById(faculty).select("name");
            if (fac) resolvedFacultyName = fac.name;
        }

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (faculty !== undefined) updates.faculty = faculty || null;
        if (resolvedFacultyName) updates.facultyName = resolvedFacultyName;
        if (semester !== undefined) updates.semester = Number(semester);
        if (academicYear !== undefined) updates.academicYear = academicYear;
        if (isActive !== undefined) updates.isActive = isActive;

        const subject = await Subject.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
            .populate("department", "name code")
            .populate("faculty", "name email");

        if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });

        if (faculty !== undefined) {
            await User.updateMany({ assignedSubjects: req.params.id }, { $pull: { assignedSubjects: req.params.id } });
            if (faculty) await User.findByIdAndUpdate(faculty, { $addToSet: { assignedSubjects: subject._id } });
        }

        res.json({ success: true, message: "Subject updated", data: subject });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// DELETE /api/admin/subjects/:id
exports.deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findByIdAndDelete(req.params.id);
        if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });
        await User.updateMany({ assignedSubjects: req.params.id }, { $pull: { assignedSubjects: req.params.id } });
        res.json({ success: true, message: "Subject deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ── Students ─────────────────────────────────────────────────────────────────

// GET /api/admin/students
exports.getStudents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = { role: "student" };
        if (req.query.department) filter.department = req.query.department;
        if (req.query.semester) filter.semester = Number(req.query.semester);
        if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";
        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: "i" } },
                { email: { $regex: req.query.search, $options: "i" } },
                { rollNumber: { $regex: req.query.search, $options: "i" } }
            ];
        }

        const [students, total] = await Promise.all([
            User.find(filter)
                .populate("department", "name code")
                .select("-password")
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(filter)
        ]);

        res.json({ 
            success: true, 
            count: students.length, 
            total,
            pages: Math.ceil(total / limit),
            currentPage: page,
            data: students 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// POST /api/admin/students
exports.createStudent = async (req, res) => {
    try {
        const { name, email, password, department, semester, rollNumber } = req.body;
        if (!name || !email || !password || !department || !semester) {
            return res.status(400).json({ success: false, message: "name, email, password, department, semester required" });
        }

        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ success: false, message: "Email already registered" });

        const student = await User.create({
            name, email, password, role: "student",
            department, semester: Number(semester), rollNumber, isActive: true,
        });

        const populated = await User.findById(student._id).populate("department", "name code").select("-password");
        res.status(201).json({ success: true, message: "Student created", data: populated });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ success: false, message: "Email already registered" });
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};
// ─── HODs ────────────────────────────────────────────────────────────────────

// GET /api/admin/hod
exports.getHods = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = { role: "hod" };
        if (req.query.department) filter.department = req.query.department;
        if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";
        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: "i" } },
                { email: { $regex: req.query.search, $options: "i" } },
                { hodId: { $regex: req.query.search, $options: "i" } }
            ];
        }

        const [hods, total] = await Promise.all([
            User.find(filter)
                .populate("department", "name code")
                .select("-password")
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(filter)
        ]);

        res.json({ 
            success: true, 
            count: hods.length, 
            total,
            pages: Math.ceil(total / limit),
            currentPage: page,
            data: hods 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// POST /api/admin/hod
exports.createHod = async (req, res) => {
    try {
        const { name, email, password, department, hodId, contact } = req.body;
        if (!name || !email || !password || !department) {
            return res.status(400).json({ success: false, message: "Name, email, password, and department are required" });
        }

        // Check if department already has an HOD
        const existingHod = await User.findOne({ role: "hod", department });
        if (existingHod) {
            return res.status(400).json({ success: false, message: "This department already has an HOD assigned" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }

        const hod = await User.create({
            name, email, password, role: "hod",
            department, hodId, contact, isActive: true,
        });

        // Update department model with HOD name
        await Department.findByIdAndUpdate(department, { hodName: name });

        const populated = await User.findById(hod._id).populate("department", "name code").select("-password");
        res.status(201).json({ success: true, message: "HOD created", data: populated });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ success: false, message: "HOD ID or Email already exists" });
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// PUT /api/admin/hod/:id
exports.updateHod = async (req, res) => {
    try {
        const { name, email, department, hodId, contact, password, isActive } = req.body;
        const hod = await User.findOne({ _id: req.params.id, role: "hod" });
        if (!hod) return res.status(404).json({ success: false, message: "HOD not found" });

        // If department is changing, check if new dept already has an HOD
        if (department && department !== hod.department.toString()) {
            const existingHod = await User.findOne({ role: "hod", department });
            if (existingHod) {
                return res.status(400).json({ success: false, message: "The target department already has an HOD assigned" });
            }
        }

        if (name) hod.name = name;
        if (email) hod.email = email;
        if (department) hod.department = department;
        if (hodId !== undefined) hod.hodId = hodId;
        if (contact !== undefined) hod.contact = contact;
        if (isActive !== undefined) hod.isActive = isActive;
        if (password && password.length >= 6) hod.password = password;

        await hod.save();

        // Update department model with HOD name
        if (name || department) {
            const currentDeptId = department || hod.department;
            await Department.findByIdAndUpdate(currentDeptId, { hodName: name || hod.name });
        }

        const populated = await User.findById(hod._id).populate("department", "name code").select("-password");
        res.json({ success: true, message: "HOD updated", data: populated });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// DELETE /api/admin/hod/:id
exports.deleteHod = async (req, res) => {
    try {
        const hod = await User.findOne({ _id: req.params.id, role: "hod" });
        if (!hod) return res.status(404).json({ success: false, message: "HOD not found" });

        const deptId = hod.department;
        await hod.deleteOne();

        // Clear HOD name in department
        if (deptId) {
            await Department.findByIdAndUpdate(deptId, { hodName: "" });
        }

        res.json({ success: true, message: "HOD deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};
