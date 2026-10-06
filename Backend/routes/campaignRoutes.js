const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  createCampaign,
  getCampaigns,
  getMyCampaigns,
  getCampaignById,
  approveCampaign,
  rejectCampaign,
  addImpactReport,
  donateToCampaign,
  getCampaignDashboardStats,
  getCampaignDonations,
  getCampaignManagement,
  deleteCampaign,
  updateCampaign,
  getAdminCampaignDetails,
  getAdminCampaigns,
} = require("../controllers/campaignController");


// =====================================================
// PUBLIC / GENERAL CAMPAIGN ROUTES
// =====================================================

// Get campaign feed
router.get(
  "/",
  protect,
  getCampaigns
);


// =====================================================
// NGO ROUTES
// =====================================================

// Create campaign
router.post(
  "/",
  protect,
  authorize("ngo"),
  upload.array("campaignImages", 5),
  createCampaign
);

// My campaigns
router.get(
  "/my-campaigns",
  protect,
  authorize("ngo"),
  getMyCampaigns
);

// NGO dashboard statistics
router.get(
  "/dashboard-stats",
  protect,
  authorize("ngo"),
  getCampaignDashboardStats
);


// =====================================================
// DONOR ROUTES
// =====================================================

// Donate to campaign
router.post(
  "/donate",
  protect,
  authorize("donor"),
  donateToCampaign
);


// =====================================================
// ADMIN ROUTES
// IMPORTANT:
// These MUST come before /:id
// =====================================================

// Get ALL campaigns for admin
router.get(
  "/admin/all",
  protect,
  authorize("admin"),
  getAdminCampaigns
);

// Get ONE campaign details for admin
router.get(
  "/admin/:id",
  protect,
  authorize("admin"),
  getAdminCampaignDetails
);

// Approve campaign
router.put(
  "/:id/approve",
  protect,
  authorize("admin"),
  approveCampaign
);

// Reject campaign
router.put(
  "/:id/reject",
  protect,
  authorize("admin"),
  rejectCampaign
);


// =====================================================
// NGO CAMPAIGN MANAGEMENT
// =====================================================

// Update campaign
router.put(
  "/:id",
  protect,
  authorize("ngo"),
  updateCampaign
);

// Delete campaign
router.delete(
  "/:id",
  protect,
  authorize("ngo"),
  deleteCampaign
);

// NGO campaign management
router.get(
  "/:id/management",
  protect,
  authorize("ngo"),
  getCampaignManagement
);

// Add impact report
router.put(
  "/:id/impact",
  protect,
  authorize("ngo"),
  addImpactReport
);

// NGO campaign donation history
router.get(
  "/:id/donations",
  protect,
  authorize("ngo"),
  getCampaignDonations
);


// =====================================================
// GENERAL CAMPAIGN DETAILS
// KEEP THIS LAST
// =====================================================

router.get(
  "/:id",
  protect,
  getCampaignById
);


module.exports = router;