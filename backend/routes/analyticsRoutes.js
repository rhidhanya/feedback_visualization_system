const express = require("express");
const router = express.Router();
const {
    getSummary,
    getByFaculty,
    getBySubject,
    getRatingDistribution,
    getSemesterTrend,
    getByDepartment,
    getByCluster,
    getParameterAverages,
    getSemesterHeatmap,
    getLowPerformers,
    getAllFacultySummary,
    getFacultyDetail,
    getHodAnalytics,
    generateReport,
} = require("../controllers/analyticsController");
const { verifyToken, requireRole } = require("../middleware/auth");

const monitorRoles = requireRole("admin", "dean", "principal");
const allRoles = requireRole("admin", "faculty", "dean", "principal");

router.use(verifyToken);

router.get("/summary", monitorRoles, getSummary);
router.get("/by-faculty", monitorRoles, getByFaculty);
router.get("/by-subject", monitorRoles, getBySubject);
router.get("/distribution", monitorRoles, getRatingDistribution);
router.get("/trend", monitorRoles, getSemesterTrend);
router.get("/by-department", monitorRoles, getByDepartment);
router.get("/by-cluster", monitorRoles, getByCluster);
router.get("/parameters", monitorRoles, getParameterAverages);
router.get("/semester-heatmap", monitorRoles, getSemesterHeatmap);
router.get("/faculty-list", monitorRoles, getAllFacultySummary);
router.get("/low-performers", monitorRoles, getLowPerformers);   // kept for API compat
router.get("/report", monitorRoles, generateReport);

// Faculty is allowed here, controller filters by req.user.id for faculty
router.get("/faculty-detail", allRoles, getFacultyDetail);

// HOD specialized stats
router.get("/hod-stats", requireRole("hod"), getHodAnalytics);

module.exports = router;
