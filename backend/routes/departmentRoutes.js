const express = require("express");
const router = express.Router();
const {
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
} = require("../controllers/departmentController");
const { verifyToken, requireRole } = require("../middleware/auth");
const { validateCreateDepartment } = require("../middleware/validate");

// GET /api/departments       — Public (needed for student registration form)
// GET /api/departments/:id   — Public
router.get("/", getDepartments);
router.get("/:id", getDepartmentById);

// POST /api/departments      — Admin only
// PUT  /api/departments/:id  — Admin only
router.post("/", verifyToken, requireRole("admin"), validateCreateDepartment, createDepartment);
router.put("/:id", verifyToken, requireRole("admin"), updateDepartment);

module.exports = router;
