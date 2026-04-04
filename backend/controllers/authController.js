const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "changeme_in_production";
const JWT_EXPIRES_IN = "7d";

// ─── Generate JWT token ────────────────────────────────────────────────────
const signToken = (user) =>
    jwt.sign(
        { userId: user._id, role: user.role, name: user.name, assignedDomain: user.assignedDomain || null },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

// ─── POST /api/auth/register ───────────────────────────────────────────────
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, rollNumber, department, semester, residenceType } = req.body;

        // Only allow student/faculty/admin registration
        if (role && !["student", "faculty", "admin"].includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role" });
        }

        // Students must provide rollNumber, department, semester, and @bitsathy.in email
        const effectiveRole = role || "student";
        if (effectiveRole === "student") {
            if (!rollNumber) return res.status(400).json({ success: false, message: "Roll number is required for students" });
            if (!department) return res.status(400).json({ success: false, message: "Department is required for students" });
            if (!semester) return res.status(400).json({ success: false, message: "Semester is required for students" });
            if (!residenceType) return res.status(400).json({ success: false, message: "Residence type is required for students" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || "student",
            rollNumber,
            department,
            semester,
            residenceType,
        });

        const token = signToken(user);

        res.status(201).json({
            success: true,
            message: "Registration successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                rollNumber: user.rollNumber,
                semester: user.semester,
                residenceType: user.residenceType,
            },
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── POST /api/auth/login ──────────────────────────────────────────────────
exports.login = async (req, res) => {
    try {
        const email = (req.body.email || "").trim().toLowerCase();
        const password = req.body.password;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        // Explicitly select password since it's excluded by default
        const user = await User.findOne({ email }).select("+password").populate("department", "name code");

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: "Account is deactivated. Contact admin." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const token = signToken(user);

        // Emit login event for real-time session notifications
        if (req.io) {
            req.io.emit('session_notification', {
                type: 'login',
                message: `${user.name} (${user.role.toUpperCase()}) logged in`,
                timestamp: new Date()
            });
        }

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                rollNumber: user.rollNumber,
                semester: user.semester,
                residenceType: user.residenceType,
                department: user.department,
                facultyId: user.facultyId,
                hodId: user.hodId,
                assignedDomain: user.assignedDomain,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── POST /api/auth/student-login ────────────────────────────────────────
// Only allows users with role === 'student' to login
exports.studentLogin = async (req, res) => {
    try {
        let { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Username and password are required" });
        }

        email = email.trim().toLowerCase();
        
        // If username without @, append @bitsathy.in for convenience
        if (!email.includes('@')) {
            email += '@bitsathy.in';
        }

        const user = await User.findOne({ email }).select("+password").populate("department", "name code");

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid username or password" });
        }

        if (user.role !== "student") {
            return res.status(403).json({ success: false, message: "This login is for students only. Please use the admin login page." });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: "Account is deactivated. Contact admin." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid username or password" });
        }

        const token = signToken(user);

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                rollNumber: user.rollNumber,
                semester: user.semester,
                residenceType: user.residenceType,
                department: user.department,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── POST /api/auth/faculty-login ────────────────────────────────────────
// Only allows users with role === 'faculty' to login
exports.facultyLogin = async (req, res) => {
    try {
        const email = (req.body.email || "").trim().toLowerCase();
        const { password, facultyId } = req.body;

        const user = await User.findOne({ email }).select("+password").populate("department", "name code");

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        // Check if user is either faculty or domain_head
        if (!["faculty", "domain_head"].includes(user.role)) {
            return res.status(403).json({ success: false, message: "Access denied. This portal is for Faculty and Incharges only." });
        }

        // Validate facultyId if provided
        if (facultyId && user.facultyId !== facultyId) {
            return res.status(401).json({ success: false, message: "Invalid Faculty/Incharge ID" });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: "Account is deactivated. Contact admin." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const token = signToken(user);

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                facultyId: user.facultyId,
                department: user.department,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── POST /api/auth/hod-login ───────────────────────────────────────────
// Only allows users with role === 'hod' to login
exports.hodLogin = async (req, res) => {
    try {
        const email = (req.body.email || "").trim().toLowerCase();
        const { password, hodId } = req.body;

        const user = await User.findOne({ email }).select("+password").populate("department", "name code");

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email" });
        }

        if (user.role !== "hod") {
            return res.status(403).json({ success: false, message: "This login is for HODs only." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid password" });
        }

        // HOD ID Department Mapping logic: CSH01 -> CSE, ITH01 -> IT, EEH01 -> EEE
        // Make sure the user department matches the HOD ID's implied department.
        if (hodId) {
            const prefix = hodId.substring(0, 3).toUpperCase();
            const map = {
                'CSH': 'CSE',
                'ITH': 'IT',
                'EEH': 'EEE',
            };
            const expectedDeptCode = map[prefix] || prefix; 
            
            if (user.department && user.department.code !== expectedDeptCode) {
                 // Try to gracefully fix it if the DB has them mismatched, or fail if strict
                 const Department = require('../models/Department');
                 const correctDept = await Department.findOne({ code: expectedDeptCode });
                 if (correctDept) {
                     user.department = correctDept._id;
                     await user.save();
                     // Re-populate for token
                     await user.populate("department", "name code");
                 }
            }
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: "Account is deactivated. Contact admin." });
        }



        const token = signToken(user);

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                hodId: user.hodId,
                department: user.department, // Contains { _id, name, code }
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── POST /api/auth/login/transport-incharge ─────────────────────────
exports.transportInchargeLogin = async (req, res) => {
    req.body.requiredDomain = "transport";
    return exports.domainHeadLogin(req, res);
};

// ─── POST /api/auth/login/mess-incharge ──────────────────────────────
exports.messInchargeLogin = async (req, res) => {
    req.body.requiredDomain = "mess";
    return exports.domainHeadLogin(req, res);
};

// ─── POST /api/auth/login/sanitation-incharge ────────────────────────
exports.sanitationInchargeLogin = async (req, res) => {
    req.body.requiredDomain = "sanitation";
    return exports.domainHeadLogin(req, res);
};

// ─── POST /api/auth/login/hostel-incharge ────────────────────────────
exports.hostelInchargeLogin = async (req, res) => {
    req.body.requiredDomain = "hostel";
    return exports.domainHeadLogin(req, res);
};

// ─── POST /api/auth/admin-login ───────────────────────────────────────────
// Only allows users with role === 'admin' to login
exports.adminLogin = async (req, res) => {
    try {
        const rawEmail = (req.body.email || "").trim();
        const email = rawEmail.toLowerCase();
        const password = req.body.password;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        if (user.role !== "admin") {
            return res.status(403).json({ success: false, message: "This login is for admins only. Please use the student login page." });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: "Account is deactivated." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const token = signToken(user);

        res.json({
            success: true,
            message: "Admin login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── POST /api/auth/domain-head-login ──────────────────────────────────
exports.domainHeadLogin = async (req, res) => {
    try {
        const email = (req.body.email || "").trim().toLowerCase();
        const password = req.body.password;
        
        const user = await User.findOne({ email }).select("+password");

        if (!user) return res.status(401).json({ success: false, message: "Invalid email or password" });
        if (user.role !== "domain_head") return res.status(403).json({ success: false, message: "This login is for Domain Heads only." });
        if (!user.isActive) return res.status(403).json({ success: false, message: "Account is deactivated." });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ success: false, message: "Invalid email or password" });

        const token = signToken(user);

        // Check for domain constraint if provided (from wrappers)
        if (req.body.requiredDomain && user.assignedDomain && user.assignedDomain.toLowerCase() !== req.body.requiredDomain.toLowerCase()) {
            return res.status(403).json({ 
                success: false, 
                message: `Access denied. This login is for ${req.body.requiredDomain} incharge only.` 
            });
        }

        res.json({
            success: true, message: "Domain Head login successful", token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, assignedDomain: user.assignedDomain },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── POST /api/auth/monitor-login (Dean / Principal) ──────────────────
exports.monitorLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select("+password");

        if (!user) return res.status(401).json({ success: false, message: "Invalid email or password" });
        if (!["dean", "principal"].includes(user.role)) return res.status(403).json({ success: false, message: "This login is for Dean / Principal only." });
        if (!user.isActive) return res.status(403).json({ success: false, message: "Account is deactivated." });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ success: false, message: "Invalid email or password" });

        const token = signToken(user);
        res.json({
            success: true, message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} login successful`, token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── GET /api/auth/me ──────────────────────────────────────────────────────
// ─── POST /api/auth/faculty-hod-login ──────────────────────────────────
// Automatically detects Faculty or HOD based on departmentCode presence
exports.unifiedFacultyHodLogin = async (req, res) => {
    try {
        const email = (req.body.email || "").trim().toLowerCase();
        const { password, departmentCode } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const user = await User.findOne({ email }).select("+password").populate("department", "name code");

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: "Account is deactivated. Contact admin." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            const roleLabel = departmentCode ? "HOD" : "Faculty";
            return res.status(401).json({ success: false, message: `Invalid ${roleLabel} credentials` });
        }

        console.log(`[Login Attempt] Email: ${email}, DeptCodeInput: ${departmentCode}, UserRole: ${user.role}`);

        // AUTO-DETECTION LOGIC
        if (departmentCode && user.role === "hod") {
            // Verify Department ID for HODs only
            const inputUpper = departmentCode.toUpperCase();
            
            // Map structural ID prefixes (e.g. AGH01 -> AGRI)
            const prefix = inputUpper.substring(0, 3);
            const prefixMap = {
                'CSH': 'CSE',
                'ITH': 'IT',
                'MEH': 'MECH',
                'ECH': 'ECE',
                'EEH': 'EEE',
                'BTH': 'BIOTECH',
                'AGH': 'AGRI',
                'CSB': 'CSBS' // Computer Science & Business
            };
            const mappedCode = prefixMap[prefix] || inputUpper;

            const userDeptCode = user.department?.code?.toUpperCase();
            const userDeptName = user.department?.name?.toUpperCase();

            // Lenient check: match by direct input (code/name) OR by mapped code
            const isDeptMatch = (userDeptCode === inputUpper) || (userDeptName === inputUpper) || (userDeptCode === mappedCode);

            if (!isDeptMatch) {
                console.log(`[Login Failed] Dept mismatch for HOD. Expected: ${userDeptCode}/${userDeptName}, Input: ${inputUpper}, Mapped: ${mappedCode}`);
                return res.status(401).json({ success: false, message: "Department ID does not match HOD record" });
            }
        }
 else {
            // Treat as Faculty Login OR fallback HOD Login (or Faculty providing dept code accidentally)
            if (!["faculty", "domain_head", "hod", "dean", "principal"].includes(user.role)) {
                console.log(`[Login Failed] Role not allowed for login. Found: ${user.role}`);
                return res.status(403).json({ success: false, message: "Access denied. Invalid credentials for this portal." });
            }
        }

        const token = signToken(user);

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                facultyId: user.facultyId,
                hodId: user.hodId,
                department: user.department,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate("department", "name code");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};
