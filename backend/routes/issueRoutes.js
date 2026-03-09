const router = require("express").Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const { getIssues, updateIssueStatus, getIssueSummary } = require("../controllers/issueController");

// Summary (admin, dean, principal)
router.get("/summary", verifyToken, requireRole("admin", "dean", "principal"), getIssueSummary);

// List (admin, domain_head, dean, principal)
router.get("/", verifyToken, requireRole("admin", "domain_head", "dean", "principal"), getIssues);

// Update status (admin, domain_head)
router.put("/:id/status", verifyToken, requireRole("admin", "domain_head"), updateIssueStatus);

module.exports = router;
