const Donation = require("../models/Donation");
const mongoose = require("mongoose");
const createAuditLog = require("../utils/createAuditLog");
const sendNotification = require("../utils/sendNotification");
const Campaign = require("../models/Campaign");
const Request = require("../models/Request");
const User = require("../models/User");


// =====================================================
// GET MY DONATIONS
// =====================================================


const getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({
      donor: req.user.id,
    })

      // =================================================
      // CAMPAIGN DETAILS
      // =================================================

      .populate({
        path: "campaign",
        select:
          "title categories status duration startDate endDate requirements",
      })

      // =================================================
      // SORT NEWEST FIRST
      // =================================================

      .sort({
        createdAt: -1,
      });

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json(donations);

  } catch (error) {
    console.error(
      "Get My Donations Error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch your donations.",
      error: error.message,
    });
  }
};
// =====================================================
// CREATE DONATION
// =====================================================
// =====================================================
// CREATE DONATION
// =====================================================



const createDonation = async (req, res) => {
  try {
    let {
      donationName,
      categories,
      description,
      availableFrom,
      availableUntil,
      allowedDeliveryMethods,
      campaignId,
      targetNGO,
    } = req.body;

    console.log(
      "========== CREATE DONATION =========="
    );

    console.log(
      "DONOR:",
      req.user.id
    );

    console.log(
      "TARGET NGO:",
      targetNGO || "NORMAL DONATION"
    );

    console.log(
      "CAMPAIGN ID:",
      campaignId || "NO CAMPAIGN"
    );

    console.log(
      "FILES RECEIVED:",
      req.files
    );

    // =====================================================
    // PARSE CATEGORIES
    // =====================================================

    if (typeof categories === "string") {
      try {
        categories = JSON.parse(
          categories
        );
      } catch (error) {
        return res.status(400).json({
          message:
            "Invalid donation categories.",
        });
      }
    }

    // =====================================================
    // PARSE DELIVERY METHODS
    // =====================================================

    if (
      typeof allowedDeliveryMethods ===
      "string"
    ) {
      try {
        allowedDeliveryMethods =
          JSON.parse(
            allowedDeliveryMethods
          );
      } catch (error) {
        allowedDeliveryMethods = [
          allowedDeliveryMethods,
        ];
      }
    }

    // =====================================================
    // DONATION NAME VALIDATION
    // =====================================================

    if (
      !donationName ||
      !donationName.trim()
    ) {
      return res.status(400).json({
        message:
          "Donation title is required.",
      });
    }

    donationName =
      donationName.trim();

    // =====================================================
    // CATEGORIES VALIDATION
    // =====================================================

    if (
      !Array.isArray(categories) ||
      categories.length === 0
    ) {
      return res.status(400).json({
        message:
          "A donation must contain at least one category.",
      });
    }

    if (categories.length > 8) {
      return res.status(400).json({
        message:
          "A donation can contain a maximum of 8 categories.",
      });
    }

    // =====================================================
    // DELIVERY METHODS VALIDATION
    // =====================================================

    if (
      !Array.isArray(
        allowedDeliveryMethods
      ) ||
      allowedDeliveryMethods.length === 0
    ) {
      return res.status(400).json({
        message:
          "Select at least one delivery method.",
      });
    }

    const allowedDeliveryMethodValues = [
      "volunteer",
      "donor_self",
      "ngo_pickup",
    ];

    for (
      const method of allowedDeliveryMethods
    ) {
      if (
        !allowedDeliveryMethodValues.includes(
          method
        )
      ) {
        return res.status(400).json({
          message:
            `Invalid delivery method: ${method}`,
        });
      }
    }

    // Remove duplicates
    allowedDeliveryMethods = [
      ...new Set(
        allowedDeliveryMethods
      ),
    ];

    // =====================================================
    // DATE VALIDATION
    // =====================================================

    if (
      !availableFrom ||
      !availableUntil
    ) {
      return res.status(400).json({
        message:
          "Available From and Available Until are required.",
      });
    }

    const from =
      new Date(availableFrom);

    const until =
      new Date(availableUntil);

    const now =
      new Date();

    if (
      Number.isNaN(
        from.getTime()
      ) ||
      Number.isNaN(
        until.getTime()
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid date or time selected.",
      });
    }

    if (from < now) {
      return res.status(400).json({
        message:
          "Available From cannot be in the past.",
      });
    }

    if (until <= from) {
      return res.status(400).json({
        message:
          "Available Until must be after Available From.",
      });
    }

    // =====================================================
    // TARGET NGO VALIDATION
    // =====================================================

    let targetNGODocument = null;

    if (targetNGO) {
      // ---------------------------------------------------
      // VALIDATE OBJECT ID
      // ---------------------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          targetNGO
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid target NGO ID.",
        });
      }

      // ---------------------------------------------------
      // TARGET NGO CANNOT BE THE DONOR
      // ---------------------------------------------------

      if (
        targetNGO.toString() ===
        req.user.id.toString()
      ) {
        return res.status(400).json({
          message:
            "You cannot donate directly to your own account.",
        });
      }

      // ---------------------------------------------------
      // FIND APPROVED ACTIVE NGO
      // ---------------------------------------------------

      targetNGODocument =
        await User.findOne({
          _id: targetNGO,

          role: "ngo",

          isApproved: true,

          isBlocked: false,

          isDeleted: false,
        });

      if (!targetNGODocument) {
        return res.status(404).json({
          message:
            "The selected NGO is not available for direct donations.",
        });
      }

      console.log(
        "TARGET NGO FOUND:",
        targetNGODocument._id
      );

      console.log(
        "TARGET NGO NAME:",
        targetNGODocument.organizationName ||
          targetNGODocument.name
      );
    }

    // =====================================================
    // FIND CAMPAIGN
    // =====================================================

    let campaign = null;

    if (campaignId) {
      // ---------------------------------------------------
      // DIRECT NGO + CAMPAIGN CONFLICT
      // ---------------------------------------------------

      if (targetNGODocument) {
        return res.status(400).json({
          message:
            "A direct NGO donation cannot also belong to a campaign.",
        });
      }

      // ---------------------------------------------------
      // FIND CAMPAIGN
      // ---------------------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          campaignId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid campaign ID.",
        });
      }

      campaign =
        await Campaign.findById(
          campaignId
        );

      if (!campaign) {
        return res.status(404).json({
          message:
            "Campaign not found.",
        });
      }

      // ---------------------------------------------------
      // CAMPAIGN STATUS
      // ---------------------------------------------------

      if (
        campaign.status !==
        "active"
      ) {
        return res.status(400).json({
          message:
            "This campaign is not currently active.",
        });
      }

      // ---------------------------------------------------
      // CAMPAIGN REQUIREMENTS
      // ---------------------------------------------------

      if (
        !Array.isArray(
          campaign.requirements
        ) ||
        campaign.requirements.length === 0
      ) {
        return res.status(400).json({
          message:
            "This campaign has no donation requirements.",
        });
      }
    }

    // =====================================================
    // CONSTANTS
    // =====================================================

    const allowedCategories = [
      "food",
      "clothing",
      "toys",
      "medicine",
      "books",
      "household",
      "electronics",
      "other",
    ];

    const allowedUnits = [
      "pieces",
      "kg",
      "liters",
      "boxes",
      "sets",
    ];

    const allowedConditions = [
      "New",
      "Good",
      "Fair",
    ];

    // =====================================================
    // NORMALIZE CATEGORIES
    // =====================================================

    const normalizedCategories = [];

    for (
      let index = 0;
      index < categories.length;
      index++
    ) {
      const item =
        categories[index];

      // ---------------------------------------------------
      // BASIC VALIDATION
      // ---------------------------------------------------

      if (
        !item ||
        !item.category ||
        !item.quantity ||
        !item.unit
      ) {
        return res.status(400).json({
          message:
            `Please complete all fields for category ${
              index + 1
            }.`,
        });
      }

      // ---------------------------------------------------
      // CATEGORY
      // ---------------------------------------------------

      const category =
        String(
          item.category
        )
          .trim()
          .toLowerCase();

      if (
        !allowedCategories.includes(
          category
        )
      ) {
        return res.status(400).json({
          message:
            `Invalid category: ${category}`,
        });
      }

      // ---------------------------------------------------
      // CUSTOM CATEGORY
      // ---------------------------------------------------

      let customCategory =
        "";

      if (
        category ===
        "other"
      ) {
        customCategory =
          String(
            item.customCategory ||
              ""
          ).trim();

        if (!customCategory) {
          return res.status(400).json({
            message:
              `Please specify the custom category for category ${
                index + 1
              }.`,
          });
        }
      }

      // ---------------------------------------------------
      // QUANTITY
      // ---------------------------------------------------

      const quantity =
        Number(
          item.quantity
        );

      if (
        !Number.isFinite(
          quantity
        ) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          message:
            `Invalid quantity for category ${
              index + 1
            }.`,
        });
      }

      // ---------------------------------------------------
      // UNIT
      // ---------------------------------------------------

      const unit =
        String(
          item.unit
        )
          .trim()
          .toLowerCase();

      if (
        !allowedUnits.includes(
          unit
        )
      ) {
        return res.status(400).json({
          message:
            `Invalid unit: ${unit}`,
        });
      }

      // ---------------------------------------------------
      // CONDITION
      // ---------------------------------------------------

      const condition =
        item.condition ||
        "Good";

      if (
        !allowedConditions.includes(
          condition
        )
      ) {
        return res.status(400).json({
          message:
            `Invalid condition: ${condition}`,
        });
      }

      // ===================================================
      // CAMPAIGN VALIDATION
      // ===================================================

      let campaignRequirement =
        null;

      if (campaign) {
        const requirementId =
          item.campaignRequirement;

        if (!requirementId) {
          return res.status(400).json({
            message:
              `Campaign requirement is required for category "${category}".`,
          });
        }

        // -------------------------------------------------
        // FIND REQUIREMENT
        // -------------------------------------------------

        campaignRequirement =
          campaign.requirements.id(
            requirementId
          );

        if (
          !campaignRequirement
        ) {
          return res.status(404).json({
            message:
              `Campaign requirement not found for category "${category}".`,
          });
        }

        // -------------------------------------------------
        // REQUIREMENT UNIT
        // -------------------------------------------------

        if (
          unit !==
          campaignRequirement.unit
        ) {
          return res.status(400).json({
            message:
              `Unit mismatch for category "${category}". The campaign requires ${campaignRequirement.unit}.`,
          });
        }

        // -------------------------------------------------
        // ITEM NAME
        // -------------------------------------------------

        const submittedItemName =
          String(
            item.itemName ||
              ""
          ).trim();

        if (
          !submittedItemName
        ) {
          return res.status(400).json({
            message:
              `Item name is required for campaign category "${category}".`,
          });
        }

        if (
          submittedItemName
            .toLowerCase() !==
          campaignRequirement.itemName
            .trim()
            .toLowerCase()
        ) {
          return res.status(400).json({
            message:
              `Item "${submittedItemName}" does not match the campaign requirement "${campaignRequirement.itemName}".`,
          });
        }

        // -------------------------------------------------
        // REQUIREMENT CURRENT / GOAL
        // -------------------------------------------------

        const currentQuantity =
          Number(
            campaignRequirement.currentQuantity ||
              0
          );

        const goalQuantity =
          Number(
            campaignRequirement.goalQuantity ||
              0
          );

        if (
          currentQuantity >=
          goalQuantity
        ) {
          return res.status(400).json({
            message:
              `The campaign requirement "${campaignRequirement.itemName}" has already been fulfilled.`,
          });
        }

        const remainingQuantity =
          goalQuantity -
          currentQuantity;

        if (
          quantity >
          remainingQuantity
        ) {
          return res.status(400).json({
            message:
              `Quantity for "${submittedItemName}" cannot exceed the remaining campaign requirement of ${remainingQuantity} ${unit}.`,
          });
        }

        // -------------------------------------------------
        // ADD CAMPAIGN ITEM
        // -------------------------------------------------

        normalizedCategories.push({
          itemName:
            submittedItemName,

          category,

          customCategory,

          quantity,

          unit,

          condition,

          campaignRequirement:
            campaignRequirement._id,
        });
      } else {
        // =================================================
        // NORMAL / DIRECT NGO DONATION
        // =================================================

        const itemName =
          String(
            item.itemName ||
              ""
          ).trim();

        if (!itemName) {
          return res.status(400).json({
            message:
              `Item name is required for category ${
                index + 1
              }.`,
          });
        }

        normalizedCategories.push({
          itemName,

          category,

          customCategory,

          quantity,

          unit,

          condition,

          campaignRequirement:
            null,
        });
      }
    }

    // =====================================================
    // PREVENT DUPLICATE CATEGORIES
    // =====================================================

    const categoryKeys =
      normalizedCategories.map(
        (item) =>
          item.category ===
          "other"
            ? `other:${item.customCategory
                .trim()
                .toLowerCase()}`
            : item.category
      );

    const duplicateCategory =
      categoryKeys.find(
        (value, index) =>
          categoryKeys.indexOf(
            value
          ) !== index
      );

    if (duplicateCategory) {
      return res.status(400).json({
        message:
          "The same category cannot be added more than once.",
      });
    }

    // =====================================================
    // IMAGE PATHS
    // =====================================================

    const itemImages =
      req.files
        ? req.files.map(
            (file) =>
              `/uploads/${file.filename}`
          )
        : [];

    console.log(
      "ITEM IMAGES:",
      itemImages
    );

    // =====================================================
    // CREATE DONATION
    // =====================================================

    const donation =
      await Donation.create({
        // -------------------------------------------------
        // DONOR
        // -------------------------------------------------

        donor:
          req.user.id,

        // -------------------------------------------------
        // DIRECT NGO TARGET
        // -------------------------------------------------

        targetNGO:
          targetNGODocument
            ? targetNGODocument._id
            : null,

        // -------------------------------------------------
        // BASIC DONATION DATA
        // -------------------------------------------------

        donationName,

        categories:
          normalizedCategories,

        description:
          description
            ? String(
                description
              ).trim()
            : "",

        itemImages,

        availableFrom:
          from,

        availableUntil:
          until,

        allowedDeliveryMethods,

        // -------------------------------------------------
        // CAMPAIGN
        // -------------------------------------------------

        campaign:
          campaign
            ? campaign._id
            : null,

        campaignRequirement:
          null,

        // -------------------------------------------------
        // STATUS
        // -------------------------------------------------

        status:
          "available",

        isExpired:
          false,
      });

    // =====================================================
    // UPDATE CAMPAIGN SUPPORTERS
    // =====================================================

    if (campaign) {
      try {
        campaign.supporters =
          await Donation.distinct(
            "donor",
            {
              campaign:
                campaign._id,
            }
          ).then(
            (donors) =>
              donors.length
          );

        await campaign.save();
      } catch (
        supporterError
      ) {
        console.error(
          "Supporter count update error:",
          supporterError.message
        );
      }
    }

    // =====================================================
    // CAMPAIGN NOTIFICATION
    // =====================================================

    if (campaign) {
      try {
        const categoryNames =
          normalizedCategories
            .map(
              (item) =>
                item.category ===
                "other"
                  ? item.customCategory
                  : item.category
            )
            .join(", ");

        await sendNotification(
          campaign.ngo,

          "New Campaign Donation",

          `${donationName} containing ${categoryNames} was donated towards "${campaign.title}".`,

          "success"
        );
      } catch (
        notificationError
      ) {
        console.error(
          "Campaign notification error:",
          notificationError.message
        );
      }
    }

    // =====================================================
    // DIRECT NGO NOTIFICATION
    // =====================================================

    if (targetNGODocument) {
      try {
        const categoryNames =
          normalizedCategories
            .map(
              (item) =>
                item.category ===
                "other"
                  ? item.customCategory
                  : item.category
            )
            .join(", ");

        await sendNotification(
          targetNGODocument._id,

          "Direct Donation Received",

          `${donationName} containing ${categoryNames} has been donated specifically to your NGO by a donor.`,

          "success"
        );
      } catch (
        notificationError
      ) {
        console.error(
          "Direct NGO notification error:",
          notificationError.message
        );
      }
    }

    // =====================================================
    // DEBUG
    // =====================================================

    console.log(
      "===================================="
    );

    console.log(
      "NORMALIZED CATEGORIES:",
      normalizedCategories
    );

    console.log(
      "TARGET NGO:",
      donation.targetNGO ||
        "NORMAL DONATION"
    );

    console.log(
      "CAMPAIGN:",
      donation.campaign ||
        "NO CAMPAIGN"
    );

    console.log(
      "DONATION CREATED:",
      donation._id
    );

    console.log(
      "SAVED IMAGES:",
      donation.itemImages
    );

    console.log(
      "===================================="
    );

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(201).json({
      message:
        targetNGODocument
          ? "Donation created specifically for the selected NGO."
          : campaign
          ? "Campaign donation created successfully."
          : "Donation created successfully.",

      donation,
    });

  } catch (error) {
    console.error(
      "Create Donation Error:",
      error
    );

    return res.status(500).json({
      message:
        error.message,
    });
  }
};

// =====================================================
// GET AVAILABLE DONATIONS
// =====================================================

const getDonations = async (req, res) => {
  try {
    const now = new Date();

    // ==================================================
    // BASE FILTER
    // ==================================================

    const baseFilter = {
      status: "available",

      availableFrom: {
        $lte: now,
      },

      availableUntil: {
        $gte: now,
      },

      isExpired: false,
    };

    // ==================================================
    // NGO VISIBILITY
    // ==================================================

    if (req.user.role === "ngo") {
      // =================================================
      // FIND CAMPAIGNS OWNED BY THIS NGO
      // =================================================

      const campaigns = await Campaign.find({
        ngo: req.user.id,
      }).select("_id");

      const campaignIds = campaigns.map(
        (campaign) => campaign._id
      );

      /*
        NGO can see:

        1. NORMAL DONATIONS
           targetNGO = null
           campaign = null

        2. DIRECT NGO DONATIONS
           targetNGO = logged-in NGO

        3. CAMPAIGN DONATIONS
           campaign belongs to logged-in NGO
      */

      baseFilter.$or = [
        // -----------------------------------------------
        // NORMAL PUBLIC DONATION
        // -----------------------------------------------

        {
          targetNGO: null,
          campaign: null,
        },

        // -----------------------------------------------
        // DIRECT DONATION FOR THIS NGO
        // -----------------------------------------------

        {
          targetNGO: req.user.id,
        },

        // -----------------------------------------------
        // CAMPAIGN DONATION FOR THIS NGO
        // -----------------------------------------------

        {
          campaign: {
            $in: campaignIds,
          },
        },
      ];
    }

    // ==================================================
    // GET DONATIONS
    // ==================================================

    const donations =
      await Donation.find(
        baseFilter
      )

        // =================================================
        // DONOR DETAILS
        // =================================================

        .populate(
          "donor",
          "name email phone address city state pincode organizationName organizationCategory donorType profileImage"
        )

        // =================================================
        // TARGET NGO DETAILS
        // =================================================

        .populate(
          "targetNGO",
          "name organizationName ngoCategory email phone city state"
        )

        // =================================================
        // CAMPAIGN DETAILS
        // =================================================

        .populate({
          path: "campaign",
          select:
            "title categories requirements status duration startDate endDate ngo",
        })

        // =================================================
        // SORT NEWEST FIRST
        // =================================================

        .sort({
          createdAt: -1,
        });

    // ==================================================
    // DEBUG
    // ==================================================

    console.log(
      "===================================="
    );

    console.log(
      "AVAILABLE DONATIONS:",
      donations.length
    );

    console.log(
      "REQUESTING USER:",
      req.user.id
    );

    console.log(
      "REQUESTING ROLE:",
      req.user.role
    );

    donations.forEach(
      (donation) => {
        console.log(
          "------------------------------------"
        );

        console.log(
          "DONATION ID:",
          donation._id
        );

        console.log(
          "DONATION NAME:",
          donation.donationName
        );

        console.log(
          "CATEGORIES:",
          donation.categories
        );

        console.log(
          "CATEGORY COUNT:",
          donation.categoryCount
        );

        console.log(
          "CATEGORY NAMES:",
          donation.categoryNames
        );

        console.log(
          "QUANTITY BY UNIT:",
          donation.quantityByUnit
        );

        console.log(
          "ITEM IMAGES:",
          donation.itemImages
        );

        // -----------------------------------------------
        // TARGET NGO
        // -----------------------------------------------

        console.log(
          "TARGET NGO:",
          donation.targetNGO
            ? {
                id:
                  donation.targetNGO._id,

                name:
                  donation.targetNGO.name,

                organizationName:
                  donation.targetNGO
                    .organizationName,
              }
            : "PUBLIC / NORMAL DONATION"
        );

        // -----------------------------------------------
        // CAMPAIGN
        // -----------------------------------------------

        console.log(
          "CAMPAIGN:",
          donation.campaign?.title ||
            "No Campaign"
        );

        // -----------------------------------------------
        // DONOR
        // -----------------------------------------------

        console.log(
          "DONOR:",
          donation.donor?.name ||
            "Unknown Donor"
        );
      }
    );

    console.log(
      "===================================="
    );

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json(
      donations
    );

  } catch (error) {
    console.error(
      "Get Donations Error:",
      error
    );

    return res.status(500).json({
      message:
        error.message,
    });
  }
};

const updateDonation = async (req, res) => {

  try {

    const donation = await Donation.findById(req.params.id);

    if (!donation) {

      return res.status(404).json({
        message: "Donation not found.",
      });

    }

    // Only the donor can edit
    if (donation.donor.toString() !== req.user.id) {

      return res.status(403).json({
        message: "Not authorized.",
      });

    }

    // Donation can only be edited while available
    if (donation.status !== "available") {

      return res.status(400).json({
        message:
          "Only available donations can be edited.",
      });

    }

    const {

      itemName,
      category,
      quantity,
      condition,
      description,
      availableFrom,
      availableUntil,
      allowedDeliveryMethods,

    } = req.body;

    // Required fields
    if (
      !itemName ||
      !category ||
      !quantity ||
      !availableFrom ||
      !availableUntil
    ) {

      return res.status(400).json({
        message: "Please fill all required fields.",
      });

    }
if (
  !allowedDeliveryMethods ||
  !Array.isArray(allowedDeliveryMethods) ||
  allowedDeliveryMethods.length === 0
) {

  return res.status(400).json({

    message:
      "Select at least one delivery method.",

  });

}
    const from = new Date(availableFrom);
    const until = new Date(availableUntil);
    const now = new Date();

    // Invalid dates
    if (
      isNaN(from.getTime()) ||
      isNaN(until.getTime())
    ) {

      return res.status(400).json({
        message: "Invalid date or time.",
      });

    }

    // Cannot edit to a past start time
    if (from < now) {

      return res.status(400).json({
        message:
          "Available From cannot be in the past.",
      });

    }

    // End must be after start
    if (until <= from) {

      return res.status(400).json({
        message:
          "Available Until must be after Available From.",
      });

    }

    donation.itemName = itemName;
    donation.category = category;
    donation.quantity = quantity;
    donation.condition = condition;
    donation.description = description;
    donation.availableFrom = from;
    donation.availableUntil = until;
donation.allowedDeliveryMethods =
allowedDeliveryMethods;
    await donation.save();

    res.json({

      message: "Donation updated successfully.",

      donation,

    });

  } catch (error) {

    console.error(error);

    res.status(500).json({

      message: error.message,

    });

  }

};

const deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(
      req.params.id
    );

    if (!donation) {
      return res.status(404).json({
        message: "Donation not found",
      });
    }

    if (donation.donor.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    await donation.deleteOne();
    await createAuditLog(
  req.user.id,
  "Delete Donation",
  `${donation.itemName} donation deleted`,
  req.user.id,
  donation._id
);

    res.json({
      message: "Donation deleted",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};const getDonorDashboardStats = async (req, res) => {
  try {
    const donorId = req.user.id;

    // =====================================================
    // GET DONOR DONATIONS
    // =====================================================

    const donations = await Donation.find({
      donor: donorId,
    }).sort({
      createdAt: -1,
    });

    const donationIds = donations.map(
      (donation) => donation._id
    );

    // =====================================================
    // GET DONOR REQUESTS
    // =====================================================

    const requests = await Request.find({
      donation: {
        $in: donationIds,
      },
    })
      .populate({
        path: "donation",
        select:
          "itemName category quantity unit status createdAt",
      })
      .populate({
        path: "ngo",
        select:
          "name organizationName ngoCategory",
      })
      .populate({
        path: "assignedVolunteer",
        select:
          "name phone vehicleType vehicleNumber",
      })
      .sort({
        updatedAt: -1,
      });

    // =====================================================
    // TOTAL DONATIONS
    // =====================================================

    const totalDonations =
      donations.length;

    // =====================================================
    // PENDING REQUESTS
    // =====================================================

    const pendingRequests =
      requests.filter(
        (request) =>
          request.status === "pending"
      ).length;

    // =====================================================
    // ACTIVE DELIVERIES
    // =====================================================

    const activeDeliveryStatuses = [
      "pending",
      "volunteer_assigned",
      "volunteer_accepted",
      "picked_up",
      "delivered",
    ];

    const activeDeliveries =
      requests.filter(
        (request) =>
          request.status === "approved" &&
          activeDeliveryStatuses.includes(
            request.deliveryStatus
          )
      ).length;

    // =====================================================
    // COMPLETED DONATIONS
    // =====================================================

    const completedDonations =
      requests.filter(
        (request) =>
          request.deliveryStatus ===
            "received" ||
          request.deliveryStatus ===
            "completed" ||
          request.status ===
            "completed"
      ).length;

    // =====================================================
    // RECENT ACTIVITY
    // =====================================================

    const recentActivity = [];

    // -----------------------------------------------------
    // 1. DONATION CREATED
    // -----------------------------------------------------

    donations.forEach((donation) => {
      recentActivity.push({
        type: "donation_created",

        title: "Donation Created",

        description:
          `You created a donation of ${donation.itemName}.`,

        icon:
          "bi-plus-circle-fill",

        color: "primary",

        createdAt:
          donation.createdAt,

        donationId:
          donation._id,

        itemName:
          donation.itemName,
      });
    });

    // -----------------------------------------------------
    // 2. REQUEST ACTIVITY
    // -----------------------------------------------------

    requests.forEach((request) => {
      const itemName =
        request.donation?.itemName ||
        "your donation";

      const ngoName =
        request.ngo?.organizationName ||
        request.ngo?.name ||
        "an NGO";

      // ===================================================
      // NGO REQUESTED DONATION
      // ===================================================

      recentActivity.push({
        type:
          "request_received",

        title:
          "NGO Request",

        description:
          `${ngoName} requested your ${itemName}.`,

        icon:
          "bi-building",

        color:
          "warning",

        createdAt:
          request.createdAt,

        requestId:
          request._id,

        donationId:
          request.donation?._id,
      });

      // ===================================================
      // APPROVED
      // ===================================================

      if (
        request.status ===
        "approved"
      ) {
        recentActivity.push({
          type:
            "request_approved",

          title:
            "Request Approved",

          description:
            `The request for ${itemName} was approved.`,

          icon:
            "bi-check-circle-fill",

          color:
            "success",

          createdAt:
            request.updatedAt,

          requestId:
            request._id,

          donationId:
            request.donation?._id,
        });
      }

      // ===================================================
      // REJECTED
      // ===================================================

      if (
        request.status ===
        "rejected"
      ) {
        recentActivity.push({
          type:
            "request_rejected",

          title:
            "Request Rejected",

          description:
            `The request for ${itemName} was rejected.`,

          icon:
            "bi-x-circle-fill",

          color:
            "danger",

          createdAt:
            request.updatedAt,

          requestId:
            request._id,

          donationId:
            request.donation?._id,
        });
      }

      // ===================================================
      // VOLUNTEER ASSIGNED
      // ===================================================

      if (
        request.deliveryStatus ===
        "volunteer_assigned"
      ) {
        const volunteerName =
          request.assignedVolunteer?.name ||
          "a volunteer";

        recentActivity.push({
          type:
            "volunteer_assigned",

          title:
            "Volunteer Assigned",

          description:
            `${volunteerName} was assigned to deliver your ${itemName}.`,

          icon:
            "bi-truck",

          color:
            "info",

          createdAt:
            request.updatedAt,

          requestId:
            request._id,

          donationId:
            request.donation?._id,
        });
      }

      // ===================================================
      // VOLUNTEER ACCEPTED
      // ===================================================

      if (
        request.deliveryStatus ===
        "volunteer_accepted"
      ) {
        const volunteerName =
          request.assignedVolunteer?.name ||
          "The volunteer";

        recentActivity.push({
          type:
            "volunteer_accepted",

          title:
            "Volunteer Accepted",

          description:
            `${volunteerName} accepted the delivery of ${itemName}.`,

          icon:
            "bi-person-check-fill",

          color:
            "info",

          createdAt:
            request.updatedAt,

          requestId:
            request._id,

          donationId:
            request.donation?._id,
        });
      }

      // ===================================================
      // PICKED UP
      // ===================================================

      if (
        request.deliveryStatus ===
        "picked_up"
      ) {
        recentActivity.push({
          type:
            "picked_up",

          title:
            "Donation Picked Up",

          description:
            `Your ${itemName} was picked up for delivery.`,

          icon:
            "bi-box-seam-fill",

          color:
            "primary",

          createdAt:
            request.updatedAt,

          requestId:
            request._id,

          donationId:
            request.donation?._id,
        });
      }

      // ===================================================
      // DELIVERED
      // ===================================================

      if (
        request.deliveryStatus ===
        "delivered"
      ) {
        recentActivity.push({
          type:
            "delivered",

          title:
            "Donation Delivered",

          description:
            `Your ${itemName} was delivered to ${ngoName}.`,

          icon:
            "bi-truck",

          color:
            "info",

          createdAt:
            request.updatedAt,

          requestId:
            request._id,

          donationId:
            request.donation?._id,
        });
      }

      // ===================================================
      // RECEIVED / COMPLETED
      // ===================================================

      if (
        request.deliveryStatus ===
          "received" ||
        request.deliveryStatus ===
          "completed" ||
        request.status ===
          "completed"
      ) {
        recentActivity.push({
          type:
            "donation_completed",

          title:
            "Donation Completed",

          description:
            `${ngoName} confirmed receipt of your ${itemName}.`,

          icon:
            "bi-check-circle-fill",

          color:
            "success",

          createdAt:
            request.updatedAt,

          requestId:
            request._id,

          donationId:
            request.donation?._id,
        });
      }
    });

    // =====================================================
    // SORT ACTIVITIES
    // =====================================================

    recentActivity.sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );

    // =====================================================
    // LIMIT TO LATEST 8
    // =====================================================

    const latestActivity =
      recentActivity.slice(
        0,
        8
      );

    // =====================================================
    // DEBUG
    // =====================================================

    console.log(
      "========================================"
    );

    console.log(
      "DONOR DASHBOARD"
    );

    console.log(
      "Donor ID:",
      donorId
    );

    console.log(
      "Total Donations:",
      totalDonations
    );

    console.log(
      "Pending Requests:",
      pendingRequests
    );

    console.log(
      "Active Deliveries:",
      activeDeliveries
    );

    console.log(
      "Completed Donations:",
      completedDonations
    );

    console.log(
      "Recent Activity Count:",
      latestActivity.length
    );

    console.log(
      "Recent Activity:",
      latestActivity
    );

    console.log(
      "========================================"
    );

    // =====================================================
    // RESPONSE
    // =====================================================

    res.status(200).json({
      totalDonations,

      pendingRequests,

      activeDeliveries,

      completedDonations,

      recentActivity:
        latestActivity,
    });

  } catch (error) {
    console.error(
      "Get Donor Dashboard Stats Error:",
      error
    );

    res.status(500).json({
      message:
        error.message,
    });
  }
};
module.exports = {
  createDonation,
  getDonations,
  getMyDonations,
  updateDonation,
  deleteDonation,
  getDonorDashboardStats,
};