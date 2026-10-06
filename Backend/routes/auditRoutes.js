const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  getAuditLogs,
} = require("../controllers/auditController");

router.get(
  "/",
  protect,
  authorize("admin"),
  getAuditLogs
);

module.exports = router;