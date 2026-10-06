const mongoose = require("mongoose");

// ======================================================
// CONSTANTS
// ======================================================

const DONATION_CATEGORIES = [
  "food",
  "clothing",
  "toys",
  "medicine",
  "books",
  "household",
  "electronics",
  "other",
];

const DONATION_UNITS = [
  "pieces",
  "kg",
  "liters",
  "boxes",
  "sets",
];

const DONATION_CONDITIONS = [
  "New",
  "Good",
  "Fair",
];

// ======================================================
// DONATION CATEGORY ITEM SCHEMA
// ======================================================

const donationCategorySchema = new mongoose.Schema(
  {
    // ==================================================
    // ITEM NAME
    // ==================================================

    /*
      Example:
      Rice
      Blankets
      First Aid Kits
      School Books
    */

    itemName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // ==================================================
    // CATEGORY
    // ==================================================

    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      enum: DONATION_CATEGORIES,
    },

    // ==================================================
    // CUSTOM CATEGORY
    // ==================================================

    /*
      Used only when:
      category = "other"
    */

    customCategory: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    // ==================================================
    // QUANTITY
    // ==================================================

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // ==================================================
    // UNIT
    // ==================================================

    unit: {
      type: String,
      enum: DONATION_UNITS,
      default: "pieces",
    },

    // ==================================================
    // CONDITION
    // ==================================================

    condition: {
      type: String,
      enum: DONATION_CONDITIONS,
      default: "Good",
    },

    // ==================================================
    // CAMPAIGN REQUIREMENT
    // ==================================================

    /*
      For normal donations:
      null

      For campaign donations:
      stores the exact campaign requirement
      this category/item belongs to.
    */

    campaignRequirement: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    _id: true,
  }
);

// ======================================================
// MAIN DONATION SCHEMA
// ======================================================

const donationSchema = new mongoose.Schema(
  {
    // ==================================================
    // DONOR
    // ==================================================

    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==================================================
    // TARGET NGO
    // ==================================================

    /*
      Direct NGO Donation:

      null
        =
      Normal/public donation.

      NGO ObjectId
        =
      Donation is intentionally given
      to this specific NGO.

      Example:

      donor   = Donor A
      targetNGO = Hope Foundation

      Only Hope Foundation should be allowed
      to see/request this direct donation.
    */

    targetNGO: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // ==================================================
    // DONATION TITLE
    // ==================================================

    /*
      Example:
      "Winter Relief Package"
      "School Support Donation"
      "Flood Relief Materials"
    */

    donationName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    // ==================================================
    // MULTIPLE DONATION CATEGORIES / ITEMS
    // ==================================================

    /*
      Example:

      categories: [
        {
          itemName: "Rice",
          category: "food",
          quantity: 20,
          unit: "kg",
          condition: "Good"
        },
        {
          itemName: "Blankets",
          category: "clothing",
          quantity: 15,
          unit: "pieces",
          condition: "Good"
        },
        {
          itemName: "School Books",
          category: "books",
          quantity: 30,
          unit: "pieces",
          condition: "New"
        }
      ]
    */

    categories: {
      type: [donationCategorySchema],

      validate: {
        validator: function (categories) {
          return (
            Array.isArray(categories) &&
            categories.length > 0
          );
        },

        message:
          "A donation must contain at least one category.",
      },
    },

    // ==================================================
    // DESCRIPTION
    // ==================================================

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    // ==================================================
    // DONATION IMAGES
    // ==================================================

    /*
      Images belong to the complete donation.
    */

    itemImages: {
      type: [String],
      default: [],
    },

    // ==================================================
    // DONATION STATUS
    // ==================================================

    status: {
      type: String,

      enum: [
        "available",
        "requested",
        "approved",
        "picked_up",
        "delivered",
        "completed",
        "expired",
      ],

      default: "available",
    },

    // ==================================================
    // AVAILABILITY
    // ==================================================

    availableFrom: {
      type: Date,
      required: true,
    },

    availableUntil: {
      type: Date,
      required: true,
    },

    // ==================================================
    // EXPIRY
    // ==================================================

    isExpired: {
      type: Boolean,
      default: false,
    },

    // ==================================================
    // DELIVERY METHODS
    // ==================================================

    allowedDeliveryMethods: {
      type: [
        {
          type: String,

          enum: [
            "volunteer",
            "donor_self",
            "ngo_pickup",
          ],
        },
      ],

      default: ["volunteer"],
    },

    // ==================================================
    // PICKUP PROOF
    // ==================================================

    pickupProofImage: {
      type: String,
      default: "",
    },

    // ==================================================
    // DELIVERY PROOF
    // ==================================================

    deliveryProofImage: {
      type: String,
      default: "",
    },

    // ==================================================
    // PICKUP TIMESTAMP
    // ==================================================

    pickedUpAt: {
      type: Date,
      default: null,
    },

    // ==================================================
    // DELIVERY TIMESTAMP
    // ==================================================

    deliveredAt: {
      type: Date,
      default: null,
    },

    // ==================================================
    // CAMPAIGN
    // ==================================================

    /*
      Null for normal donations.

      Set when this donation belongs
      to a campaign.
    */

    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      default: null,
    },

    // ==================================================
    // CAMPAIGN REQUIREMENT
    // ==================================================

    /*
      Kept at donation level for compatibility
      with the existing campaign/request flow.

      For multi-category donations, the exact
      requirement can also be stored on each
      category item above.
    */

    campaignRequirement: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ======================================================
// INDEXES
// ======================================================

/*
  Useful when fetching direct NGO donations.

  Example:
  {
    targetNGO: ngoId,
    status: "available"
  }
*/

donationSchema.index({
  targetNGO: 1,
  status: 1,
});

donationSchema.index({
  donor: 1,
  createdAt: -1,
});

// ======================================================
// VIRTUAL: NUMBER OF CATEGORIES
// ======================================================

donationSchema.virtual(
  "categoryCount"
).get(function () {
  return Array.isArray(this.categories)
    ? this.categories.length
    : 0;
});

// ======================================================
// VIRTUAL: CATEGORY NAMES
// ======================================================

donationSchema.virtual(
  "categoryNames"
).get(function () {
  if (!Array.isArray(this.categories)) {
    return [];
  }

  return this.categories.map((item) => {
    if (
      item.category === "other" &&
      item.customCategory
    ) {
      return item.customCategory;
    }

    return item.category;
  });
});

// ======================================================
// VIRTUAL: ITEM NAMES
// ======================================================

donationSchema.virtual(
  "itemNames"
).get(function () {
  if (!Array.isArray(this.categories)) {
    return [];
  }

  return this.categories.map(
    (item) => item.itemName
  );
});

// ======================================================
// VIRTUAL: QUANTITY BY UNIT
// ======================================================

/*
  Example:

  categories:

    Rice       20 kg
    Blankets   10 pieces
    Books      30 pieces

  Result:

  {
    kg: 20,
    pieces: 40
  }

  Quantities with different units are
  therefore not incorrectly combined.
*/

donationSchema.virtual(
  "quantityByUnit"
).get(function () {
  if (!Array.isArray(this.categories)) {
    return {};
  }

  return this.categories.reduce(
    (result, item) => {
      const unit = item.unit;

      if (!result[unit]) {
        result[unit] = 0;
      }

      result[unit] += Number(
        item.quantity || 0
      );

      return result;
    },
    {}
  );
});

// ======================================================
// VIRTUAL: DISPLAY SUMMARY
// ======================================================

/*
  Useful for frontend/admin display.
*/

donationSchema.virtual(
  "displaySummary"
).get(function () {
  if (!Array.isArray(this.categories)) {
    return [];
  }

  return this.categories.map(
    (item) => ({
      itemName: item.itemName,

      category:
        item.category === "other" &&
        item.customCategory
          ? item.customCategory
          : item.category,

      quantity: item.quantity,

      unit: item.unit,

      condition: item.condition,
    })
  );
});

// ======================================================
// INCLUDE VIRTUALS IN JSON
// ======================================================

donationSchema.set(
  "toJSON",
  {
    virtuals: true,
  }
);

// ======================================================
// INCLUDE VIRTUALS IN OBJECT
// ======================================================

donationSchema.set(
  "toObject",
  {
    virtuals: true,
  }
);

// ======================================================
// MODEL
// ======================================================

module.exports = mongoose.model(
  "Donation",
  donationSchema
);