const mongoose = require("mongoose");

// ======================================================
// CONSTANTS
// ======================================================

const CAMPAIGN_CATEGORIES = [
  "food",
  "clothing",
  "toys",
  "medicine",
  "books",
  "household",
  "electronics",
  "other",
];

const REQUIREMENT_UNITS = [
  "kg",
  "pieces",
  "boxes",
  "liters",
  "sets",
];

const CAMPAIGN_DURATIONS = [
  5,
  7,
  14,
  30,
];

// ======================================================
// CAMPAIGN REQUIREMENT SCHEMA
// ======================================================

const campaignRequirementSchema = new mongoose.Schema(
  {
    // ==========================================
    // ITEM NAME
    // ==========================================

    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    // ==========================================
    // REQUIREMENT CATEGORY
    // ==========================================

    category: {
      type: String,
      enum: CAMPAIGN_CATEGORIES,
      required: true,
    },

    // ==========================================
    // TARGET QUANTITY
    // ==========================================

    goalQuantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // ==========================================
    // CURRENTLY COLLECTED
    // ==========================================

    currentQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==========================================
    // UNIT
    // ==========================================

    unit: {
      type: String,
      enum: REQUIREMENT_UNITS,
      default: "pieces",
    },
  },
  {
    _id: true,
  }
);

// ======================================================
// REQUIREMENT PROGRESS
// ======================================================

campaignRequirementSchema.virtual("progress").get(function () {
  const goal = Number(this.goalQuantity || 0);
  const current = Number(this.currentQuantity || 0);

  if (goal <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((current / goal) * 100)
  );
});

// ======================================================
// REQUIREMENT REMAINING
// ======================================================

campaignRequirementSchema.virtual("remaining").get(function () {
  const goal = Number(this.goalQuantity || 0);
  const current = Number(this.currentQuantity || 0);

  return Math.max(
    0,
    goal - current
  );
});

// ======================================================
// REQUIREMENT COMPLETION
// ======================================================

campaignRequirementSchema.virtual("completed").get(function () {
  return (
    Number(this.currentQuantity || 0) >=
    Number(this.goalQuantity || 0)
  );
});

// ======================================================
// CAMPAIGN SCHEMA
// ======================================================

const campaignSchema = new mongoose.Schema(
  {
    // ==================================================
    // NGO
    // ==================================================

    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==================================================
    // BASIC INFORMATION
    // ==================================================

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    // ==================================================
    // CAMPAIGN CATEGORIES
    //
    // Example:
    // categories: ["food"]
    //
    // The frontend currently selects one category.
    // We store it as an array so the model can support
    // multiple categories in the future.
    // ==================================================

    categories: {
      type: [
        {
          type: String,
          enum: CAMPAIGN_CATEGORIES,
        },
      ],

      required: true,

      validate: {
        validator: function (value) {
          return (
            Array.isArray(value) &&
            value.length > 0
          );
        },

        message:
          "A campaign must have at least one category.",
      },
    },

    // ==================================================
    // CAMPAIGN REQUIREMENTS
    //
    // Every requirement MUST contain its own category.
    //
    // Example:
    //
    // {
    //   itemName: "Rice",
    //   category: "food",
    //   goalQuantity: 100,
    //   currentQuantity: 20,
    //   unit: "kg"
    // }
    //
    // ==================================================

    requirements: {
      type: [
        campaignRequirementSchema,
      ],

      validate: {
        validator: function (requirements) {
          return (
            Array.isArray(requirements) &&
            requirements.length > 0
          );
        },

        message:
          "A campaign must have at least one requirement.",
      },
    },

    // ==================================================
    // SUPPORTERS
    // ==================================================

    supporters: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==================================================
    // CAMPAIGN IMAGES
    //
    // Maximum of 5 images will be enforced by the
    // controller/frontend.
    //
    // Example:
    //
    // [
    //   "campaign-image-1.jpg",
    //   "campaign-image-2.jpg"
    // ]
    //
    // ==================================================

    campaignImages: [
      {
        type: String,
        trim: true,
      },
    ],

    // ==================================================
    // CAMPAIGN DURATION
    // ==================================================

    duration: {
      type: Number,
      enum: CAMPAIGN_DURATIONS,
      required: true,
    },

    // ==================================================
    // DATES
    // ==================================================

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    // ==================================================
    // STATUS
    // ==================================================

    status: {
      type: String,

      enum: [
        "pending",
        "active",
        "completed",
        "expired",
        "rejected",
      ],

      default: "pending",
    },

    // ==================================================
    // APPROVAL
    // ==================================================

    isApproved: {
      type: Boolean,
      default: false,
    },

    // ==================================================
    // IMPACT REPORT
    // ==================================================

    impactTitle: {
      type: String,
      default: "",
      trim: true,
    },

    impactDescription: {
      type: String,
      default: "",
      trim: true,
    },

    impactImage: {
      type: String,
      default: "",
      trim: true,
    },
  },

  {
    timestamps: true,
  }
);

// ======================================================
// OVERALL CAMPAIGN PROGRESS
// ======================================================

campaignSchema.virtual("progress").get(function () {
  if (
    !this.requirements ||
    this.requirements.length === 0
  ) {
    return 0;
  }

  const totalGoal =
    this.requirements.reduce(
      (total, requirement) =>
        total +
        Number(
          requirement.goalQuantity || 0
        ),
      0
    );

  const totalCollected =
    this.requirements.reduce(
      (total, requirement) =>
        total +
        Number(
          requirement.currentQuantity || 0
        ),
      0
    );

  if (totalGoal <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (totalCollected / totalGoal) * 100
    )
  );
});

// ======================================================
// TOTAL GOAL QUANTITY
// ======================================================

campaignSchema.virtual(
  "totalGoalQuantity"
).get(function () {
  if (!this.requirements) {
    return 0;
  }

  return this.requirements.reduce(
    (total, requirement) =>
      total +
      Number(
        requirement.goalQuantity || 0
      ),
    0
  );
});

// ======================================================
// TOTAL CURRENT QUANTITY
// ======================================================

campaignSchema.virtual(
  "totalCurrentQuantity"
).get(function () {
  if (!this.requirements) {
    return 0;
  }

  return this.requirements.reduce(
    (total, requirement) =>
      total +
      Number(
        requirement.currentQuantity || 0
      ),
    0
  );
});

// ======================================================
// TOTAL REMAINING QUANTITY
// ======================================================

campaignSchema.virtual(
  "totalRemainingQuantity"
).get(function () {
  const goal =
    this.totalGoalQuantity;

  const current =
    this.totalCurrentQuantity;

  return Math.max(
    0,
    goal - current
  );
});

// ======================================================
// CHECK ALL REQUIREMENTS COMPLETED
// ======================================================

campaignSchema.virtual(
  "allRequirementsCompleted"
).get(function () {
  if (
    !this.requirements ||
    this.requirements.length === 0
  ) {
    return false;
  }

  return this.requirements.every(
    (requirement) =>
      Number(
        requirement.currentQuantity || 0
      ) >=
      Number(
        requirement.goalQuantity || 0
      )
  );
});

// ======================================================
// COMPLETED REQUIREMENTS COUNT
// ======================================================

campaignSchema.virtual(
  "completedRequirementsCount"
).get(function () {
  if (!this.requirements) {
    return 0;
  }

  return this.requirements.filter(
    (requirement) =>
      Number(
        requirement.currentQuantity || 0
      ) >=
      Number(
        requirement.goalQuantity || 0
      )
  ).length;
});

// ======================================================
// REMAINING REQUIREMENTS COUNT
// ======================================================

campaignSchema.virtual(
  "remainingRequirementsCount"
).get(function () {
  if (!this.requirements) {
    return 0;
  }

  return this.requirements.filter(
    (requirement) =>
      Number(
        requirement.currentQuantity || 0
      ) <
      Number(
        requirement.goalQuantity || 0
      )
  ).length;
});

// ======================================================
// INCLUDE VIRTUALS IN JSON
// ======================================================

campaignSchema.set(
  "toJSON",
  {
    virtuals: true,
  }
);

// ======================================================
// INCLUDE VIRTUALS IN OBJECT
// ======================================================

campaignSchema.set(
  "toObject",
  {
    virtuals: true,
  }
);

// ======================================================
// MODEL
// ======================================================

module.exports =
  mongoose.model(
    "Campaign",
    campaignSchema
  );