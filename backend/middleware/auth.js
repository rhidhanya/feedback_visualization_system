const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "changeme_in_production";

// ─── Verify JWT token ──────────────────────────────────────────────────────
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log(`[Auth] No token provided for ${req.originalUrl}`);
        return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = { ...decoded, id: decoded.userId }; // Ensure both id and userId are available
        next();
    } catch (err) {
        console.log(`[Auth] Token verification failed for ${req.originalUrl}: ${err.message}`);
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Token expired. Please log in again." });
        }
        return res.status(401).json({ success: false, message: "Invalid token." });
    }
};

// ─── Require specific role(s) ──────────────────────────────────────────────
// Usage: requireRole('admin') or requireRole('student', 'admin') or requireRole(['admin', 'student'])
exports.requireRole = (...roles) => {
    // Flatten in case an array is passed: requireRole(["admin", "hod"]) -> roles = [["admin","hod"]]
    const flatRoles = roles.flat();
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        // Normalize both sides to lowercase for comparison
        const userRole = (req.user.role || "").toLowerCase();
        const normalizedRoles = flatRoles.map(r => (r || "").toLowerCase());
        if (!normalizedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${flatRoles.join(" or ")}`,
            });
        }
        next();
    };
};
