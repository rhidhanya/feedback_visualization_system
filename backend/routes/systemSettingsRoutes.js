const express = require("express");
const router = express.Router();
const { getSettings, updateSettings } = require("../controllers/systemSettingsController");
const { verifyToken, requireRole } = require("../middleware/auth");

// Public (to students/faculty) to check if feedback is open
router.get("/", verifyToken, getSettings);

// Admin only
router.put("/", verifyToken, requireRole("admin"), updateSettings);

module.exports = router;
