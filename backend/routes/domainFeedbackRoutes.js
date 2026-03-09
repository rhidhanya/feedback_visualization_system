const router = require("express").Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const {
    submitDomainFeedback,
    getMyDomainFeedback,
    getDomainFeedbackList,
    getDomainAnalytics,
    getAllDomainAnalytics,
} = require("../controllers/domainFeedbackController");

// Student: submit + view own
router.post("/", verifyToken, requireRole("student"), submitDomainFeedback);
router.get("/my", verifyToken, requireRole("student"), getMyDomainFeedback);

// Analytics (admin, domain_head, dean, principal)
router.get("/analytics-all", verifyToken, requireRole("admin", "dean", "principal"), getAllDomainAnalytics);
router.get("/analytics/:slug", verifyToken, requireRole("admin", "domain_head", "dean", "principal"), getDomainAnalytics);

// List (admin, domain_head, dean, principal)
router.get("/", verifyToken, requireRole("admin", "domain_head", "dean", "principal"), getDomainFeedbackList);

module.exports = router;
