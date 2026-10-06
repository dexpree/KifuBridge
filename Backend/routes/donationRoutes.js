const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const {createDonation, getDonations, getMyDonations,updateDonation,deleteDonation,getDonorDashboardStats} = require("../controllers/donationController");
const upload = require("../middleware/uploadMiddleware");


router.post(
  "/",
  protect,
  authorize("donor", "admin"),
  upload.array("itemImages", 5),
  createDonation
);

router.get(
  "/",
  protect,
  getDonations
);
router.get(
  "/my-donations",
  protect,
  authorize("donor", "admin"),
  getMyDonations
);
router.get(
  "/dashboard-stats",
  protect,
  authorize("donor"),
  getDonorDashboardStats
);
router.put(
  "/:id",
  protect,
  authorize("donor", "admin"),
  updateDonation
);

router.delete(
  "/:id",
  protect,
  authorize("donor", "admin"),
  deleteDonation
);
  
module.exports = router;
