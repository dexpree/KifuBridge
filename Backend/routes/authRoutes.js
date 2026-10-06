const express = require("express");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

const {
  registerUser,
  loginUser,
} = require("../controllers/authController");

router.post(
  "/register",
  upload.fields([
    { name: "profileImage", maxCount: 1 },

    // NEW
    { name: "vehicleImage", maxCount: 1 },

    { name: "licenseImage", maxCount: 1 },

    { name: "governmentIdImage", maxCount: 1 },

    { name: "vehicleRCImage", maxCount: 1 },

    { name: "registrationCertificate", maxCount: 1 },

    { name: "gstCertificate", maxCount: 1 },
  ]),
  registerUser
);

router.post("/login", loginUser);

module.exports = router;