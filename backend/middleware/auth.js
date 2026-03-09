const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "changeme_in_production";

// ─── Verify JWT token ──────────────────────────────────────────────────────
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = { ...decoded, id: decoded.userId }; // Ensure both id and userId are available
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Token expired. Please log in again." });
        }
        return res.status(401).json({ success: false, message: "Invalid token." });
    }
};

// ─── Require specific role(s) ──────────────────────────────────────────────
// Usage: requireRole('admin') or requireRole('student', 'admin')
exports.requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(" or ")}`,
            });
        }
        next();
    };
};
