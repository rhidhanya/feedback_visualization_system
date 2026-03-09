/**
 * Input Validation Middleware
 *
 * Lightweight, zero-dependency validators.
 * Each function is an express middleware that returns 400 on bad input.
 */

// ─── Helpers ──────────────────────────────────────────────────────────────
const fail = (res, msg) => res.status(400).json({ success: false, message: msg });

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

// ─── Auth Validators ──────────────────────────────────────────────────────

exports.validateRegister = (req, res, next) => {
    const { name, email, password, role, rollNumber, department, semester } = req.body;

    if (!name || name.trim().length < 2)
        return fail(res, "Name must be at least 2 characters");

    if (!email || !isValidEmail(email))
        return fail(res, "A valid email is required");

    if (!password || password.length < 6)
        return fail(res, "Password must be at least 6 characters");

    if (role && !["student", "faculty", "admin"].includes(role))
        return fail(res, "Role must be 'student', 'faculty', or 'admin'");

    // Students need roll number, department, semester, and @bitsathy.in email
    const effectiveRole = role || "student";
    if (effectiveRole === "student") {
        if (!email.toLowerCase().endsWith("@bitsathy.in"))
            return fail(res, "Student email must end with @bitsathy.in");
        if (!rollNumber || rollNumber.trim().length < 2)
            return fail(res, "Roll number is required for students");
        if (!department)
            return fail(res, "Department ID is required for students");
        const sem = Number(semester);
        if (!semester || isNaN(sem) || sem < 1 || sem > 8)
            return fail(res, "Semester must be a number between 1 and 8");
    }

    next();
};

exports.validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !isValidEmail(email))
        return fail(res, "A valid email is required");

    if (!password || password.length < 1)
        return fail(res, "Password is required");

    next();
};

// Student-specific login validation (allow username without @; controller appends @bitsathy.in)
exports.validateStudentLogin = (req, res, next) => {
    const { email, password } = req.body;
    const trimmed = (email && typeof email === 'string') ? email.trim() : '';

    if (!trimmed || trimmed.length < 1)
        return fail(res, "Username or email is required");

    // If it looks like an email, it must be valid format; otherwise allow plain username
    if (trimmed.includes('@') && !isValidEmail(trimmed))
        return fail(res, "A valid email is required");

    if (!password || password.length < 1)
        return fail(res, "Password is required");

    next();
};

// Faculty-specific login validation — no domain restriction (admin creates accounts)
exports.validateFacultyLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !isValidEmail(email))
        return fail(res, "A valid email is required");

    if (!password || password.length < 1)
        return fail(res, "Password is required");

    next();
};

// Admin-specific login validation — no domain restriction
exports.validateAdminLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !isValidEmail(email))
        return fail(res, "A valid email is required");

    if (!password || password.length < 1)
        return fail(res, "Password is required");

    next();
};

// ─── Subject Validators ───────────────────────────────────────────────────

exports.validateCreateSubject = (req, res, next) => {
    const { name, subjectCode, department, semester, academicYear } = req.body;

    if (!name || name.trim().length < 2)
        return fail(res, "Subject name must be at least 2 characters");

    if (!subjectCode || subjectCode.trim().length < 2)
        return fail(res, "Subject code is required");

    if (!department)
        return fail(res, "Department ID is required");

    const sem = Number(semester);
    if (!semester || isNaN(sem) || sem < 1 || sem > 8)
        return fail(res, "Semester must be a number between 1 and 8");

    if (!academicYear || !/^\d{4}-\d{2}$/.test(academicYear))
        return fail(res, "Academic year must be in format YYYY-YY (e.g. 2024-25)");

    next();
};

// ─── Feedback Validators ──────────────────────────────────────────────────

exports.validateSubmitFeedback = (req, res, next) => {
    const { subjectId, ratings } = req.body;

    if (!subjectId)
        return fail(res, "Subject ID is required");

    if (!ratings || typeof ratings !== "object")
        return fail(res, "Ratings object is required");

    const fields = ["teachingQuality", "communication", "punctuality", "subjectKnowledge", "doubtClarification"];
    for (const field of fields) {
        const val = Number(ratings[field]);
        if (isNaN(val) || val < 1 || val > 5)
            return fail(res, `${field} must be a number between 1 and 5`);
    }

    next();
};

// ─── Department Validators ────────────────────────────────────────────────

exports.validateCreateDepartment = (req, res, next) => {
    const { name, code } = req.body;

    if (!name || name.trim().length < 2)
        return fail(res, "Department name must be at least 2 characters");

    if (!code || code.trim().length < 1)
        return fail(res, "Department code is required");

    if (code.trim().length > 10)
        return fail(res, "Department code cannot exceed 10 characters");

    next();
};
