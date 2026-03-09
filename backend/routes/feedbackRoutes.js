const express = require("express");
const router = express.Router();
const {
  submitFeedback,
  getMyFeedback,
  getSubmittedSubjectIds,
  getAllFeedback,
  updateFeedback,
  deleteFeedback,
} = require("../controllers/feedbackController");
const { verifyToken, requireRole } = require("../middleware/auth");
const { validateSubmitFeedback } = require("../middleware/validate");

// All routes require authentication
router.use(verifyToken);

// ── Student routes ──────────────────────────────────────────────────────────
// POST   /api/feedback                    — Submit feedback (deduplicated)
// PUT    /api/feedback/:id                — Edit feedback
// GET    /api/feedback/my                 — Student's own submission history
// GET    /api/feedback/submitted-subjects — IDs of subjects already rated
router.post("/", requireRole("student"), validateSubmitFeedback, submitFeedback);
router.put("/:id", requireRole("student"), validateSubmitFeedback, updateFeedback);
router.get("/my", requireRole("student"), getMyFeedback);
router.get("/submitted-subjects", requireRole("student"), getSubmittedSubjectIds);

// ── Admin routes ────────────────────────────────────────────────────────────
// GET    /api/feedback           — Paginated all feedback (filterable)
// DELETE /api/feedback/:id       — Delete a feedback record
router.get("/", requireRole("admin"), getAllFeedback);
router.delete("/:id", requireRole("admin"), deleteFeedback);

module.exports = router;
