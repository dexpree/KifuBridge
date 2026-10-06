const User = require("../models/User");

/* ==========================================
   GET APPROVED VOLUNTEERS
========================================== */

const getApprovedVolunteers = async (req, res) => {
  try {

    const volunteers = await User.find({
      role: "volunteer",
      isApproved: true,
      isBlocked: false,
      isDeleted: false,
    }).select(
  "name email phone address city state pincode profileImage vehicleImage vehicleType vehicleNumber vehicleCapacity availability licenseNumber"
);

    res.json(volunteers);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

/* ==========================================
   GET ALL VOLUNTEERS
========================================== */

const getVolunteers = async (req, res) => {
  try {
    const volunteers = await User.find({
      role: "volunteer",
    }).select(
      "name email phone address city state pincode profileImage vehicleImage vehicleType vehicleNumber vehicleCapacity availability licenseNumber isApproved"
    );

    res.json(volunteers);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ==========================================
   GET MY PROFILE
========================================== */

const getMyProfile = async (req, res) => {

  try {

    const user = await User.findById(req.user.id)
      .select("-password");

    if (!user) {

      return res.status(404).json({
        message: "User not found.",
      });

    }

    res.json(user);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};
/* ==========================================
   UPDATE MY PROFILE
========================================== */

const updateMyProfile = async (req, res) => {
  try {
    // =====================================================
    // FIND USER
    // =====================================================

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // =====================================================
    // ACCOUNT STATUS
    // =====================================================

    if (user.isDeleted) {
      return res.status(403).json({
        message: "This account has been deleted.",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "This account has been blocked.",
      });
    }

    // =====================================================
    // UPLOADED IMAGES / VERIFICATION DOCUMENTS
    // =====================================================

    // -----------------------------------------------------
    // PROFILE PHOTO
    // -----------------------------------------------------

    if (req.files?.profileImage?.[0]) {
      user.profileImage =
        `/uploads/${req.files.profileImage[0].filename}`;
    }

    // -----------------------------------------------------
    // NGO REGISTRATION CERTIFICATE
    // -----------------------------------------------------

    if (req.files?.registrationCertificate?.[0]) {
      user.registrationCertificate =
        `/uploads/${req.files.registrationCertificate[0].filename}`;
    }

    // -----------------------------------------------------
    // GST CERTIFICATE
    // -----------------------------------------------------

    if (req.files?.gstCertificate?.[0]) {
      user.gstCertificate =
        `/uploads/${req.files.gstCertificate[0].filename}`;
    }

    // -----------------------------------------------------
    // DRIVING LICENCE
    // -----------------------------------------------------

    if (req.files?.licenseImage?.[0]) {
      user.licenseImage =
        `/uploads/${req.files.licenseImage[0].filename}`;
    }

    // -----------------------------------------------------
    // GOVERNMENT ID
    // -----------------------------------------------------

    if (req.files?.governmentIdImage?.[0]) {
      user.governmentIdImage =
        `/uploads/${req.files.governmentIdImage[0].filename}`;
    }

    // -----------------------------------------------------
    // VEHICLE RC
    // -----------------------------------------------------

    if (req.files?.vehicleRCImage?.[0]) {
      user.vehicleRCImage =
        `/uploads/${req.files.vehicleRCImage[0].filename}`;
    }

    // -----------------------------------------------------
    // VEHICLE PHOTO
    // -----------------------------------------------------

    if (req.files?.vehicleImage?.[0]) {
      user.vehicleImage =
        `/uploads/${req.files.vehicleImage[0].filename}`;
    }

    // =====================================================
    // COMMON FIELDS
    // =====================================================

    // -----------------------------------------------------
    // NAME
    // -----------------------------------------------------

    if (req.body.name !== undefined) {
      const name =
        String(req.body.name).trim();

      if (!name) {
        return res.status(400).json({
          message: "Name is required.",
        });
      }

      user.name = name;
    }

    // -----------------------------------------------------
    // PHONE
    // -----------------------------------------------------

    if (req.body.phone !== undefined) {
      const phone =
        String(req.body.phone).trim();

      if (!/^[0-9]{10}$/.test(phone)) {
        return res.status(400).json({
          message:
            "Phone must contain exactly 10 digits.",
        });
      }

      // Check whether another user already
      // has this phone number
      const existingPhone =
        await User.findOne({
          phone,
          _id: { $ne: user._id },
        });

      if (existingPhone) {
        return res.status(400).json({
          message:
            "Phone number already registered.",
        });
      }

      user.phone = phone;
    }

    // =====================================================
    // GENDER
    // =====================================================

    if (req.body.gender !== undefined) {
      const gender =
        String(req.body.gender)
          .trim()
          .toLowerCase();

      const allowedGenders = [
        "male",
        "female",
        "other",
      ];

      if (
        gender !== "" &&
        !allowedGenders.includes(gender)
      ) {
        return res.status(400).json({
          message:
            "Invalid gender selected.",
        });
      }

      user.gender = gender;
    }

    // =====================================================
    // ADDRESS
    // =====================================================

    if (req.body.address !== undefined) {
      user.address =
        String(req.body.address).trim();
    }

    if (req.body.city !== undefined) {
      user.city =
        String(req.body.city).trim();
    }

    if (req.body.state !== undefined) {
      user.state =
        String(req.body.state).trim();
    }

    // =====================================================
    // PINCODE
    // =====================================================

    if (req.body.pincode !== undefined) {
      const pincode =
        String(req.body.pincode).trim();

      if (
        pincode !== "" &&
        !/^[0-9]{6}$/.test(pincode)
      ) {
        return res.status(400).json({
          message:
            "Pincode must contain exactly 6 digits.",
        });
      }

      user.pincode = pincode;
    }

    // =====================================================
    // NGO INFORMATION
    // =====================================================

    if (user.role === "ngo") {

      if (
        req.body.organizationName !==
        undefined
      ) {
        user.organizationName =
          String(
            req.body.organizationName
          ).trim();
      }

      if (
        req.body.organizationCategory !==
        undefined
      ) {
        user.organizationCategory =
          String(
            req.body.organizationCategory
          ).trim();
      }

      if (
        req.body.ngoCategory !==
        undefined
      ) {
        user.ngoCategory =
          String(
            req.body.ngoCategory
          ).trim();
      }

      if (
        req.body.gstNumber !==
        undefined
      ) {
        user.gstNumber =
          String(
            req.body.gstNumber
          ).trim();
      }
    }

    // =====================================================
    // ORGANIZATION DONOR
    // =====================================================

    if (
      user.role === "donor" &&
      user.donorType ===
        "organization"
    ) {

      if (
        req.body.organizationName !==
        undefined
      ) {
        user.organizationName =
          String(
            req.body.organizationName
          ).trim();
      }

      if (
        req.body.organizationCategory !==
        undefined
      ) {
        user.organizationCategory =
          String(
            req.body.organizationCategory
          ).trim();
      }

      if (
        req.body.gstNumber !==
        undefined
      ) {
        user.gstNumber =
          String(
            req.body.gstNumber
          ).trim();
      }
    }

    // =====================================================
    // VOLUNTEER INFORMATION
    // =====================================================

    if (user.role === "volunteer") {

      // ---------------------------------------------------
      // VEHICLE TYPE
      // ---------------------------------------------------

      if (
        req.body.vehicleType !==
        undefined
      ) {
        user.vehicleType =
          String(
            req.body.vehicleType
          ).trim();
      }

      // ---------------------------------------------------
      // VEHICLE NUMBER
      // ---------------------------------------------------

      if (
        req.body.vehicleNumber !==
        undefined
      ) {
        user.vehicleNumber =
          String(
            req.body.vehicleNumber
          )
            .trim()
            .toUpperCase();
      }

      // ---------------------------------------------------
      // VEHICLE CAPACITY
      // ---------------------------------------------------

      if (
        req.body.vehicleCapacity !==
        undefined
      ) {
        user.vehicleCapacity =
          String(
            req.body.vehicleCapacity
          ).trim();
      }

      // ---------------------------------------------------
      // AVAILABILITY
      // ---------------------------------------------------

      if (
        req.body.availability !==
        undefined
      ) {
        user.availability =
          String(
            req.body.availability
          ).trim();
      }

      // ---------------------------------------------------
      // LICENCE NUMBER
      // ---------------------------------------------------

      if (
        req.body.licenseNumber !==
        undefined
      ) {
        user.licenseNumber =
          String(
            req.body.licenseNumber
          )
            .trim()
            .toUpperCase();
      }

      // ---------------------------------------------------
      // SKILLS
      // ---------------------------------------------------

      if (
        req.body.skills !==
        undefined
      ) {
        user.skills =
          String(
            req.body.skills
          ).trim();
      }
    }

    // =====================================================
    // SAVE USER
    // =====================================================

    await user.save();

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      message:
        "Profile updated successfully.",

      user,
    });

  } catch (error) {

    console.error(
      "Update My Profile Error:",
      error
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};
const getUserById = async (req, res) => {

  try {

    const user = await User.findById(req.params.id)
      .select("-password");

    if (!user) {

      return res.status(404).json({
        message: "User not found.",
      });

    }

    res.json(user);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};
// ===================================
// Get Reportable Users
// ===================================

const getReportableUsers = async (req, res) => {

  try {

    const users = await User.find({

      _id: { $ne: req.user.id },

      isDeleted: false,

      isBlocked: false,

    }).select("name role");

    res.json(users);

  } catch (error) {

    res.status(500).json({

      message: error.message,

    });

  }

};
// ============================================================
// GET ACTIVE NGOS FOR DONOR DIRECTORY
// ============================================================
// =====================================================
// GET PUBLIC NGOs
// =====================================================

const getPublicNGOs = async (req, res) => {
  try {
    const ngos = await User.find({
      role: "ngo",
      isApproved: true,
      isBlocked: false,
      isDeleted: false,
    })
      .select(
        "name email phone address city state pincode organizationName organizationCategory ngoCategory registrationCertificate governmentIdImage profileImage bio createdAt"
      )
      .sort({
        createdAt: -1,
      });

    console.log(
      "===================================="
    );

    console.log(
      "PUBLIC NGOs:",
      ngos.length
    );

    ngos.forEach((ngo) => {
      console.log(
        "------------------------------------"
      );

      console.log(
        "NGO ID:",
        ngo._id
      );

      console.log(
        "NGO NAME:",
        ngo.name
      );

      console.log(
        "ORGANIZATION:",
        ngo.organizationName
      );

      console.log(
        "NGO CATEGORY:",
        ngo.ngoCategory
      );

      console.log(
        "CITY:",
        ngo.city
      );

      console.log(
        "STATE:",
        ngo.state
      );
    });

    console.log(
      "===================================="
    );

    return res.status(200).json(
      ngos
    );

  } catch (error) {
    console.error(
      "Get Public NGOs Error:",
      error
    );

    return res.status(500).json({
      message:
        error.message,
    });
  }
};

// =====================================================
// GET SINGLE PUBLIC NGO
// =====================================================

// =====================================================
// GET PUBLIC NGO BY ID
// =====================================================

const getPublicNGOById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(
      "===================================="
    );

    console.log(
      "PUBLIC NGO PROFILE REQUEST"
    );

    console.log(
      "NGO ID:",
      id
    );

    // =================================================
    // FIND PUBLIC NGO
    // =================================================

    const ngo = await User.findOne({
      _id: id,
      role: "ngo",
      isApproved: true,
      isBlocked: false,
      isDeleted: false,
    }).select(
      [
        // =================================================
        // BASIC INFORMATION
        // =================================================
        "name",
        "email",
        "phone",
        "address",
        "city",
        "state",
        "pincode",

        // =================================================
        // ORGANIZATION
        // =================================================
        "organizationName",
        "organizationCategory",
        "ngoCategory",

        // =================================================
        // EXISTING PROFILE
        // =================================================
        "profileImage",
        "bio",
        "createdAt",

        // =================================================
        // PUBLIC NGO PROFILE
        // =================================================
        "ngoMission",
        "ngoVision",
        "ngoAbout",
        "ngoImpact",

        // =================================================
        // IMPACT STATISTICS
        // =================================================
        "peopleHelped",
        "projectsCompleted",
        "yearsOfService",

        // =================================================
        // ACHIEVEMENTS
        // =================================================
        "achievements",

        // =================================================
        // IMPACT GALLERY
        // =================================================
        "impactImages",

        // =================================================
        // SOCIAL LINKS
        // =================================================
        "website",
        "facebookUrl",
        "instagramUrl",
        "linkedinUrl",

        // =================================================
        // PAYMENT DETAILS
        // =================================================
        // We retrieve these only so we can create
        // a SAFE public version below.
        "paymentDetails",
      ].join(" ")
    );

    // =================================================
    // NOT FOUND
    // =================================================

    if (!ngo) {
      return res.status(404).json({
        message:
          "NGO not found or is no longer available.",
      });
    }

    // =================================================
    // SAFE PUBLIC PAYMENT DETAILS
    // =================================================

    let publicPaymentDetails = null;

    // -------------------------------------------------
    // Only expose payment information after ADMIN
    // verification.
    // -------------------------------------------------

    if (
      ngo.paymentDetails &&
      ngo.paymentDetails.verificationStatus ===
        "verified"
    ) {
      const accountNumber =
        ngo.paymentDetails.accountNumber || "";

      // -------------------------------------------------
      // MASK ACCOUNT NUMBER
      // Example:
      // 123456789012
      // becomes:
      // XXXXXX9012
      // -------------------------------------------------

      let maskedAccountNumber = "";

      if (accountNumber.length > 4) {
        maskedAccountNumber =
          "XXXXXX" +
          accountNumber.slice(-4);
      } else {
        maskedAccountNumber =
          accountNumber;
      }

      publicPaymentDetails = {
        accountHolderName:
          ngo.paymentDetails
            .accountHolderName || "",

        bankName:
          ngo.paymentDetails.bankName || "",

        accountNumber:
          maskedAccountNumber,

        ifscCode:
          ngo.paymentDetails.ifscCode || "",

        accountType:
          ngo.paymentDetails.accountType || "",

        upiId:
          ngo.paymentDetails.upiId || "",

        verificationStatus:
          "verified",

        verifiedAt:
          ngo.paymentDetails.verifiedAt ||
          null,
      };
    }

    // =================================================
    // DEBUG
    // =================================================

    console.log(
      "NGO FOUND:",
      ngo.organizationName ||
        ngo.name
    );

    console.log(
      "PAYMENT VERIFIED:",
      ngo.paymentDetails?.verificationStatus ===
        "verified"
    );

    console.log(
      "PUBLIC PAYMENT DETAILS:",
      publicPaymentDetails
    );

    console.log(
      "ABOUT:",
      ngo.ngoAbout
    );

    console.log(
      "MISSION:",
      ngo.ngoMission
    );

    console.log(
      "VISION:",
      ngo.ngoVision
    );

    console.log(
      "IMPACT:",
      ngo.ngoImpact
    );

    console.log(
      "PEOPLE HELPED:",
      ngo.peopleHelped
    );

    console.log(
      "PROJECTS COMPLETED:",
      ngo.projectsCompleted
    );

    console.log(
      "ACHIEVEMENTS:",
      ngo.achievements
    );

    console.log(
      "IMPACT IMAGES:",
      ngo.impactImages
    );

    console.log(
      "===================================="
    );

    // =================================================
    // SAFE PUBLIC RESPONSE
    // =================================================
    //
    // IMPORTANT:
    //
    // DO NOT return `ngo` directly.
    //
    // The original ngo object contains the complete
    // bank account number.
    //
    // We return only the fields that donors are allowed
    // to see.
    //
    // =================================================

    return res.status(200).json({
      _id: ngo._id,

      // =================================================
      // BASIC INFORMATION
      // =================================================

      name:
        ngo.name,

      email:
        ngo.email,

      phone:
        ngo.phone,

      address:
        ngo.address,

      city:
        ngo.city,

      state:
        ngo.state,

      pincode:
        ngo.pincode,

      // =================================================
      // ORGANIZATION
      // =================================================

      organizationName:
        ngo.organizationName,

      organizationCategory:
        ngo.organizationCategory,

      ngoCategory:
        ngo.ngoCategory,

      // =================================================
      // PROFILE
      // =================================================

      profileImage:
        ngo.profileImage,

      bio:
        ngo.bio,

      createdAt:
        ngo.createdAt,

      // =================================================
      // PUBLIC NGO PROFILE
      // =================================================

      ngoMission:
        ngo.ngoMission,

      ngoVision:
        ngo.ngoVision,

      ngoAbout:
        ngo.ngoAbout,

      ngoImpact:
        ngo.ngoImpact,

      // =================================================
      // IMPACT STATISTICS
      // =================================================

      peopleHelped:
        ngo.peopleHelped,

      projectsCompleted:
        ngo.projectsCompleted,

      yearsOfService:
        ngo.yearsOfService,

      // =================================================
      // ACHIEVEMENTS
      // =================================================

      achievements:
        ngo.achievements,

      // =================================================
      // IMPACT IMAGES
      // =================================================

      impactImages:
        ngo.impactImages,

      // =================================================
      // SOCIAL LINKS
      // =================================================

      website:
        ngo.website,

      facebookUrl:
        ngo.facebookUrl,

      instagramUrl:
        ngo.instagramUrl,

      linkedinUrl:
        ngo.linkedinUrl,

      // =================================================
      // SAFE PAYMENT DETAILS
      // =================================================
      //
      // null if payment details are not verified.
      //
      // If verified, accountNumber is MASKED.
      //
      // =================================================

      paymentDetails:
        publicPaymentDetails,
    });

  } catch (error) {
    console.error(
      "Get Public NGO By ID Error:",
      error
    );

    return res.status(500).json({
      message:
        error.message,
    });
  }
};
//==================================================
// UPDATE NGO PUBLIC PROFILE
// NGO ONLY
// =====================================================
const updateNGOPublicProfile = async (req, res) => {
  try {
    // ===================================================
    // AUTHORIZATION
    // ===================================================

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (req.user.role !== "ngo") {
      return res.status(403).json({
        message:
          "Only NGO accounts can update the NGO public profile.",
      });
    }

    // ===================================================
    // FIND NGO
    // ===================================================

    const ngo = await User.findById(
      req.user.id
    );

    if (!ngo) {
      return res.status(404).json({
        message: "NGO account not found.",
      });
    }

    // ===================================================
    // ACCOUNT STATUS
    // ===================================================

    if (ngo.isDeleted) {
      return res.status(403).json({
        message:
          "This NGO account has been deleted.",
      });
    }

    if (ngo.isBlocked) {
      return res.status(403).json({
        message:
          "This NGO account is currently blocked.",
      });
    }

    // ===================================================
    // BASIC PUBLIC INFORMATION
    // ===================================================

    if (
      req.body.ngoMission !== undefined
    ) {
      ngo.ngoMission = String(
        req.body.ngoMission
      ).trim();
    }

    if (
      req.body.ngoVision !== undefined
    ) {
      ngo.ngoVision = String(
        req.body.ngoVision
      ).trim();
    }

    if (
      req.body.ngoAbout !== undefined
    ) {
      ngo.ngoAbout = String(
        req.body.ngoAbout
      ).trim();
    }

    if (
      req.body.ngoImpact !== undefined
    ) {
      ngo.ngoImpact = String(
        req.body.ngoImpact
      ).trim();
    }

    // ===================================================
    // IMPACT NUMBERS
    // ===================================================

    if (
      req.body.peopleHelped !== undefined
    ) {
      const peopleHelped = Number(
        req.body.peopleHelped
      );

      if (
        !Number.isFinite(peopleHelped) ||
        peopleHelped < 0
      ) {
        return res.status(400).json({
          message:
            "People helped must be a valid number greater than or equal to 0.",
        });
      }

      ngo.peopleHelped =
        Math.floor(peopleHelped);
    }

    if (
      req.body.projectsCompleted !==
      undefined
    ) {
      const projectsCompleted =
        Number(
          req.body.projectsCompleted
        );

      if (
        !Number.isFinite(
          projectsCompleted
        ) ||
        projectsCompleted < 0
      ) {
        return res.status(400).json({
          message:
            "Projects completed must be a valid number greater than or equal to 0.",
        });
      }

      ngo.projectsCompleted =
        Math.floor(
          projectsCompleted
        );
    }

    if (
      req.body.yearsOfService !==
      undefined
    ) {
      const yearsOfService = Number(
        req.body.yearsOfService
      );

      if (
        !Number.isFinite(
          yearsOfService
        ) ||
        yearsOfService < 0
      ) {
        return res.status(400).json({
          message:
            "Years of service must be a valid number greater than or equal to 0.",
        });
      }

      ngo.yearsOfService =
        Math.floor(
          yearsOfService
        );
    }

    // ===================================================
    // ACHIEVEMENTS
    // ===================================================

    if (
      req.body.achievements !==
      undefined
    ) {
      let achievements =
        req.body.achievements;

      if (
        typeof achievements ===
        "string"
      ) {
        try {
          achievements =
            JSON.parse(
              achievements
            );
        } catch (error) {
          achievements =
            achievements
              .split(",")
              .map((item) =>
                item.trim()
              )
              .filter(Boolean);
        }
      }

      if (
        !Array.isArray(
          achievements
        )
      ) {
        return res.status(400).json({
          message:
            "Achievements must be provided as an array.",
        });
      }

      ngo.achievements =
        achievements
          .map((item) =>
            String(item).trim()
          )
          .filter(Boolean)
          .slice(0, 20);
    }

    // ===================================================
    // WEBSITE / SOCIAL LINKS
    // ===================================================

    if (
      req.body.website !==
      undefined
    ) {
      ngo.website = String(
        req.body.website
      ).trim();
    }

    if (
      req.body.facebookUrl !==
      undefined
    ) {
      ngo.facebookUrl = String(
        req.body.facebookUrl
      ).trim();
    }

    if (
      req.body.instagramUrl !==
      undefined
    ) {
      ngo.instagramUrl = String(
        req.body.instagramUrl
      ).trim();
    }

    if (
      req.body.linkedinUrl !==
      undefined
    ) {
      ngo.linkedinUrl = String(
        req.body.linkedinUrl
      ).trim();
    }

    // ===================================================
    // EXISTING IMPACT IMAGES
    // ===================================================
    /*
      Frontend sends the images that the NGO
      still wants to keep.

      Example:
      existingImpactImages = [
        "/uploads/impact1.jpg",
        "/uploads/impact3.jpg"
      ]

      Any old image not included here is removed
      from the NGO's public profile.
    */

    let existingImpactImages =
      ngo.impactImages || [];

    if (
      req.body
        .existingImpactImages !==
      undefined
    ) {
      let parsedImages =
        req.body
          .existingImpactImages;

      if (
        typeof parsedImages ===
        "string"
      ) {
        try {
          parsedImages =
            JSON.parse(
              parsedImages
            );
        } catch (error) {
          return res.status(400).json({
            message:
              "Invalid existing impact images data.",
          });
        }
      }

      if (
        !Array.isArray(
          parsedImages
        )
      ) {
        return res.status(400).json({
          message:
            "Existing impact images must be an array.",
        });
      }

      existingImpactImages =
        parsedImages.filter(
          (image) =>
            typeof image ===
              "string" &&
            image.trim()
        );
    }

    // ===================================================
    // REMOVE DUPLICATE IMAGE PATHS
    // ===================================================

    existingImpactImages =
      [
        ...new Set(
          existingImpactImages
        ),
      ];

    // ===================================================
    // NEW IMPACT IMAGES
    // ===================================================

    const uploadedImages =
      req.files?.impactImages
        ? req.files.impactImages.map(
            (file) =>
              `/uploads/${file.filename}`
          )
        : [];

    // ===================================================
    // COMBINE EXISTING + NEW
    // ===================================================

    ngo.impactImages = [
      ...existingImpactImages,
      ...uploadedImages,
    ].slice(0, 20);

    // ===================================================
    // SAVE
    // ===================================================

    await ngo.save();

    // ===================================================
    // RESPONSE
    // ===================================================

    return res.status(200).json({
      message:
        "NGO public profile updated successfully.",

      ngo: {
        _id: ngo._id,

        name:
          ngo.name,

        organizationName:
          ngo.organizationName,

        ngoCategory:
          ngo.ngoCategory,

        profileImage:
          ngo.profileImage,

        city:
          ngo.city,

        state:
          ngo.state,

        bio:
          ngo.bio,

        ngoMission:
          ngo.ngoMission,

        ngoVision:
          ngo.ngoVision,

        ngoAbout:
          ngo.ngoAbout,

        ngoImpact:
          ngo.ngoImpact,

        peopleHelped:
          ngo.peopleHelped,

        projectsCompleted:
          ngo.projectsCompleted,

        yearsOfService:
          ngo.yearsOfService,

        achievements:
          ngo.achievements,

        impactImages:
          ngo.impactImages,

        website:
          ngo.website,

        facebookUrl:
          ngo.facebookUrl,

        instagramUrl:
          ngo.instagramUrl,

        linkedinUrl:
          ngo.linkedinUrl,
      },
    });

  } catch (error) {
    console.error(
      "Update NGO Public Profile Error:",
      error
    );

    return res.status(500).json({
      message:
        error.message,
    });
  }
};
// =====================================================
// GET MY NGO PUBLIC PROFILE
// NGO ONLY
// =====================================================

// =====================================================
// GET MY NGO PUBLIC PROFILE
// =====================================================

const getMyNGOPublicProfile = async (req, res) => {
  try {
    // =================================================
    // AUTHORIZATION
    // =================================================

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (req.user.role !== "ngo") {
      return res.status(403).json({
        message:
          "Only NGO accounts can view their public profile.",
      });
    }

    // =================================================
    // FIND NGO
    // =================================================

    const ngo = await User.findOne({
      _id: req.user.id,
      role: "ngo",
      isDeleted: false,
    }).select(
      [
        "name",
        "email",
        "phone",
        "address",
        "city",
        "state",
        "pincode",

        "organizationName",
        "organizationCategory",
        "ngoCategory",

        "profileImage",
        "bio",

        "createdAt",

        // Public profile
        "ngoMission",
        "ngoVision",
        "ngoAbout",
        "ngoImpact",

        // Impact statistics
        "peopleHelped",
        "projectsCompleted",
        "yearsOfService",

        // Achievements
        "achievements",

        // Impact gallery
        "impactImages",

        // Links
        "website",
        "facebookUrl",
        "instagramUrl",
        "linkedinUrl",
      ].join(" ")
    );

    if (!ngo) {
      return res.status(404).json({
        message: "NGO account not found.",
      });
    }

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json(ngo);

  } catch (error) {
    console.error(
      "Get My NGO Public Profile Error:",
      error
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================================
// GET MY NGO PAYMENT DETAILS
// =====================================================

const getMyNGOPaymentDetails = async (
  req,
  res
) => {
  try {
    // =================================================
    // AUTHORIZATION
    // =================================================

    if (!req.user) {
      return res.status(401).json({
        message:
          "Authentication required.",
      });
    }

    if (req.user.role !== "ngo") {
      return res.status(403).json({
        message:
          "Only NGO accounts can access payment details.",
      });
    }

    // =================================================
    // FIND NGO
    // =================================================

    const ngo =
      await User.findById(
        req.user.id
      ).select(
        "paymentDetails organizationName name"
      );

    if (!ngo) {
      return res.status(404).json({
        message:
          "NGO account not found.",
      });
    }

    // =================================================
    // ACCOUNT STATUS
    // =================================================

    if (ngo.isDeleted) {
      return res.status(403).json({
        message:
          "This NGO account has been deleted.",
      });
    }

    if (ngo.isBlocked) {
      return res.status(403).json({
        message:
          "This NGO account is currently blocked.",
      });
    }

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      organizationName:
        ngo.organizationName ||
        ngo.name,

      paymentDetails:
        ngo.paymentDetails || {
          accountHolderName: "",
          bankName: "",
          accountNumber: "",
          ifscCode: "",
          accountType: "",
          upiId: "",
          verificationStatus:
            "not_submitted",
          rejectionReason: "",
          verifiedAt: null,
          verifiedBy: null,
        },
    });

  } catch (error) {
    console.error(
      "Get NGO Payment Details Error:",
      error
    );

    return res.status(500).json({
      message:
        error.message,
    });
  }
};
// =====================================================
// UPDATE NGO PAYMENT DETAILS
// =====================================================

const updateNGOPaymentDetails = async (
  req,
  res
) => {
  try {
    // =================================================
    // AUTHORIZATION
    // =================================================

    if (!req.user) {
      return res.status(401).json({
        message:
          "Authentication required.",
      });
    }

    if (req.user.role !== "ngo") {
      return res.status(403).json({
        message:
          "Only NGO accounts can update payment details.",
      });
    }

    // =================================================
    // FIND NGO
    // =================================================

    const ngo =
      await User.findById(
        req.user.id
      );

    if (!ngo) {
      return res.status(404).json({
        message:
          "NGO account not found.",
      });
    }

    // =================================================
    // ACCOUNT STATUS
    // =================================================

    if (ngo.isDeleted) {
      return res.status(403).json({
        message:
          "This NGO account has been deleted.",
      });
    }

    if (ngo.isBlocked) {
      return res.status(403).json({
        message:
          "This NGO account is currently blocked.",
      });
    }

    // =================================================
    // GET INPUT
    // =================================================

    let {
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      accountType,
      upiId,
    } = req.body;

    // =================================================
    // NORMALIZE
    // =================================================

    accountHolderName =
      String(
        accountHolderName || ""
      ).trim();

    bankName =
      String(
        bankName || ""
      ).trim();

    accountNumber =
      String(
        accountNumber || ""
      ).trim();

    ifscCode =
      String(
        ifscCode || ""
      )
        .trim()
        .toUpperCase();

    accountType =
      String(
        accountType || ""
      )
        .trim()
        .toLowerCase();

    upiId =
      String(
        upiId || ""
      ).trim();

    // =================================================
    // REQUIRED BANK DETAILS
    // =================================================

    if (!accountHolderName) {
      return res.status(400).json({
        message:
          "Account holder name is required.",
      });
    }

    if (!bankName) {
      return res.status(400).json({
        message:
          "Bank name is required.",
      });
    }

    if (!accountNumber) {
      return res.status(400).json({
        message:
          "Account number is required.",
      });
    }

    if (!ifscCode) {
      return res.status(400).json({
        message:
          "IFSC code is required.",
      });
    }

    if (!accountType) {
      return res.status(400).json({
        message:
          "Account type is required.",
      });
    }

    // =================================================
    // ACCOUNT TYPE
    // =================================================

    const allowedAccountTypes = [
      "savings",
      "current",
    ];

    if (
      !allowedAccountTypes.includes(
        accountType
      )
    ) {
      return res.status(400).json({
        message:
          "Account type must be savings or current.",
      });
    }

    // =================================================
    // ACCOUNT NUMBER VALIDATION
    // =================================================

    /*
      Basic validation only.

      We are not storing spaces or separators.
    */

    if (
      !/^\d{8,20}$/.test(
        accountNumber
      )
    ) {
      return res.status(400).json({
        message:
          "Please enter a valid bank account number.",
      });
    }

    // =================================================
    // IFSC VALIDATION
    // =================================================

    /*
      Standard Indian IFSC structure:

      4 letters
      0
      6 alphanumeric characters
    */

    if (
      !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
        ifscCode
      )
    ) {
      return res.status(400).json({
        message:
          "Please enter a valid IFSC code.",
      });
    }

    // =================================================
    // UPI VALIDATION
    // =================================================

    if (upiId) {
      if (
        !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+$/.test(
          upiId
        )
      ) {
        return res.status(400).json({
          message:
            "Please enter a valid UPI ID.",
        });
      }
    }

    // =================================================
    // CHECK WHETHER DETAILS CHANGED
    // =================================================

    const oldDetails =
      ngo.paymentDetails || {};

    const detailsChanged =
      oldDetails.accountHolderName !==
        accountHolderName ||
      oldDetails.bankName !==
        bankName ||
      oldDetails.accountNumber !==
        accountNumber ||
      oldDetails.ifscCode !==
        ifscCode ||
      oldDetails.accountType !==
        accountType ||
      oldDetails.upiId !==
        upiId;

    // =================================================
    // SAVE PAYMENT DETAILS
    // =================================================

    ngo.paymentDetails = {
      accountHolderName,

      bankName,

      accountNumber,

      ifscCode,

      accountType,

      upiId,

      /*
        Any new or changed banking details
        must go through admin verification again.
      */

      verificationStatus:
        detailsChanged
          ? "pending"
          : oldDetails
              .verificationStatus ||
            "pending",

      rejectionReason:
        detailsChanged
          ? ""
          : oldDetails
              .rejectionReason ||
            "",

      verifiedAt:
        detailsChanged
          ? null
          : oldDetails
              .verifiedAt ||
            null,

      verifiedBy:
        detailsChanged
          ? null
          : oldDetails
              .verifiedBy ||
            null,
    };

    await ngo.save();

    // =================================================
    // DEBUG
    // =================================================

    console.log(
      "===================================="
    );

    console.log(
      "NGO PAYMENT DETAILS UPDATED"
    );

    console.log(
      "NGO ID:",
      ngo._id
    );

    console.log(
      "NGO:",
      ngo.organizationName ||
        ngo.name
    );

    console.log(
      "BANK:",
      ngo.paymentDetails.bankName
    );

    console.log(
      "IFSC:",
      ngo.paymentDetails.ifscCode
    );

    console.log(
      "VERIFICATION STATUS:",
      ngo.paymentDetails
        .verificationStatus
    );

    console.log(
      "===================================="
    );

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      message:
        detailsChanged
          ? "Payment details submitted for admin verification."
          : "Payment details saved successfully.",

      paymentDetails: {
        accountHolderName:
          ngo.paymentDetails
            .accountHolderName,

        bankName:
          ngo.paymentDetails.bankName,

        /*
          For the NGO's own dashboard we can
          return the full account number.

          We will NEVER return this from
          the public NGO endpoint.
        */

        accountNumber:
          ngo.paymentDetails
            .accountNumber,

        ifscCode:
          ngo.paymentDetails.ifscCode,

        accountType:
          ngo.paymentDetails.accountType,

        upiId:
          ngo.paymentDetails.upiId,

        verificationStatus:
          ngo.paymentDetails
            .verificationStatus,

        rejectionReason:
          ngo.paymentDetails
            .rejectionReason,

        verifiedAt:
          ngo.paymentDetails
            .verifiedAt,

        verifiedBy:
          ngo.paymentDetails
            .verifiedBy,
      },
    });

  } catch (error) {
    console.error(
      "Update NGO Payment Details Error:",
      error
    );

    return res.status(500).json({
      message:
        error.message,
    });
  }
};
// =====================================================
// ADMIN - GET NGO PAYMENT VERIFICATIONS
// =====================================================

const getNGOPaymentVerifications = async (req, res) => {
  try {

    const ngos = await User.find({
      role: "ngo",
      "paymentDetails.verificationStatus": "pending",
      isDeleted: false,
    })
      .select(
        "name organizationName email phone paymentDetails createdAt"
      )
      .sort({
        updatedAt: -1,
      });

    res.status(200).json(ngos);

  } catch (error) {

    console.error(
      "Get NGO Payment Verifications Error:",
      error
    );

    res.status(500).json({
      message: error.message,
    });

  }
};


// =====================================================
// ADMIN - VERIFY NGO PAYMENT DETAILS
// =====================================================

const verifyNGOPaymentDetails = async (req, res) => {
  try {

    const ngo = await User.findOne({
      _id: req.params.id,
      role: "ngo",
      isDeleted: false,
    });

    if (!ngo) {
      return res.status(404).json({
        message: "NGO not found.",
      });
    }

    if (
      !ngo.paymentDetails ||
      ngo.paymentDetails.verificationStatus !== "pending"
    ) {
      return res.status(400).json({
        message:
          "This NGO does not have payment details pending verification.",
      });
    }

    ngo.paymentDetails.verificationStatus =
      "verified";

    ngo.paymentDetails.rejectionReason = "";

    ngo.paymentDetails.verifiedAt =
      new Date();

    ngo.paymentDetails.verifiedBy =
      req.user.id;

    await ngo.save();

    res.status(200).json({
      message:
        "NGO payment details verified successfully.",
      paymentDetails:
        ngo.paymentDetails,
    });

  } catch (error) {

    console.error(
      "Verify NGO Payment Details Error:",
      error
    );

    res.status(500).json({
      message: error.message,
    });

  }
};


// =====================================================
// ADMIN - REJECT NGO PAYMENT DETAILS
// =====================================================

const rejectNGOPaymentDetails = async (req, res) => {
  try {

    const { rejectionReason } = req.body;

    if (
      !rejectionReason ||
      !rejectionReason.trim()
    ) {
      return res.status(400).json({
        message:
          "Rejection reason is required.",
      });
    }

    const ngo = await User.findOne({
      _id: req.params.id,
      role: "ngo",
      isDeleted: false,
    });

    if (!ngo) {
      return res.status(404).json({
        message: "NGO not found.",
      });
    }

    if (
      !ngo.paymentDetails ||
      ngo.paymentDetails.verificationStatus !== "pending"
    ) {
      return res.status(400).json({
        message:
          "This NGO does not have payment details pending verification.",
      });
    }

    ngo.paymentDetails.verificationStatus =
      "rejected";

    ngo.paymentDetails.rejectionReason =
      rejectionReason.trim();

    ngo.paymentDetails.verifiedAt =
      null;

    ngo.paymentDetails.verifiedBy =
      null;

    await ngo.save();

    res.status(200).json({
      message:
        "NGO payment details rejected successfully.",
      paymentDetails:
        ngo.paymentDetails,
    });

  } catch (error) {

    console.error(
      "Reject NGO Payment Details Error:",
      error
    );

    res.status(500).json({
      message: error.message,
    });

  }
};
module.exports = {

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
  updateNGOPaymentDetails,
  getMyNGOPaymentDetails,
  getNGOPaymentVerifications,
  verifyNGOPaymentDetails,
  rejectNGOPaymentDetails,
};