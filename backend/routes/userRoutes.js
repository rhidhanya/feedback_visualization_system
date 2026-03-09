const express = require("express");
const router = express.Router();
const {
    getUsers,
    getUserById,
    toggleUserStatus,
    updateSemester,
    createFaculty,
    getFaculty,
    updateFaculty,
    deleteFaculty,
    updateUser,
    deleteUser,
    createDomainHead,
    createStudent,
    getRecipients,
} = require("../controllers/userController");
const { verifyToken, requireRole } = require("../middleware/auth");

// ── Recipients list for messaging — Admin & Principal & HOD ───────────────
router.get("/recipients", verifyToken, requireRole(["admin", "principal", "hod"]), getRecipients);

// All user management routes — Admin only
router.use(verifyToken, requireRole("admin"));

// ── Faculty management routes ──────────────────────────────────────────────
router.post("/faculty", createFaculty);
router.get("/faculty", getFaculty);
router.put("/faculty/:id", updateFaculty);
router.delete("/faculty/:id", deleteFaculty);

// ── General user routes ────────────────────────────────────────────────────
router.post("/domain-head", createDomainHead);
router.post("/student", createStudent);

router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.patch("/:id/toggle-status", toggleUserStatus);
router.patch("/:id/semester", updateSemester);

module.exports = router;
