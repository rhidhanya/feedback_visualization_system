const express = require("express");
const router = express.Router();

const {
    register,
    login,
    studentLogin,
    facultyLogin,
    adminLogin,
    domainHeadLogin,
    monitorLogin,
    hodLogin,
    transportInchargeLogin,
    messInchargeLogin,
    sanitationInchargeLogin,
    hostelInchargeLogin,
    unifiedFacultyHodLogin,
    getMe
} = require("../controllers/authController");

const { verifyToken } = require("../middleware/auth");

const {
    validateRegister,
    validateLogin,
    validateStudentLogin,
    validateFacultyLogin,
    validateAdminLogin
} = require("../middleware/validate");


/* =========================
   REGISTER ROUTES
========================= */

router.post("/register", validateRegister, register);
router.post("/student-register", validateRegister, register);


/* =========================
   LOGIN ROUTES
========================= */

router.post("/login", validateLogin, login);

router.post("/student-login", validateStudentLogin, studentLogin);

router.post("/faculty-login", validateFacultyLogin, facultyLogin);

/* Faculty + HOD unified login */
router.post("/faculty-hod-login", validateFacultyLogin, unifiedFacultyHodLogin);

router.post("/admin-login", validateAdminLogin, adminLogin);


/* =========================
   ROLE BASED LOGINS
========================= */

router.post("/domain-head-login", validateLogin, domainHeadLogin);

router.post("/monitor-login", validateLogin, monitorLogin);

router.post("/hod-login", validateLogin, hodLogin);


/* =========================
   INCHARGE LOGINS
========================= */

router.post("/login/transport-incharge", validateLogin, transportInchargeLogin);

router.post("/login/mess-incharge", validateLogin, messInchargeLogin);

router.post("/login/sanitation-incharge", validateLogin, sanitationInchargeLogin);

router.post("/login/hostel-incharge", validateLogin, hostelInchargeLogin);


/* =========================
   AUTH USER
========================= */

router.get("/me", verifyToken, getMe);


module.exports = router;