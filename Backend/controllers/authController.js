const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// =========================
// Register User
// =========================

const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      gender,
      address,
      city,
      state,
      pincode,
      password,
      role,

      donorType,
      organizationName,
      organizationCategory,
      ngoCategory,
      gstNumber,

      vehicleType,
      vehicleNumber,
      vehicleCapacity,
      availability,
      licenseNumber,
    } = req.body;

    // =====================================================
    // GENDER VALIDATION
    // =====================================================

    if (!gender) {
      return res.status(400).json({
        message: "Gender is required.",
      });
    }

    const allowedGenders = [
      "male",
      "female",
      "other",
    ];

    if (!allowedGenders.includes(gender)) {
      return res.status(400).json({
        message: "Invalid gender selected.",
      });
    }

    // =====================================================
    // UPLOADED IMAGES
    // =====================================================

    const profileImage =
      req.files?.profileImage?.[0]
        ? `/uploads/${req.files.profileImage[0].filename}`
        : "";

    // NEW: VEHICLE IMAGE
    const vehicleImage =
      req.files?.vehicleImage?.[0]
        ? `/uploads/${req.files.vehicleImage[0].filename}`
        : "";

    const registrationCertificate =
      req.files?.registrationCertificate?.[0]
        ? `/uploads/${req.files.registrationCertificate[0].filename}`
        : "";

    const licenseImage =
      req.files?.licenseImage?.[0]
        ? `/uploads/${req.files.licenseImage[0].filename}`
        : "";

    const governmentIdImage =
      req.files?.governmentIdImage?.[0]
        ? `/uploads/${req.files.governmentIdImage[0].filename}`
        : "";

    const vehicleRCImage =
      req.files?.vehicleRCImage?.[0]
        ? `/uploads/${req.files.vehicleRCImage[0].filename}`
        : "";

    const gstCertificate =
      req.files?.gstCertificate?.[0]
        ? `/uploads/${req.files.gstCertificate[0].filename}`
        : "";

    // =====================================================
    // CHECK EXISTING EMAIL
    // =====================================================

    const existingEmail = await User.findOne({
      email,
    });

    if (existingEmail) {
      return res.status(400).json({
        message: "Email already registered.",
      });
    }

    // =====================================================
    // CHECK EXISTING PHONE
    // =====================================================

    const existingPhone = await User.findOne({
      phone,
    });

    if (existingPhone) {
      return res.status(400).json({
        message: "Phone number already registered.",
      });
    }

    // =====================================================
    // ORGANIZATION INFORMATION
    // =====================================================

    const requiresOrganizationInfo =
      role === "ngo" ||
      (role === "donor" &&
        donorType === "organization");

    if (requiresOrganizationInfo) {
      if (
        !organizationName ||
        !organizationName.trim()
      ) {
        return res.status(400).json({
          message:
            "Organization name is required.",
        });
      }

      if (
        !organizationCategory ||
        !organizationCategory.trim()
      ) {
        return res.status(400).json({
          message:
            "Organization category is required.",
        });
      }

      if (
        role === "ngo" &&
        (!ngoCategory ||
          !ngoCategory.trim())
      ) {
        return res.status(400).json({
          message:
            "NGO category is required.",
        });
      }
    }

    // =====================================================
    // VALIDATE ORGANIZATION DONOR
    // =====================================================

    if (
      role === "donor" &&
      donorType === "organization"
    ) {
      if (
        !organizationName ||
        !organizationName.trim()
      ) {
        return res.status(400).json({
          message:
            "Organization name is required.",
        });
      }

      if (
        !organizationCategory ||
        !organizationCategory.trim()
      ) {
        return res.status(400).json({
          message:
            "Organization category is required.",
        });
      }
    }

    // =====================================================
    // VALIDATE VOLUNTEER DETAILS
    // =====================================================

    if (role === "volunteer") {
      if (
        !vehicleType ||
        !vehicleType.trim()
      ) {
        return res.status(400).json({
          message:
            "Vehicle type is required.",
        });
      }

      if (
        !vehicleNumber ||
        !vehicleNumber.trim()
      ) {
        return res.status(400).json({
          message:
            "Vehicle number is required.",
        });
      }

      if (
        !vehicleCapacity ||
        !vehicleCapacity.trim()
      ) {
        return res.status(400).json({
          message:
            "Vehicle capacity is required.",
        });
      }

      if (
        !availability ||
        !availability.trim()
      ) {
        return res.status(400).json({
          message:
            "Availability is required.",
        });
      }
    }

    // =====================================================
    // HASH PASSWORD
    // =====================================================

    const salt =
      await bcrypt.genSalt(10);

    const hashedPassword =
      await bcrypt.hash(
        password,
        salt
      );

    // =====================================================
    // APPROVAL LOGIC
    // =====================================================

    let isApproved = true;

    if (
      role === "ngo" ||
      role === "volunteer"
    ) {
      isApproved = false;
    }

    if (
      role === "donor" &&
      donorType === "organization"
    ) {
      isApproved = false;
    }

    // =====================================================
    // CREATE USER
    // =====================================================

    const user =
      await User.create({
        name,
        email,
        phone,
        gender,

        address,
        city,
        state,
        pincode,

        password: hashedPassword,

        role,

        donorType,

        organizationName,

        organizationCategory,

        gstNumber,

        ngoCategory,

        isApproved,

        // =================================================
        // VOLUNTEER INFORMATION
        // =================================================

        vehicleType,
        vehicleNumber,
        vehicleCapacity,
        availability,
        licenseNumber,

        // =================================================
        // IMAGES
        // =================================================

        profileImage,

        // NEW
        vehicleImage,

        registrationCertificate,

        licenseImage,

        governmentIdImage,

        gstCertificate,

        vehicleRCImage,
      });

    // =====================================================
    // USER CREATION FAILED
    // =====================================================

    if (!user) {
      return res.status(400).json({
        message:
          "Registration failed",
      });
    }

    // =====================================================
    // RESPONSE
    // =====================================================

    res.status(201).json({
      message: isApproved
        ? "Registration successful. You can now log in."
        : "Registration successful. Your account is awaiting admin approval.",

      user: {
        id: user._id,

        name: user.name,

        email: user.email,

        gender: user.gender,

        role: user.role,

        donorType:
          user.donorType,

        organizationName:
          user.organizationName,

        organizationCategory:
          user.organizationCategory,

        gstNumber:
          user.gstNumber,

        ngoCategory:
          user.ngoCategory,

        // =================================================
        // VOLUNTEER
        // =================================================

        vehicleType:
          user.vehicleType,

        vehicleNumber:
          user.vehicleNumber,

        vehicleCapacity:
          user.vehicleCapacity,

        availability:
          user.availability,

        licenseNumber:
          user.licenseNumber,

        // =================================================
        // IMAGES
        // =================================================

        profileImage:
          user.profileImage,

        // NEW
        vehicleImage:
          user.vehicleImage,

        registrationCertificate:
          user.registrationCertificate,

        licenseImage:
          user.licenseImage,

        governmentIdImage:
          user.governmentIdImage,

        gstCertificate:
          user.gstCertificate,

        vehicleRCImage:
          user.vehicleRCImage,
      },
    });
  } catch (error) {
    console.error(
      "Registration Error:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
};

// =========================
// Login User
// =========================
const loginUser = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    // =====================================================
    // FIND USER
    // =====================================================

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // =====================================================
    // DELETED ACCOUNT
    // =====================================================

    if (user.isDeleted) {
      return res.status(403).json({
        message:
          "Account no longer exists.",
      });
    }

    // =====================================================
    // BLOCKED ACCOUNT
    // =====================================================

    if (user.isBlocked) {
      return res.status(403).json({
        message:
          "Your account has been blocked by the administrator.",
      });
    }

    // =====================================================
    // APPROVAL CHECK
    // =====================================================

    const approvalRequired =
      user.role === "ngo" ||
      user.role === "volunteer" ||
      (
        user.role === "donor" &&
        user.donorType === "organization"
      );

    if (
      approvalRequired &&
      !user.isApproved
    ) {
      return res.status(403).json({
        message:
          "Your account is awaiting admin approval.",
      });
    }

    // =====================================================
    // PASSWORD CHECK
    // =====================================================

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res.status(400).json({
        message:
          "Invalid credentials",
      });
    }

    // =====================================================
    // JWT
    // =====================================================

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // =====================================================
    // RESPONSE
    // =====================================================

    res.json({
      token,

      user: {
        id: user._id,

        name: user.name,

        email: user.email,

        phone: user.phone,

        gender: user.gender,

        address: user.address,

        city: user.city,

        state: user.state,

        pincode: user.pincode,

        role: user.role,

        donorType:
          user.donorType,

        organizationName:
          user.organizationName,

        organizationCategory:
          user.organizationCategory,

        gstNumber:
          user.gstNumber,

        // ===============================================
        // PROFILE IMAGE
        // ===============================================

        profileImage:
          user.profileImage || "",

        // ===============================================
        // OTHER PROFILE DATA
        // ===============================================

        bio:
          user.bio || "",

        isApproved:
          user.isApproved,

        isBlocked:
          user.isBlocked,
      },
    });

  } catch (error) {
    console.error(
      "Login Error:",
      error
    );

    res.status(500).json({
      message:
        error.message,
    });
  }
};

module.exports = {

  registerUser,

  loginUser,

};