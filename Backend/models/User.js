const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // =====================================================
    // BASIC USER INFORMATION
    // =====================================================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    gender: {
  type: String,
  enum: ["male", "female", "other"],
  default: null,
  trim: true,
},


    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
    },

    // =====================================================
    // ROLE
    // =====================================================

    role: {
      type: String,
      enum: ["donor", "ngo", "volunteer", "admin"],
      default: "donor",
    },

    // =====================================================
    // ACCOUNT STATUS
    // =====================================================

    isApproved: {
      type: Boolean,
      default: false,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    // =====================================================
    // DONOR INFORMATION
    // =====================================================

    donorType: {
      type: String,
      enum: ["individual", "organization"],
      default: "individual",
    },

    // =====================================================
    // ORGANIZATION INFORMATION
    // Used by Donor / NGO
    // =====================================================

    organizationName: {
      type: String,
      default: "",
      trim: true,
    },

    organizationCategory: {
      type: String,
      default: "",
      trim: true,
    },

    gstNumber: {
      type: String,
      default: "",
      trim: true,
    },

    gstCertificate: {
      type: String,
      default: "",
    },

    // =====================================================
    // NGO INFORMATION
    // =====================================================

    ngoCategory: {
      type: String,
      default: "",
      trim: true,
    },

    registrationCertificate: {
      type: String,
      default: "",
    },

    governmentIdImage: {
      type: String,
      default: "",
    },

    // =====================================================
    // NGO PUBLIC PROFILE / IMPACT
    // =====================================================

    // Short mission statement
    ngoMission: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    // Long-term vision
    ngoVision: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    // Detailed NGO introduction
    ngoAbout: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2500,
    },

    // Social impact / work done by NGO
    ngoImpact: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2500,
    },

    // Number of people helped
    peopleHelped: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Number of projects completed
    projectsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Number of years serving society
    yearsOfService: {
      type: Number,
      default: 0,
      min: 0,
    },

    // NGO achievements
    achievements: {
      type: [String],
      default: [],
    },

    // Photos showing NGO work / impact
    impactImages: {
      type: [String],
      default: [],
    },

    // =====================================================
    // NGO ONLINE PRESENCE
    // =====================================================

    website: {
      type: String,
      default: "",
      trim: true,
    },

    facebookUrl: {
      type: String,
      default: "",
      trim: true,
    },

    instagramUrl: {
      type: String,
      default: "",
      trim: true,
    },

    linkedinUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // VOLUNTEER / VEHICLE INFORMATION
    // =====================================================

    vehicleType: {
      type: String,
      default: "",
      trim: true,
    },
    vehicleImage: {
  type: String,
  default: "",
},

    vehicleNumber: {
      type: String,
      default: "",
      trim: true,
    },

    licenseNumber: {
      type: String,
      default: "",
      trim: true,
    },

    vehicleCapacity: {
      type: String,
      default: "",
      trim: true,
    },

    availability: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // VOLUNTEER DOCUMENTS
    // =====================================================

    licenseImage: {
      type: String,
      default: "",
    },

    vehicleRCImage: {
      type: String,
      default: "",
    },

    // =====================================================
    // PROFILE
    // =====================================================

    profileImage: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
      trim: true,
    },
    // =====================================================
// NGO PAYMENT DETAILS
// =====================================================

paymentDetails: {
  accountHolderName: {
    type: String,
    default: "",
    trim: true,
  },

  bankName: {
    type: String,
    default: "",
    trim: true,
  },

  accountNumber: {
    type: String,
    default: "",
    trim: true,
  },

  ifscCode: {
    type: String,
    default: "",
    trim: true,
    uppercase: true,
  },

  accountType: {
    type: String,
    enum: [
      "",
      "savings",
      "current",
    ],
    default: "",
  },

  upiId: {
    type: String,
    default: "",
    trim: true,
  },

  // -----------------------------------------------
  // VERIFICATION
  // -----------------------------------------------

  verificationStatus: {
    type: String,
    enum: [
      "not_submitted",
      "pending",
      "verified",
      "rejected",
    ],
    default: "not_submitted",
  },

  rejectionReason: {
    type: String,
    default: "",
    trim: true,
  },

  verifiedAt: {
    type: Date,
    default: null,
  },

  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
},
  },
  
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);