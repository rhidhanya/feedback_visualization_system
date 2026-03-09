const express = require("express");
const router = express.Router();
const {
    getSubjects,
    getMySubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject,
} = require("../controllers/subjectController");
const { verifyToken, requireRole } = require("../middleware/auth");
const { validateCreateSubject } = require("../middleware/validate");

// All routes require authentication
router.use(verifyToken);

// GET /api/subjects/my          — Student: their dept+semester subjects
router.get("/my", requireRole("student"), getMySubjects);

// GET /api/subjects             — Auth: students get filtered, admin gets all
// GET /api/subjects/:id         — Any authenticated user
router.get("/", getSubjects);
router.get("/:id", getSubjectById);

// POST /api/subjects            — Admin only
// PUT  /api/subjects/:id        — Admin only
// DELETE /api/subjects/:id      — Admin only
router.post("/", requireRole("admin"), validateCreateSubject, createSubject);
router.put("/:id", requireRole("admin"), updateSubject);
router.delete("/:id", requireRole("admin"), deleteSubject);

module.exports = router;

