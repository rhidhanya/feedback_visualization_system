const router = require("express").Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const {
    createNotification,
    getMyNotifications,
    getAllNotifications,
    markRead,
} = require("../controllers/notificationController");

// Admin: create + view all
router.post("/", verifyToken, requireRole("admin"), createNotification);
router.get("/", verifyToken, requireRole("admin", "dean", "principal"), getAllNotifications);

// Domain head: own notifications
router.get("/my", verifyToken, requireRole("domain_head"), getMyNotifications);
router.put("/:id/read", verifyToken, requireRole("domain_head"), markRead);

module.exports = router;
