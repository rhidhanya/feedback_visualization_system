const express = require("express");
const router = express.Router();
const { 
    sendMessage, 
    getInbox, 
    getSentMessages, 
    getMessage, 
    getRecipients,
    getUnreadCount
} = require("../controllers/messageController");
const { verifyToken } = require("../middleware/auth");

// All routes are protected
router.use(verifyToken);

router.post("/", sendMessage);
router.get("/", getInbox);
router.get("/sent", getSentMessages);
router.get("/unread", getUnreadCount);
router.get("/recipients", getRecipients);
router.get("/:id", getMessage);

module.exports = router;
