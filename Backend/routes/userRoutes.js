const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  getApprovedVolunteers,
  getVolunteers,
  getMyProfile,
  updateMyProfile,
  getUserById,
  getReportableUsers,
  getPublicNGOs,
  getPublicNGOById,
    updateNGOPublicProfile,
  getMyNGOPublicProfile,
    getMyNGOPaymentDetails,
  updateNGOPaymentDetails,
  getNGOPaymentVerifications,
  verifyNGOPaymentDetails,
  rejectNGOPaymentDetails,
} = require("../controllers/userController");

// Admin Test
router.get(
  "/admin",
  protect,
  authorize("admin"),
  (req, res) => {
    res.json({
      message: "Welcome Admin",
    });
  }
);

// Logged-in User Profile
router.get(
  "/profile",
  protect,
  getMyProfile
);

router.put(
  "/profile",
  protect,
  upload.fields([
    { name: "profileImage", maxCount: 1 },

    // NGO
    { name: "registrationCertificate", maxCount: 1 },

    // Donor / NGO
    { name: "gstCertificate", maxCount: 1 },

    // Volunteer
    { name: "licenseImage", maxCount: 1 },
    { name: "governmentIdImage", maxCount: 1 },
    { name: "vehicleRCImage", maxCount: 1 },
    { name: "vehicleImage", maxCount: 1 },
  ]),
  updateMyProfile
);

// Donor -> Volunteer List
router.get(
  "/volunteers",
  protect,
  authorize("donor"),
  getVolunteers
);

router.get(
  "/reportable",
  protect,
  getReportableUsers
);

// =====================================================
// PUBLIC NGO PROFILE
// =====================================================

router.get(
  "/public-ngos/:id",
  protect,
  getPublicNGOById
);

router.get(
  "/public-ngos",
  protect,
  authorize("donor"),
  getPublicNGOs
);

// Approved Volunteers
router.get(
  "/approved-volunteers",
  protect,
  getApprovedVolunteers
);
router.get(
  "/my-public-profile",
  protect,
  authorize("ngo"),
  getMyNGOPublicProfile
);

router.put(
  "/ngo/public-profile",
  protect,
  authorize("ngo"),
  upload.fields([
    {
      name: "impactImages",
      maxCount: 20,
    },
  ]),
  updateNGOPublicProfile
);
// =====================================================
// NGO PAYMENT DETAILS
// =====================================================

router.get(
  "/ngo/payment-details",
  protect,
  authorize("ngo"),
  getMyNGOPaymentDetails
);

router.put(
  "/ngo/payment-details",
  protect,
  authorize("ngo"),
  updateNGOPaymentDetails
);
// Admin -> View User Profile
router.get(
  "/:id",
  protect,
  authorize("admin"),
  getUserById
);
// =====================================================
// ADMIN - NGO PAYMENT VERIFICATION
// =====================================================

router.get(
  "/admin/payment-verifications",
  protect,
  authorize("admin"),
  getNGOPaymentVerifications
);

router.put(
  "/admin/payment-verifications/:id/verify",
  protect,
  authorize("admin"),
  verifyNGOPaymentDetails
);

router.put(
  "/admin/payment-verifications/:id/reject",
  protect,
  authorize("admin"),
  rejectNGOPaymentDetails
);


module.exports = router;