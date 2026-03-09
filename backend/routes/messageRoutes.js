const router = require("express").Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const { sendMessage, getMessages, markAsRead } = require("../controllers/messageController");

router.post("/", verifyToken, requireRole("admin", "domain_head", "dean", "principal", "faculty"), sendMessage);
router.get("/", verifyToken, requireRole("admin", "domain_head", "dean", "principal", "faculty"), getMessages);
router.put("/:id/read", verifyToken, requireRole("admin", "domain_head", "dean", "principal", "faculty"), markAsRead);

module.exports = router;
