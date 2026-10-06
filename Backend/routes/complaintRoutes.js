const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {

  createComplaint,

  getMyComplaints,

  getAllComplaints,

  replyComplaint,

  resolveComplaint,

} = require("../controllers/complaintController");

// ==========================
// USER
// ==========================

// Create Complaint
router.post(
  "/",
  protect,
  createComplaint
);

// My Complaints
router.get(
  "/mine",
  protect,
  getMyComplaints
);

// ==========================
// ADMIN
// ==========================

// All Complaints
router.get(
  "/",
  protect,
  authorize("admin"),
  getAllComplaints
);

// Reply
router.put(
  "/:id/reply",
  protect,
  authorize("admin"),
  replyComplaint
);

// Resolve
router.put(
  "/:id/resolve",
  protect,
  authorize("admin"),
  resolveComplaint
);

module.exports = router;