const express = require("express");
const router = express.Router();
const {
    getAdminStats,
    createFaculty, getFaculty, updateFaculty, deleteFaculty,
    createSubject, getSubjects, updateSubject, deleteSubject,
    createStudent, getStudents,
    createHod, getHods, updateHod, deleteHod,
} = require("../controllers/adminController");
const { verifyToken, requireRole } = require("../middleware/auth");

// All admin routes require token + admin role
router.use(verifyToken, requireRole("admin"));

// Stats
router.get("/stats", getAdminStats);

// Faculty
router.post("/faculty", createFaculty);
router.get("/faculty", getFaculty);
router.put("/faculty/:id", updateFaculty);
router.delete("/faculty/:id", deleteFaculty);

// Subjects
router.post("/subjects", createSubject);
router.get("/subjects", getSubjects);
router.put("/subjects/:id", updateSubject);
router.delete("/subjects/:id", deleteSubject);

// Students
router.post("/students", createStudent);
router.get("/students", getStudents);

// HODs
router.post("/hod", createHod);
router.get("/hod", getHods);
router.put("/hod/:id", updateHod);
router.delete("/hod/:id", deleteHod);

module.exports = router;
