const express = require("express");

const router = express.Router();

const protect =
  require("../middleware/authMiddleware");

const authorize =
  require("../middleware/roleMiddleware");

  const upload = require("../middleware/uploadMiddleware");

const {
  createRequest,
  getDonationRequests,
  updateRequestStatus,
  getVolunteerDeliveries,
  getMyRequests,
  confirmReceived,
  getMyDeliveries,
  acceptDelivery,
  declineDelivery,
  updateDeliveryStatus,
  getNgoDashboardStats,
  getVolunteerDashboardStats,
  getDonorRequests, 
  acceptRequest,
  rejectRequest,
  markDonorDelivered,
  assignVolunteer,
} = require("../controllers/requestController");



router.post(
  "/",
  protect,
  authorize("ngo"),
  createRequest
);


router.get(
  "/my-requests",
  protect,
  authorize("ngo"),
  getMyRequests
);
router.get(
  "/ngo-dashboard-stats",
  protect,
  authorize("ngo"),
  getNgoDashboardStats
);
router.get(
  "/volunteer-deliveries",
  protect,
  authorize("volunteer"),
  getVolunteerDeliveries
);
router.get(
  "/my-deliveries",
  protect,
  authorize("volunteer"),
  getMyDeliveries
);
router.get(
  "/volunteer-dashboard-stats",
  protect,
  authorize("volunteer"),
  getVolunteerDashboardStats
);router.get(
  "/donor-requests",
  protect,
  authorize("donor"),
  getDonorRequests
);
router.put(
  "/:id/donor-delivered",
  protect,
  authorize("donor"),
  markDonorDelivered
);
router.put(
  "/:id/accept",
  protect,
  authorize("donor"),
  acceptRequest
);


router.put(
  "/:id/reject",
  protect,
  authorize("donor"),
  rejectRequest
);
router.put(
  "/:id/assign-volunteer",
  protect,
  authorize("donor"),
  assignVolunteer
);
router.put(
  "/:id",
  protect,
  authorize("donor"),
  updateRequestStatus
);
router.put(
  "/:id/received",
  protect,
  authorize("ngo"),
  confirmReceived
);
router.put(
  "/:id/accept-delivery",
  protect,
  authorize("volunteer"),
  acceptDelivery
);

router.put(
  "/:id/decline-delivery",
  protect,
  authorize("volunteer"),
  declineDelivery
);

router.put(
  "/:id/delivery-status",
  protect,
  authorize("volunteer"),
  upload.single("proofImage"),
  updateDeliveryStatus
);

module.exports = router;