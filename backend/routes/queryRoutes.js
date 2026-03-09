const router = require("express").Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const { createQuery, getQueries, updateQuery } = require("../controllers/queryController");

router.post("/", verifyToken, requireRole("student"), createQuery);
router.get("/", verifyToken, getQueries);
router.put("/:id", verifyToken, requireRole("admin", "domain_head", "dean", "principal"), updateQuery);

module.exports = router;
