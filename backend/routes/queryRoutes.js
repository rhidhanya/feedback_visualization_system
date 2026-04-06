const router = require("express").Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const { createQuery, getQueries, updateQuery, deleteQuery } = require("../controllers/queryController");

router.post("/", verifyToken, requireRole("student"), createQuery);
router.get("/", verifyToken, getQueries);
router.put("/:id", verifyToken, requireRole("admin", "domain_head", "dean", "principal"), updateQuery);
router.delete("/:id", verifyToken, requireRole("admin", "domain_head"), deleteQuery);

module.exports = router;
