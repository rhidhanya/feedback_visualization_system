const jwt = require("jsonwebtoken");

const roleAuth = (roles) => {
    return (req, res, next) => {
        // verifyToken middleware should already have set req.userId and req.userRole
        // If not, we might need to verify token here or rely on previous middleware
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied: Unauthorized role" });
        }
        next();
    };
};

module.exports = roleAuth;
