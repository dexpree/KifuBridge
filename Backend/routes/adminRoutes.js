const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  getDashboardStats,
  getAllUsers,
  getUsersByRole,
  approveUser,
  blockUser,
  unblockUser,
  deleteUser,
  getAllDonations,
  getDonationsByStatus,
  getUserById,
  updateUser,
  
} = require("../controllers/adminController");

// Dashboard
router.get(
  "/dashboard-stats",
  protect,
  authorize("admin"),
  getDashboardStats
);

// ================= USER MANAGEMENT =================

// Get all users
router.get(
  "/users",
  protect,
  authorize("admin"),
  getAllUsers
);

// Get users by role
router.get(
  "/users/:role",
  protect,
  authorize("admin"),
  getUsersByRole
);
// ================= DONATIONS =================

router.get(
  "/donations",
  protect,
  authorize("admin"),
  getAllDonations
);

router.get(
  "/donations/:status",
  protect,
  authorize("admin"),
  getDonationsByStatus
);

router.get(
  "/users/details/:id",
  protect,
  authorize("admin"),
  getUserById
);


router.put(
  "/users/:id",
  protect,
  authorize("admin"),
  updateUser
);
// Approve NGO / Volunteer
router.put(
  "/users/:id/approve",
  protect,
  authorize("admin"),
  approveUser
);

// Block user
router.put(
  "/users/:id/block",
  protect,
  authorize("admin"),
  blockUser
);

// Unblock user
router.put(
  "/users/:id/unblock",
  protect,
  authorize("admin"),
  unblockUser
);


// Soft delete user
router.put(
  "/users/:id/delete",
  protect,
  authorize("admin"),
  deleteUser
);

module.exports = router;