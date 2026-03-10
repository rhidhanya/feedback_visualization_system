const router = require("express").Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const { sendMessage, getMessages, markAsRead } = require("../controllers/messageController");

router.post("/", verifyToken, requireRole("admin", "domain_head", "dean", "principal", "faculty", "hod"), sendMessage);
router.post("/send", verifyToken, requireRole("admin", "domain_head", "dean", "principal", "faculty", "hod"), sendMessage);
router.get("/", verifyToken, requireRole("admin", "domain_head", "dean", "principal", "faculty", "hod"), getMessages);
router.get("/inbox", verifyToken, requireRole("admin", "domain_head", "dean", "principal", "faculty", "hod"), getMessages);
router.get("/unread/count", verifyToken, requireRole("admin", "domain_head", "dean", "principal", "faculty", "hod"), require("../controllers/messageController").getUnreadCount);
router.put("/:id/read", verifyToken, requireRole("admin", "domain_head", "dean", "principal", "faculty", "hod"), markAsRead);

module.exports = router;
