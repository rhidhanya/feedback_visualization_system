const router = require("express").Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const { getDomains, getDomainBySlug, updateQuestions } = require("../controllers/domainController");

// Public: list domains
router.get("/", getDomains);
router.get("/:slug", getDomainBySlug);

// Admin: update questions
router.put("/:slug/questions", verifyToken, requireRole("admin"), updateQuestions);

module.exports = router;
