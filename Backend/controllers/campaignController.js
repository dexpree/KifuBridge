const Donation = require("../models/Donation");
const User = require("../models/User");
const mongoose = require("mongoose");
const sendNotification = require("../utils/sendNotification");
const createAuditLog = require("../utils/createAuditLog");
const Campaign = require("../models/Campaign");
const Request = require("../models/Request");

// =======================================
// NGO Create Campaign
// =======================================

const createCampaign = async (req, res) => {
  try {
    let {
      title,
      description,
      categories,
      requirements,
      duration,
    } = req.body;

    // ======================================
    // Uploaded Campaign Images
    // Maximum 5 controlled by multer
    // ======================================

    const campaignImages = req.files
      ? req.files.map(
          (file) => `/uploads/${file.filename}`
        )
      : [];

    // ======================================
    // Parse Categories
    // ======================================

    if (categories) {
      try {
        if (typeof categories === "string") {
          categories = JSON.parse(categories);
        }
      } catch (error) {
        return res.status(400).json({
          message: "Invalid campaign categories.",
        });
      }
    }

    // ======================================
    // Parse Requirements
    // ======================================

    if (requirements) {
      try {
        if (typeof requirements === "string") {
          requirements = JSON.parse(requirements);
        }
      } catch (error) {
        return res.status(400).json({
          message: "Invalid campaign requirements.",
        });
      }
    }

    // ======================================
    // Basic Validation
    // ======================================

    if (
      !title ||
      !description ||
      !duration
    ) {
      return res.status(400).json({
        message: "Please fill all required fields.",
      });
    }

    // ======================================
    // Clean Basic Fields
    // ======================================

    title = String(title).trim();
    description = String(description).trim();

    if (!title || !description) {
      return res.status(400).json({
        message:
          "Title and description cannot be empty.",
      });
    }

    // ======================================
    // Categories Validation
    // ======================================

    if (
      !Array.isArray(categories) ||
      categories.length === 0
    ) {
      return res.status(400).json({
        message:
          "Please select at least one campaign category.",
      });
    }

    // ======================================
    // Normalize Categories
    // ======================================

    categories = categories
      .filter(
        (category) =>
          typeof category === "string" &&
          category.trim() !== ""
      )
      .map(
        (category) =>
          category.trim().toLowerCase()
      );

    // ======================================
    // Remove Duplicate Categories
    // ======================================

    categories = [
      ...new Set(categories),
    ];

    // ======================================
    // Check Categories After Cleanup
    // ======================================

    if (categories.length === 0) {
      return res.status(400).json({
        message:
          "Please select at least one valid campaign category.",
      });
    }

    // ======================================
    // Allowed Categories
    // ======================================

    const allowedCategories = [
      "food",
      "clothing",
      "medicine",
      "books",
      "toys",
      "household",
      "electronics",
      "other",
    ];

    // ======================================
    // Validate Campaign Categories
    // ======================================

    const invalidCategories =
      categories.filter(
        (category) =>
          !allowedCategories.includes(category)
      );

    if (invalidCategories.length > 0) {
      return res.status(400).json({
        message:
          `Invalid campaign category: ${invalidCategories.join(
            ", "
          )}`,
      });
    }

    // ======================================
    // Requirements Validation
    // ======================================

    if (
      !Array.isArray(requirements) ||
      requirements.length === 0
    ) {
      return res.status(400).json({
        message:
          "Please add at least one campaign requirement.",
      });
    }

    // ======================================
    // Maximum Requirements
    // ======================================

    if (requirements.length > 10) {
      return res.status(400).json({
        message:
          "A campaign can have a maximum of 10 requirements.",
      });
    }

    // ======================================
    // Validate Each Requirement
    // ======================================

    for (const requirement of requirements) {
      if (!requirement) {
        return res.status(400).json({
          message:
            "Invalid campaign requirement.",
        });
      }

      if (
        !requirement.itemName ||
        !requirement.goalQuantity ||
        !requirement.unit ||
        !requirement.category
      ) {
        return res.status(400).json({
          message:
            "Each campaign requirement must have an item, category, quantity and unit.",
        });
      }

      if (
        Number(requirement.goalQuantity) <= 0
      ) {
        return res.status(400).json({
          message:
            "Requirement quantity must be greater than 0.",
        });
      }
    }

    // ======================================
    // Normalize Requirements
    // ======================================

    requirements = requirements.map(
      (requirement) => {
        const itemName =
          String(
            requirement.itemName
          ).trim();

        const category =
          String(
            requirement.category
          )
            .trim()
            .toLowerCase();

        const unit =
          String(
            requirement.unit
          )
            .trim()
            .toLowerCase();

        const goalQuantity =
          Number(
            requirement.goalQuantity
          );

        // ------------------------------
        // Validate Requirement Category
        // ------------------------------

        if (
          !allowedCategories.includes(
            category
          )
        ) {
          throw new Error(
            `Invalid requirement category: ${category}`
          );
        }

        // ------------------------------
        // Requirement Category
        // Must belong to campaign
        // ------------------------------

        if (
          !categories.includes(category)
        ) {
          throw new Error(
            `Requirement category "${category}" is not included in the campaign categories.`
          );
        }

        // ------------------------------
        // Validate Item Name
        // ------------------------------

        if (!itemName) {
          throw new Error(
            "Requirement item name cannot be empty."
          );
        }

        // ------------------------------
        // Validate Unit
        // ------------------------------

        if (!unit) {
          throw new Error(
            `Unit is required for "${itemName}".`
          );
        }

        // ------------------------------
        // Validate Quantity
        // ------------------------------

        if (
          !Number.isFinite(
            goalQuantity
          ) ||
          goalQuantity <= 0
        ) {
          throw new Error(
            `Requirement quantity for "${itemName}" must be greater than 0.`
          );
        }

        return {
          itemName,
          category,
          goalQuantity,
          currentQuantity: 0,
          unit,
        };
      }
    );

    // ======================================
    // Prevent Duplicate Requirements
    // ======================================

    const requirementKeys =
      requirements.map(
        (requirement) =>
          `${requirement.itemName.toLowerCase()}-${requirement.category}`
      );

    const duplicateRequirements =
      requirementKeys.filter(
        (key, index) =>
          requirementKeys.indexOf(key) !==
          index
      );

    if (
      duplicateRequirements.length > 0
    ) {
      return res.status(400).json({
        message:
          "The same item cannot be added more than once for the same category.",
      });
    }

    // ======================================
    // Normalize Duration
    // ======================================

    const campaignDuration =
      Number(duration);

    if (
      !Number.isFinite(
        campaignDuration
      ) ||
      campaignDuration <= 0
    ) {
      return res.status(400).json({
        message:
          "Campaign duration must be greater than 0.",
      });
    }

    // ======================================
    // Create Campaign
    // ======================================

    const campaign =
      await Campaign.create({
        ngo: req.user.id,

        title,

        description,

        categories,

        requirements,

        duration:
          campaignDuration,

        campaignImages,

        status: "pending",

        isApproved: false,
      });

    // ======================================
    // Response
    // ======================================

    return res.status(201).json({
      message:
        "Campaign created successfully. Waiting for admin approval.",

      campaign,
    });

  } catch (error) {
    console.error(
      "Create Campaign Error:",
      error
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};
// =======================================
// GET CAMPAIGNS
// =======================================
const getCampaigns = async (req, res) => {
  try {
    // ==================================================
    // FETCH CAMPAIGNS
    // ==================================================
    // Used by ADMIN campaign management / approval.
    //
    // Pending campaigns:
    // status = "pending"
    // isApproved = false
    //
    // Approved campaigns:
    // status = "active"
    // isApproved = true
    //
    // Rejected campaigns are excluded.
    // ==================================================

    const campaigns = await Campaign.find({
      status: {
        $ne: "rejected",
      },
    })
      .populate(
        "ngo",
        "name organizationName ngoCategory"
      )
      .sort({
        createdAt: -1,
      });

    const now = new Date();

    const updated = [];

    // ==================================================
    // PROCESS EACH CAMPAIGN
    // ==================================================

    for (const campaign of campaigns) {
      let needsSave = false;

      // ==================================================
      // LEGACY CATEGORY MIGRATION
      // ==================================================

      if (
        !Array.isArray(campaign.categories) ||
        campaign.categories.length === 0
      ) {
        const legacyCategory =
          campaign.category;

        if (
          legacyCategory &&
          typeof legacyCategory === "string"
        ) {
          campaign.categories = [
            legacyCategory
              .trim()
              .toLowerCase(),
          ];
        } else {
          // --------------------------------------------
          // DERIVE CATEGORY FROM REQUIREMENTS
          // --------------------------------------------

          const derivedCategories = [
            ...new Set(
              (campaign.requirements || [])
                .map(
                  (requirement) =>
                    requirement.category
                )
                .filter(Boolean)
                .map((category) =>
                  category
                    .toString()
                    .trim()
                    .toLowerCase()
                )
            ),
          ];

          campaign.categories =
            derivedCategories.length > 0
              ? derivedCategories
              : ["other"];
        }

        needsSave = true;
      }

      // ==================================================
      // LEGACY REQUIREMENT CATEGORY
      // ==================================================

      const campaignDefaultCategory =
        campaign.categories?.[0] ||
        "other";

      if (
        Array.isArray(
          campaign.requirements
        )
      ) {
        for (
          const requirement of
          campaign.requirements
        ) {
          if (!requirement.category) {
            requirement.category =
              campaignDefaultCategory;

            needsSave = true;
          }
        }
      }

      // ==================================================
      // SAVE MIGRATED DATA
      // ==================================================

      if (needsSave) {
        try {
          await campaign.save();
        } catch (migrationError) {
          console.error(
            "Campaign migration failed:",
            campaign._id,
            migrationError.message
          );
        }
      }

      // ==================================================
      // REQUIREMENTS
      // ==================================================

      const requirements =
        Array.isArray(
          campaign.requirements
        )
          ? campaign.requirements
          : [];

      // ==================================================
      // CHECK EXPIRY
      // ==================================================

      if (
        campaign.status === "active" &&
        campaign.endDate &&
        now > campaign.endDate
      ) {
        if (requirements.length > 0) {
          const allRequirementsCompleted =
            requirements.every(
              (requirement) =>
                Number(
                  requirement.currentQuantity || 0
                ) >=
                Number(
                  requirement.goalQuantity || 0
                )
            );

          campaign.status =
            allRequirementsCompleted
              ? "completed"
              : "expired";

          try {
            await campaign.save();
          } catch (saveError) {
            console.error(
              "Campaign expiry update failed:",
              campaign._id,
              saveError.message
            );
          }
        }
      }

      // ==================================================
      // SUPPORTER COUNT
      // ==================================================

      const supporterCount =
        await Donation.distinct(
          "donor",
          {
            campaign: campaign._id,
          }
        );

      // ==================================================
      // CAMPAIGN RESPONSE
      // ==================================================

      updated.push({
        ...campaign.toObject(),

        // ----------------------------------------------
        // Progress
        // ----------------------------------------------

        progress:
          campaign.progress || 0,

        totalGoalQuantity:
          campaign.totalGoalQuantity || 0,

        totalCurrentQuantity:
          campaign.totalCurrentQuantity || 0,

        totalRemainingQuantity:
          campaign.totalRemainingQuantity || 0,

        allRequirementsCompleted:
          campaign.allRequirementsCompleted ||
          false,

        completedRequirementsCount:
          campaign.completedRequirementsCount ||
          0,

        remainingRequirementsCount:
          campaign.remainingRequirementsCount ||
          0,

        // ----------------------------------------------
        // Supporters
        // ----------------------------------------------

        supporters:
          supporterCount.length,
      });
    }

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json(updated);
  } catch (error) {
    console.error(
      "Get Campaigns Error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch campaigns",
      error:
        error.message,
    });
  }
};

const getCampaignById = async (req, res) => {
  try {
    // ==================================================
    // VALIDATE CAMPAIGN ID
    // ==================================================

    if (
      !mongoose.isValidObjectId(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid campaign ID.",
      });
    }

    // ==================================================
    // FIND CAMPAIGN
    // ==================================================

    const campaign =
      await Campaign.findById(
        req.params.id
      ).populate(
        "ngo",
        "name organizationName ngoCategory"
      );

    // ==================================================
    // CAMPAIGN NOT FOUND
    // ==================================================

    if (!campaign) {
      return res.status(404).json({
        message:
          "Campaign not found.",
      });
    }

    // ==================================================
    // DONOR VISIBILITY CHECK
    //
    // Pending/rejected campaigns should not be
    // available through the public campaign details
    // endpoint.
    // ==================================================

    if (
      campaign.status ===
        "pending" ||
      campaign.status ===
        "rejected"
    ) {
      return res.status(404).json({
        message:
          "Campaign is not currently available.",
      });
    }

    // ==================================================
    // LEGACY CATEGORY MIGRATION
    // ==================================================

    let needsSave = false;

    // --------------------------------------------------
    // OLD campaign.category
    // --------------------------------------------------

    if (
      !Array.isArray(
        campaign.categories
      ) ||
      campaign.categories.length === 0
    ) {
      const legacyCategory =
        campaign.category;

      if (
        legacyCategory &&
        typeof legacyCategory === "string"
      ) {
        campaign.categories = [
          legacyCategory
            .trim()
            .toLowerCase(),
        ];
      } else {
        // ----------------------------------------------
        // Derive categories from requirements
        // ----------------------------------------------

        const derivedCategories = [
          ...new Set(
            (
              campaign.requirements ||
              []
            )
              .map(
                (requirement) =>
                  requirement.category
              )
              .filter(Boolean)
              .map((category) =>
                category
                  .toString()
                  .trim()
                  .toLowerCase()
              )
          ),
        ];

        campaign.categories =
          derivedCategories.length > 0
            ? derivedCategories
            : ["other"];
      }

      needsSave = true;
    }

    // ==================================================
    // REQUIREMENT CATEGORY MIGRATION
    // ==================================================

    const defaultCategory =
      campaign.categories?.[0] ||
      "other";

    if (
      Array.isArray(
        campaign.requirements
      )
    ) {
      for (
        const requirement
        of campaign.requirements
      ) {
        if (
          !requirement.category
        ) {
          requirement.category =
            defaultCategory;

          needsSave = true;
        }
      }
    }

    // ==================================================
    // SAVE LEGACY DATA
    // ==================================================

    if (needsSave) {
      try {
        await campaign.save();
      } catch (migrationError) {
        console.error(
          "Campaign Migration Error:",
          campaign._id,
          migrationError.message
        );
      }
    }

    // ==================================================
    // CHECK CAMPAIGN EXPIRY
    // ==================================================

    const now = new Date();

    const requirements =
      Array.isArray(
        campaign.requirements
      )
        ? campaign.requirements
        : [];

    if (
      campaign.status === "active" &&
      campaign.endDate &&
      now > campaign.endDate
    ) {
      if (
        requirements.length > 0
      ) {
        const allRequirementsCompleted =
          requirements.every(
            (requirement) =>
              Number(
                requirement.currentQuantity ||
                  0
              ) >=
              Number(
                requirement.goalQuantity ||
                  0
              )
          );

        campaign.status =
          allRequirementsCompleted
            ? "completed"
            : "expired";

        try {
          await campaign.save();
        } catch (saveError) {
          console.error(
            "Campaign Expiry Update Error:",
            campaign._id,
            saveError.message
          );
        }
      }
    }

    // ==================================================
    // COMPLETED / EXPIRED CAMPAIGN
    // ==================================================

    if (
      campaign.status ===
        "expired" ||
      campaign.status ===
        "completed"
    ) {
      return res.status(200).json({
        ...campaign.toObject(),

        progress:
          campaign.progress || 0,

        totalGoalQuantity:
          campaign.totalGoalQuantity ||
          0,

        totalCurrentQuantity:
          campaign.totalCurrentQuantity ||
          0,

        totalRemainingQuantity:
          campaign.totalRemainingQuantity ||
          0,

        allRequirementsCompleted:
          campaign.allRequirementsCompleted ||
          false,

        completedRequirementsCount:
          campaign.completedRequirementsCount ||
          0,

        remainingRequirementsCount:
          campaign.remainingRequirementsCount ||
          0,
      });
    }

    // ==================================================
    // ACTIVE CAMPAIGN RESPONSE
    // ==================================================

    return res.status(200).json({
      ...campaign.toObject(),

      // ----------------------------------------------
      // Progress
      // ----------------------------------------------

      progress:
        campaign.progress || 0,

      totalGoalQuantity:
        campaign.totalGoalQuantity ||
        0,

      totalCurrentQuantity:
        campaign.totalCurrentQuantity ||
        0,

      totalRemainingQuantity:
        campaign.totalRemainingQuantity ||
        0,

      allRequirementsCompleted:
        campaign.allRequirementsCompleted ||
        false,

      completedRequirementsCount:
        campaign.completedRequirementsCount ||
        0,

      remainingRequirementsCount:
        campaign.remainingRequirementsCount ||
        0,
    });

  } catch (error) {
    console.error(
      "Get Campaign By ID Error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch campaign.",
      error:
        error.message,
    });
  }
};
// =======================================
// NGO Campaigns
// =======================================
const getMyCampaigns = async (req, res) => {
  try {
    // ==================================================
    // GET CAMPAIGNS CREATED BY LOGGED-IN NGO
    // ==================================================

    const campaigns = await Campaign.find({
      ngo: req.user.id,
    })
      .sort({
        createdAt: -1,
      });

    const now = new Date();

    const updated = [];

    // ==================================================
    // PROCESS EACH CAMPAIGN
    // ==================================================

    for (const campaign of campaigns) {
      let needsSave = false;

      // ==================================================
      // LEGACY CAMPAIGN CATEGORY MIGRATION
      // ==================================================

      if (
        !Array.isArray(campaign.categories) ||
        campaign.categories.length === 0
      ) {
        const legacyCategory =
          campaign.category;

        if (
          legacyCategory &&
          typeof legacyCategory === "string"
        ) {
          campaign.categories = [
            legacyCategory
              .trim()
              .toLowerCase(),
          ];
        } else {
          // ----------------------------------------------
          // Derive categories from requirements
          // ----------------------------------------------

          const derivedCategories = [
            ...new Set(
              (campaign.requirements || [])
                .map(
                  (requirement) =>
                    requirement.category
                )
                .filter(Boolean)
                .map((category) =>
                  category
                    .toString()
                    .trim()
                    .toLowerCase()
                )
            ),
          ];

          campaign.categories =
            derivedCategories.length > 0
              ? derivedCategories
              : ["other"];
        }

        needsSave = true;
      }

      // ==================================================
      // LEGACY REQUIREMENT CATEGORY MIGRATION
      // ==================================================

      const defaultCategory =
        campaign.categories?.[0] ||
        "other";

      if (
        Array.isArray(
          campaign.requirements
        )
      ) {
        for (
          const requirement
          of campaign.requirements
        ) {
          if (
            !requirement.category
          ) {
            requirement.category =
              defaultCategory;

            needsSave = true;
          }
        }
      }

      // ==================================================
      // SAVE MIGRATED DATA
      // ==================================================

      if (needsSave) {
        try {
          await campaign.save();
        } catch (migrationError) {
          console.error(
            "My Campaign Migration Error:",
            campaign._id,
            migrationError.message
          );
        }
      }

      // ==================================================
      // REQUIREMENTS
      // ==================================================

      const requirements =
        Array.isArray(
          campaign.requirements
        )
          ? campaign.requirements
          : [];

      // ==================================================
      // CHECK EXPIRY
      // ==================================================

      if (
        campaign.status === "active" &&
        campaign.endDate &&
        now > campaign.endDate
      ) {
        if (
          requirements.length > 0
        ) {
          const allRequirementsCompleted =
            requirements.every(
              (requirement) =>
                Number(
                  requirement.currentQuantity ||
                    0
                ) >=
                Number(
                  requirement.goalQuantity ||
                    0
                )
            );

          campaign.status =
            allRequirementsCompleted
              ? "completed"
              : "expired";

          try {
            await campaign.save();
          } catch (saveError) {
            console.error(
              "Campaign Expiry Update Error:",
              campaign._id,
              saveError.message
            );
          }
        }
      }

      // ==================================================
      // BUILD RESPONSE
      // ==================================================

      updated.push({
        ...campaign.toObject(),

        // ----------------------------------------------
        // Progress
        // ----------------------------------------------

        progress:
          campaign.progress || 0,

        totalGoalQuantity:
          campaign.totalGoalQuantity || 0,

        totalCurrentQuantity:
          campaign.totalCurrentQuantity || 0,

        totalRemainingQuantity:
          campaign.totalRemainingQuantity || 0,

        allRequirementsCompleted:
          campaign.allRequirementsCompleted ||
          false,

        completedRequirementsCount:
          campaign.completedRequirementsCount ||
          0,

        remainingRequirementsCount:
          campaign.remainingRequirementsCount ||
          0,
      });
    }

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json(
      updated
    );

  } catch (error) {
    console.error(
      "Get My Campaigns Error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch your campaigns.",
      error:
        error.message,
    });
  }
};
const getCampaignDonations = async (req, res) => {
  try {
    // ============================================================
    // FIND CAMPAIGN
    // ============================================================

    const campaign = await Campaign.findById(
      req.params.id
    ).populate(
      "ngo",
      "name organizationName email phone city state"
    );

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found.",
      });
    }

    // ============================================================
    // USER ROLE
    // ============================================================

    const userId = req.user.id.toString();

    const userRole = String(
      req.user.role || ""
    ).toLowerCase();

    // ============================================================
    // CHECK AUTHORIZATION
    //
    // NGO:
    // Only the NGO that owns the campaign can view it.
    //
    // ADMIN:
    // Admin can view campaign donations for any campaign.
    // ============================================================

    const campaignOwnerId =
      campaign.ngo?._id
        ? campaign.ngo._id.toString()
        : campaign.ngo?.toString();

    const isCampaignOwner =
      campaignOwnerId === userId;

    const isAdmin =
      userRole === "admin";

    if (
      !isCampaignOwner &&
      !isAdmin
    ) {
      return res.status(403).json({
        message:
          "You are not authorized to view donations for this campaign.",
      });
    }

    // ============================================================
    // GET DONATIONS FOR THIS CAMPAIGN
    // ============================================================

    const donations =
      await Donation.find({
        campaign: campaign._id,
      })
        .populate(
          "donor",
          "name organizationName email phone city state address pincode donorType"
        )
        .sort({
          createdAt: -1,
        });

    // ============================================================
    // FORMAT DONATIONS
    //
    // Campaign donations store their actual items inside:
    //
    // donation.categories
    //
    // Example:
    //
    // categories: [
    //   {
    //     itemName: "Men Shirts",
    //     category: "clothing",
    //     quantity: 500,
    //     unit: "pieces",
    //     condition: "Good",
    //     campaignRequirement: "..."
    //   }
    // ]
    //
    // We expose these as donationItems as well so the frontend
    // has a clear field to display.
    // ============================================================

    const formattedDonations =
      donations.map(
        (donation) => {

          const categories =
            Array.isArray(
              donation.categories
            )
              ? donation.categories
              : [];

          const donationItems =
            categories.map(
              (item) => ({
                _id:
                  item._id,

                itemName:
                  item.itemName || "",

                category:
                  item.category || "",

                customCategory:
                  item.customCategory || "",

                quantity:
                  Number(
                    item.quantity || 0
                  ),

                unit:
                  item.unit || "",

                condition:
                  item.condition ||
                  "Good",

                campaignRequirement:
                  item.campaignRequirement ||
                  null,
              })
            );

          return {
            // ==================================================
            // DONATION BASIC INFORMATION
            // ==================================================

            _id:
              donation._id,

            donationName:
              donation.donationName,

            description:
              donation.description,

            // ==================================================
            // DONOR
            // ==================================================

            donor:
              donation.donor,

            // ==================================================
            // CAMPAIGN
            // ==================================================

            campaign:
              donation.campaign,

            // ==================================================
            // IMPORTANT
            // ==================================================
            //
            // Original stored field
            // ==================================================

            categories,

            // ==================================================
            // FRONTEND-FRIENDLY ITEM FIELD
            // ==================================================

            donationItems,

            // ==================================================
            // DELIVERY
            // ==================================================

            allowedDeliveryMethods:
              donation.allowedDeliveryMethods || [],

            // ==================================================
            // STATUS
            // ==================================================

            status:
              donation.status,

            // ==================================================
            // AVAILABILITY
            // ==================================================

            availableFrom:
              donation.availableFrom,

            availableUntil:
              donation.availableUntil,

            // ==================================================
            // EXPIRY
            // ==================================================

            isExpired:
              donation.isExpired,

            // ==================================================
            // DELIVERY / PICKUP
            // ==================================================

            pickupProofImage:
              donation.pickupProofImage || "",

            deliveryProofImage:
              donation.deliveryProofImage || "",

            pickedUpAt:
              donation.pickedUpAt || null,

            deliveredAt:
              donation.deliveredAt || null,

            // ==================================================
            // CAMPAIGN REQUIREMENT
            // ==================================================

            campaignRequirement:
              donation.campaignRequirement ||
              null,

            // ==================================================
            // TIMESTAMPS
            // ==================================================

            createdAt:
              donation.createdAt,

            updatedAt:
              donation.updatedAt,
          };
        }
      );

    // ============================================================
    // RESPONSE
    // ============================================================

    return res.status(200).json({
      campaign: {
        // ======================================================
        // BASIC
        // ======================================================

        _id:
          campaign._id,

        title:
          campaign.title,

        description:
          campaign.description,

        categories:
          campaign.categories,

        campaignImages:
          campaign.campaignImages,

        status:
          campaign.status,

        duration:
          campaign.duration,

        startDate:
          campaign.startDate,

        endDate:
          campaign.endDate,

        // ======================================================
        // REQUIREMENTS
        // ======================================================

        requirements:
          campaign.requirements,

        // ======================================================
        // PROGRESS
        // ======================================================

        progress:
          campaign.progress || 0,

        totalGoalQuantity:
          campaign.totalGoalQuantity || 0,

        totalCurrentQuantity:
          campaign.totalCurrentQuantity || 0,

        totalRemainingQuantity:
          campaign.totalRemainingQuantity || 0,

        allRequirementsCompleted:
          campaign.allRequirementsCompleted ||
          false,

        completedRequirementsCount:
          campaign.completedRequirementsCount ||
          0,

        remainingRequirementsCount:
          campaign.remainingRequirementsCount ||
          0,

        // ======================================================
        // SUPPORTERS
        // ======================================================

        supporters:
          campaign.supporters || 0,

        // ======================================================
        // NGO
        // ======================================================

        ngo:
          campaign.ngo,
      },

      // ========================================================
      // DONATIONS
      // ========================================================

      donations:
        formattedDonations,

      // ========================================================
      // COUNT
      // ========================================================

      donationCount:
        formattedDonations.length,
    });

  } catch (error) {

    // ============================================================
    // ERROR
    // ============================================================

    console.error(
      "Get Campaign Donations Error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch campaign donations.",

      error:
        error.message,
    });
  }
};
// =======================================
// Campaign Details
// =======================================



// =======================================
// Admin Approve
// =======================================

const approveCampaign = async (req, res) => {
  try {
    // ==================================================
    // FIND CAMPAIGN
    // ==================================================

    const campaign = await Campaign.findById(
      req.params.id
    );

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found.",
      });
    }

    // ==================================================
    // CHECK CURRENT STATUS
    // ==================================================

    if (campaign.status === "active") {
      return res.status(400).json({
        message:
          "This campaign has already been approved and is active.",
      });
    }

    if (campaign.status === "completed") {
      return res.status(400).json({
        message:
          "A completed campaign cannot be approved again.",
      });
    }

    if (campaign.status === "expired") {
      return res.status(400).json({
        message:
          "An expired campaign cannot be approved again.",
      });
    }

    // ==================================================
    // CHECK REQUIREMENTS
    // ==================================================

    if (
      !Array.isArray(campaign.requirements) ||
      campaign.requirements.length === 0
    ) {
      return res.status(400).json({
        message:
          "Campaign must contain at least one requirement before approval.",
      });
    }

    // ==================================================
    // CHECK CAMPAIGN CATEGORIES
    // ==================================================

    if (
      !Array.isArray(campaign.categories) ||
      campaign.categories.length === 0
    ) {
      return res.status(400).json({
        message:
          "Campaign must contain at least one category before approval.",
      });
    }

    // ==================================================
    // CHECK DURATION
    // ==================================================

    if (
      !campaign.duration ||
      Number(campaign.duration) <= 0
    ) {
      return res.status(400).json({
        message:
          "Campaign must have a valid duration before approval.",
      });
    }

    // ==================================================
    // APPROVE CAMPAIGN
    // ==================================================

    const startDate = new Date();

    const endDate = new Date(
      startDate.getTime() +
        Number(campaign.duration) *
          24 *
          60 *
          60 *
          1000
    );

    campaign.isApproved = true;

    campaign.status = "active";

    campaign.startDate = startDate;

    campaign.endDate = endDate;

    await campaign.save();

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      message:
        "Campaign approved successfully and is now active.",

      campaign,
    });
  } catch (error) {
    console.error(
      "Approve Campaign Error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to approve campaign.",
      error:
        error.message,
    });
  }
};
// =======================================
// Reject
// =======================================

const rejectCampaign = async (req, res) => {

  try {

    const campaign = await Campaign.findById(
      req.params.id
    );

    if (!campaign) {

      return res.status(404).json({

        message: "Campaign not found.",

      });

    }

    campaign.status = "rejected";

    await campaign.save();

    res.json({

      message: "Campaign rejected.",

    });

  } catch (error) {

    res.status(500).json({

      message: error.message,

    });

  }

};

// =======================================
// NGO Impact Report
// =======================================

const addImpactReport = async (req, res) => {

  try {

    const campaign = await Campaign.findById(
      req.params.id
    );

    if (!campaign) {

      return res.status(404).json({

        message: "Campaign not found.",

      });

    }

    campaign.impactTitle =
      req.body.impactTitle;

    campaign.impactDescription =
      req.body.impactDescription;

    campaign.impactImage =
      req.body.impactImage;

    await campaign.save();

    await sendNotification(

  campaign.ngo,

  "Impact Report Published",

  "Your campaign impact report is now visible to donors.",

  "success"

);

    res.json({

      message: "Impact report added.",

      campaign,

    });

  } catch (error) {

    res.status(500).json({

      message: error.message,

    });

  }

};

// ==========================================
// DONATE TO CAMPAIGN
// ==========================================
const donateToCampaign = async (req, res) => {
  try {
    // ============================================================
    // REQUEST DATA
    // ============================================================

    const {
      campaignId,
      items,
      description,
      availableFrom,
      availableUntil,
      allowedDeliveryMethods,
    } = req.body;

    // ============================================================
    // VALIDATE CAMPAIGN ID
    // ============================================================

    if (!campaignId) {
      return res.status(400).json({
        message: "Campaign ID is required.",
      });
    }

    // ============================================================
    // FIND CAMPAIGN
    // ============================================================

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found.",
      });
    }

    // ============================================================
    // CAMPAIGN STATUS
    // ============================================================

    if (
      campaign.status !== "active" ||
      !campaign.isApproved
    ) {
      return res.status(400).json({
        message:
          "This campaign is not currently accepting donations.",
      });
    }

    // ============================================================
    // CHECK CAMPAIGN EXPIRY
    // ============================================================

    const now = new Date();

    if (
      campaign.endDate &&
      now > new Date(campaign.endDate)
    ) {
      return res.status(400).json({
        message:
          "This campaign has expired and is no longer accepting donations.",
      });
    }

    // ============================================================
    // PARSE ITEMS
    // ============================================================

    let parsedItems = items;

    if (typeof parsedItems === "string") {
      try {
        parsedItems = JSON.parse(parsedItems);
      } catch (error) {
        console.error(
          "Campaign donation items JSON error:",
          error
        );

        return res.status(400).json({
          message:
            "Invalid campaign donation items.",
        });
      }
    }

    // ============================================================
    // VALIDATE ITEMS
    // ============================================================

    if (
      !Array.isArray(parsedItems) ||
      parsedItems.length === 0
    ) {
      return res.status(400).json({
        message:
          "Please add at least one donation item.",
      });
    }

    if (parsedItems.length > 20) {
      return res.status(400).json({
        message:
          "A campaign donation can contain a maximum of 20 items.",
      });
    }

    // ============================================================
    // PARSE DELIVERY METHODS
    // ============================================================

    let parsedDeliveryMethods =
      allowedDeliveryMethods;

    if (
      typeof parsedDeliveryMethods === "string"
    ) {
      try {
        parsedDeliveryMethods =
          JSON.parse(
            parsedDeliveryMethods
          );
      } catch (error) {
        parsedDeliveryMethods = [
          parsedDeliveryMethods,
        ];
      }
    }

    // ============================================================
    // VALIDATE DELIVERY METHODS
    // ============================================================

    if (
      !Array.isArray(
        parsedDeliveryMethods
      ) ||
      parsedDeliveryMethods.length === 0
    ) {
      return res.status(400).json({
        message:
          "Select at least one delivery method.",
      });
    }

    // ============================================================
    // DELIVERY METHOD MAPPING
    // ============================================================

    const deliveryMethodMap = {
      volunteer_delivery: "volunteer",
      self_pickup: "donor_self",

      volunteer: "volunteer",
      donor_self: "donor_self",
      ngo_pickup: "ngo_pickup",
    };

    const normalizedDeliveryInput =
      parsedDeliveryMethods.map(
        (method) =>
          String(method)
            .trim()
            .toLowerCase()
      );

    // ============================================================
    // CHECK INVALID DELIVERY METHODS
    // ============================================================

    const invalidDeliveryMethods =
      normalizedDeliveryInput.filter(
        (method) =>
          !Object.prototype.hasOwnProperty.call(
            deliveryMethodMap,
            method
          )
      );

    if (
      invalidDeliveryMethods.length > 0
    ) {
      return res.status(400).json({
        message:
          "Invalid delivery method selected.",
        invalidMethods:
          invalidDeliveryMethods,
      });
    }

    // ============================================================
    // FINAL DELIVERY METHODS
    // ============================================================

    const normalizedDeliveryMethods = [
      ...new Set(
        normalizedDeliveryInput.map(
          (method) =>
            deliveryMethodMap[method]
        )
      ),
    ];

    // ============================================================
    // DATE VALIDATION
    // ============================================================

    if (
      !availableFrom ||
      !availableUntil
    ) {
      return res.status(400).json({
        message:
          "Available From and Available Until are required.",
      });
    }

    const from = new Date(
      availableFrom
    );

    const until = new Date(
      availableUntil
    );

    if (
      Number.isNaN(from.getTime()) ||
      Number.isNaN(until.getTime())
    ) {
      return res.status(400).json({
        message:
          "Invalid availability dates.",
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

    // ============================================================
    // ALLOWED VALUES
    // ============================================================

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

    // ============================================================
    // NORMALIZED ITEMS
    // ============================================================

    const normalizedItems = [];

    // ============================================================
    // PROCESS EACH ITEM
    // ============================================================

    for (
      let index = 0;
      index < parsedItems.length;
      index++
    ) {
      const item =
        parsedItems[index];

      if (!item) {
        return res.status(400).json({
          message:
            `Invalid donation item at position ${
              index + 1
            }.`,
        });
      }

      // ----------------------------------------------------------
      // BASIC FIELDS
      // ----------------------------------------------------------

      const itemName = String(
        item.itemName || ""
      ).trim();

      const category = String(
        item.category || ""
      )
        .trim()
        .toLowerCase();

      const quantity =
        Number(item.quantity);

      const unit = String(
        item.unit || ""
      )
        .trim()
        .toLowerCase();

      const condition =
        item.condition || "Good";

      const requirementId =
        item.campaignRequirement;

      // ----------------------------------------------------------
      // REQUIRED VALIDATION
      // ----------------------------------------------------------

      if (
        !itemName ||
        !category ||
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !unit ||
        !requirementId
      ) {
        return res.status(400).json({
          message:
            `Please complete all fields for campaign item ${
              index + 1
            }.`,
        });
      }

      // ----------------------------------------------------------
      // CATEGORY
      // ----------------------------------------------------------

      if (
        !allowedCategories.includes(
          category
        )
      ) {
        return res.status(400).json({
          message:
            `Invalid category for "${itemName}".`,
        });
      }

      // ----------------------------------------------------------
      // UNIT
      // ----------------------------------------------------------

      if (
        !allowedUnits.includes(unit)
      ) {
        return res.status(400).json({
          message:
            `Invalid unit for "${itemName}".`,
        });
      }

      // ----------------------------------------------------------
      // CONDITION
      // ----------------------------------------------------------

      if (
        !allowedConditions.includes(
          condition
        )
      ) {
        return res.status(400).json({
          message:
            `Invalid condition for "${itemName}".`,
        });
      }

      // ==========================================================
      // FIND CAMPAIGN REQUIREMENT
      // ==========================================================

      const requirement =
        campaign.requirements.id(
          requirementId
        );

      if (!requirement) {
        return res.status(404).json({
          message:
            `Campaign requirement not found for "${itemName}".`,
        });
      }

      // ==========================================================
      // REQUIREMENT ITEM MATCH
      // ==========================================================

      const requirementItemName =
        String(
          requirement.itemName || ""
        )
          .trim()
          .toLowerCase();

      if (
        requirementItemName !==
        itemName.toLowerCase()
      ) {
        return res.status(400).json({
          message:
            `Item "${itemName}" does not match the selected campaign requirement.`,
        });
      }

      // ==========================================================
      // REQUIREMENT CATEGORY MATCH
      // ==========================================================

      const requirementCategory =
        String(
          requirement.category ||
            campaign.categories?.[0] ||
            "other"
        )
          .trim()
          .toLowerCase();

      if (
        category !==
        requirementCategory
      ) {
        return res.status(400).json({
          message:
            `Category mismatch for "${itemName}". This requirement belongs to ${requirementCategory}.`,
        });
      }

      // ==========================================================
      // REQUIREMENT UNIT MATCH
      // ==========================================================

      const requirementUnit =
        String(
          requirement.unit || ""
        )
          .trim()
          .toLowerCase();

      if (
        unit !==
        requirementUnit
      ) {
        return res.status(400).json({
          message:
            `Unit mismatch for "${itemName}". The campaign requires ${requirement.unit}.`,
        });
      }

      // ==========================================================
      // CURRENT / GOAL
      // ==========================================================

      const currentQuantity =
        Number(
          requirement.currentQuantity ||
            0
        );

      const goalQuantity =
        Number(
          requirement.goalQuantity ||
            0
        );

      // ==========================================================
      // CHECK COMPLETED
      // ==========================================================

      if (
        currentQuantity >=
        goalQuantity
      ) {
        return res.status(400).json({
          message:
            `The requirement "${requirement.itemName}" has already been completed.`,
        });
      }

      // ==========================================================
      // REMAINING
      // ==========================================================

      const remaining =
        goalQuantity -
        currentQuantity;

      // ==========================================================
      // PREVENT OVER-DONATION
      // ==========================================================

      if (
        quantity > remaining
      ) {
        return res.status(400).json({
          message:
            `Only ${remaining} ${requirement.unit} of ${requirement.itemName} is still required.`,
        });
      }

      // ==========================================================
      // NORMALIZED ITEM
      // ==========================================================

      normalizedItems.push({
        itemName:
          requirement.itemName,

        category:
          requirementCategory,

        quantity,

        unit:
          requirementUnit,

        condition,

        campaignRequirement:
          requirement._id,
      });
    }

    // ============================================================
    // DUPLICATE REQUIREMENT CHECK
    // ============================================================

    const requirementIds =
      normalizedItems.map(
        (item) =>
          item.campaignRequirement.toString()
      );

    const duplicateRequirements =
      requirementIds.filter(
        (id, index) =>
          requirementIds.indexOf(id) !==
          index
      );

    if (
      duplicateRequirements.length > 0
    ) {
      return res.status(400).json({
        message:
          "The same campaign requirement cannot be added more than once in one donation.",
      });
    }

    // ============================================================
    // CREATE CATEGORY OBJECTS
    // ============================================================

    const donationCategories =
      normalizedItems.map(
        (item) => ({
          category:
            item.category,

          itemName:
            item.itemName,

          quantity:
            item.quantity,

          unit:
            item.unit,

          condition:
            item.condition,

          campaignRequirement:
            item.campaignRequirement,
        })
      );

    // ============================================================
    // SAFETY CHECK
    // ============================================================

    if (
      donationCategories.length === 0
    ) {
      return res.status(400).json({
        message:
          "A campaign donation must contain at least one category.",
      });
    }

    // ============================================================
    // DEBUG
    // ============================================================

    console.log(
      "=============================================="
    );

    console.log(
      "CAMPAIGN DONATION - BACKEND"
    );

    console.log(
      "Campaign ID:",
      campaign._id
    );

    console.log(
      "Campaign:",
      campaign.title
    );

    console.log(
      "Donation Name:",
      `Campaign Donation - ${campaign.title}`
    );

    console.log(
      "Donation Categories:",
      donationCategories
    );

    console.log(
      "Donation Items:",
      normalizedItems
    );

    console.log(
      "Delivery Methods:",
      normalizedDeliveryMethods
    );

    console.log(
      "Available From:",
      from
    );

    console.log(
      "Available Until:",
      until
    );

    console.log(
      "=============================================="
    );

    // ============================================================
    // CREATE DONATION
    // ============================================================

    const donation =
      await Donation.create({
        // --------------------------------------------------------
        // DONOR
        // --------------------------------------------------------

        donor:
          req.user.id,

        // --------------------------------------------------------
        // CAMPAIGN
        // --------------------------------------------------------

        campaign:
          campaign._id,

        // --------------------------------------------------------
        // DONATION NAME
        // --------------------------------------------------------

        donationName:
          `Campaign Donation - ${campaign.title}`,

        // --------------------------------------------------------
        // CATEGORIES
        // --------------------------------------------------------

        categories:
          donationCategories,

        // --------------------------------------------------------
        // ITEMS
        // --------------------------------------------------------

        items:
          normalizedItems,

        // --------------------------------------------------------
        // DESCRIPTION
        // --------------------------------------------------------

        description:
          description?.trim() ||
          `Campaign Donation - ${campaign.title}`,

        // --------------------------------------------------------
        // AVAILABILITY
        // --------------------------------------------------------

        availableFrom:
          from,

        availableUntil:
          until,

        // --------------------------------------------------------
        // DELIVERY METHODS
        // --------------------------------------------------------

        allowedDeliveryMethods:
          normalizedDeliveryMethods,

        // --------------------------------------------------------
        // STATUS
        // --------------------------------------------------------

        status:
          "available",

        // --------------------------------------------------------
        // EXPIRY
        // --------------------------------------------------------

        isExpired:
          false,
      });

    // ============================================================
    // IMPORTANT
    // ============================================================
    //
    // DO NOT UPDATE campaign.currentQuantity HERE.
    //
    // The donation has only been submitted by the donor.
    // It has NOT yet been received by the NGO.
    //
    // Campaign progress will be updated when the NGO confirms
    // receipt of the donation after delivery.
    //
    // ============================================================

    // ============================================================
    // SUPPORTER COUNT
    // ============================================================

    try {
      const uniqueDonors =
        await Donation.distinct(
          "donor",
          {
            campaign:
              campaign._id,
          }
        );

      campaign.supporters =
        uniqueDonors.length;
    } catch (
      supporterError
    ) {
      console.error(
        "Supporter count update error:",
        supporterError.message
      );
    }

    // ============================================================
    // SAVE CAMPAIGN
    // ============================================================

    // Only supporter count is updated here.
    // Quantity/progress is NOT updated here.

    await campaign.save();

    // ============================================================
    // NOTIFICATION
    // ============================================================

    try {
      const itemNames =
        normalizedItems
          .map(
            (item) =>
              `${item.itemName} (${item.quantity} ${item.unit})`
          )
          .join(", ");

      await sendNotification(
        campaign.ngo,
        "New Campaign Donation",
        `${itemNames} donated towards "${campaign.title}".`,
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

    // ============================================================
    // AUDIT LOG
    // ============================================================

    try {
      await createAuditLog(
        req.user.id,
        "Campaign Donation",
        `Donation submitted to campaign "${campaign.title}".`,
        campaign.ngo,
        donation._id
      );
    } catch (
      auditError
    ) {
      console.error(
        "Campaign donation audit error:",
        auditError.message
      );
    }

    // ============================================================
    // SUCCESS RESPONSE
    // ============================================================

    return res.status(201).json({
      message:
        "Campaign donation submitted successfully.",

      donation,

      campaign,
    });

  } catch (error) {

    // ============================================================
    // ERROR
    // ============================================================

    console.error(
      "Donate To Campaign Error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to submit campaign donation.",

      error:
        error.message,
    });
  }
};
// =======================================
// NGO Campaign Dashboard Stats
// =======================================
const getCampaignDashboardStats = async (req, res) => {
  try {
    // ======================================
    // GET NGO CAMPAIGNS
    // ======================================

    const campaigns = await Campaign.find({
      ngo: req.user.id,
    });

    // ======================================
    // BASIC CAMPAIGN COUNTS
    // ======================================

    const totalCampaigns =
      campaigns.length;

    const activeCampaigns =
      campaigns.filter(
        (campaign) =>
          campaign.status === "active"
      ).length;

    const completedCampaigns =
      campaigns.filter(
        (campaign) =>
          campaign.status === "completed"
      ).length;

    const expiredCampaigns =
      campaigns.filter(
        (campaign) =>
          campaign.status === "expired"
      ).length;

    // ======================================
    // TOTAL COLLECTED
    // ======================================
    // Since a campaign can have multiple
    // requirements, calculate the collected
    // quantity from every requirement.

    const totalRaised =
      campaigns.reduce(
        (campaignTotal, campaign) => {

          const campaignCollected =
            campaign.requirements.reduce(
              (requirementTotal, requirement) =>
                requirementTotal +
                Number(
                  requirement.currentQuantity || 0
                ),
              0
            );

          return campaignTotal + campaignCollected;
        },
        0
      );

    // ======================================
    // TOTAL GOAL
    // ======================================

    const totalGoal =
      campaigns.reduce(
        (campaignTotal, campaign) => {

          const campaignGoal =
            campaign.requirements.reduce(
              (requirementTotal, requirement) =>
                requirementTotal +
                Number(
                  requirement.goalQuantity || 0
                ),
              0
            );

          return campaignTotal + campaignGoal;
        },
        0
      );

    // ======================================
    // RESPONSE
    // ======================================

    res.json({
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      expiredCampaigns,

      // Total quantity collected across
      // all campaign requirements
      totalRaised,

      // Total quantity requested across
      // all campaign requirements
      totalGoal,
    });

  } catch (error) {

    console.error(
      "Get Campaign Dashboard Stats Error:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};
// =======================================
// Campaign Management
// =======================================

// =======================================
// Campaign Management
// =======================================
const getCampaignManagement = async (req, res) => {
  try {
    // ======================================
    // FIND CAMPAIGN
    // ======================================

    const campaign = await Campaign.findById(
      req.params.id
    ).populate(
      "ngo",
      "name organizationName ngoCategory"
    );

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found.",
      });
    }

    // ======================================
    // GET CAMPAIGN DONATIONS
    // ======================================

    const donations = await Donation.find({
      campaign: campaign._id,
    })
      .populate(
        "donor",
        "name email phone"
      )
      .sort({
        createdAt: -1,
      });

    // ======================================
    // GET REQUESTS
    // ======================================

    const donationIds = donations.map(
      (donation) => donation._id
    );

    const requests =
      donationIds.length > 0
        ? await Request.find({
            donation: {
              $in: donationIds,
            },
          }).populate(
            "assignedVolunteer",
            "name phone vehicleType"
          )
        : [];

    // ======================================
    // UNIQUE SUPPORTERS
    // ======================================

    const uniqueSupporters = new Set();

    donations.forEach((donation) => {
      if (donation.donor?._id) {
        uniqueSupporters.add(
          donation.donor._id.toString()
        );
      }
    });

    // ======================================
    // REQUIREMENT ANALYTICS
    // ======================================

    const requirementAnalytics =
      campaign.requirements.map(
        (requirement) => {

          const collected =
            Number(
              requirement.currentQuantity || 0
            );

          const goal =
            Number(
              requirement.goalQuantity || 0
            );

          return {
            _id: requirement._id,

            itemName:
              requirement.itemName,

            goalQuantity:
              goal,

            currentQuantity:
              collected,

            remaining:
              Math.max(
                0,
                goal - collected
              ),

            unit:
              requirement.unit,

            progress:
              goal > 0
                ? Math.min(
                    100,
                    Math.round(
                      (collected / goal) *
                        100
                    )
                  )
                : 0,

            completed:
              collected >= goal,
          };
        }
      );

    // ======================================
    // OVERALL ANALYTICS
    // ======================================

    const totalGoal =
      campaign.requirements.reduce(
        (sum, requirement) =>
          sum +
          Number(
            requirement.goalQuantity || 0
          ),
        0
      );

    const totalCollected =
      campaign.requirements.reduce(
        (sum, requirement) =>
          sum +
          Number(
            requirement.currentQuantity || 0
          ),
        0
      );

    const totalRemaining =
      Math.max(
        0,
        totalGoal - totalCollected
      );

    const overallProgress =
      totalGoal > 0
        ? Math.min(
            100,
            Math.round(
              (totalCollected /
                totalGoal) *
                100
            )
          )
        : 0;

    // ======================================
    // DELIVERY ANALYTICS
    // ======================================

    const completedDeliveries =
      requests.filter(
        (request) =>
          request.status === "completed"
      ).length;

    const pendingDeliveries =
      requests.filter(
        (request) =>
          request.status !== "completed"
      ).length;

    // ======================================
    // ANALYTICS OBJECT
    // ======================================

    const analytics = {
      totalDonations:
        donations.length,

      supporters:
        uniqueSupporters.size,

      // Overall campaign numbers
      collected:
        totalCollected,

      goal:
        totalGoal,

      remaining:
        totalRemaining,

      progress:
        overallProgress,

      allRequirementsCompleted:
        campaign.allRequirementsCompleted,

      // Individual requirements
      requirements:
        requirementAnalytics,

      // Delivery statistics
      completedDeliveries,

      pendingDeliveries,
    };

    // ======================================
    // RESPONSE
    // ======================================

    res.json({
      campaign,
      donations,
      requests,
      analytics,
    });

  } catch (error) {

    console.error(
      "Get Campaign Management Error:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================================
// NGO Edit Campaign
// =======================================
const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    let {
      title,
      description,
      categories,
      requirements,
      duration,
    } = req.body;

    // ======================================
    // FIND CAMPAIGN
    // ======================================
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found.",
      });
    }

    // ======================================
    // OWNERSHIP CHECK
    // ======================================
    if (
      campaign.ngo.toString() !==
      req.user.id.toString()
    ) {
      return res.status(403).json({
        message:
          "You are not authorized to edit this campaign.",
      });
    }

    // ======================================
    // DON'T EDIT REJECTED CAMPAIGN
    // ======================================
    if (campaign.status === "rejected") {
      return res.status(400).json({
        message:
          "Rejected campaigns cannot be edited.",
      });
    }

    // ======================================
    // BASIC VALIDATION
    // ======================================
    if (
      !title ||
      !description ||
      !categories ||
      !duration
    ) {
      return res.status(400).json({
        message:
          "Please fill all required fields.",
      });
    }

    // ======================================
    // PARSE CATEGORIES
    // ======================================
    if (typeof categories === "string") {
      try {
        categories =
          JSON.parse(categories);
      } catch (error) {
        return res.status(400).json({
          message:
            "Invalid campaign categories.",
        });
      }
    }

    // ======================================
    // CATEGORY VALIDATION
    // ======================================
    if (
      !Array.isArray(categories) ||
      categories.length === 0
    ) {
      return res.status(400).json({
        message:
          "Please select at least one campaign category.",
      });
    }

    // ======================================
    // NORMALIZE CATEGORIES
    // ======================================
    categories = categories
      .filter(
        (category) =>
          typeof category === "string" &&
          category.trim() !== ""
      )
      .map(
        (category) =>
          category.trim().toLowerCase()
      );

    // Remove duplicates
    categories = [
      ...new Set(categories),
    ];

    // ======================================
    // ALLOWED CATEGORIES
    // ======================================
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

    const invalidCategories =
      categories.filter(
        (category) =>
          !allowedCategories.includes(
            category
          )
      );

    if (
      invalidCategories.length > 0
    ) {
      return res.status(400).json({
        message: `Invalid campaign category: ${invalidCategories.join(
          ", "
        )}`,
      });
    }

    // ======================================
    // PARSE REQUIREMENTS
    // ======================================
    if (typeof requirements === "string") {
      try {
        requirements =
          JSON.parse(requirements);
      } catch (error) {
        return res.status(400).json({
          message:
            "Invalid campaign requirements.",
        });
      }
    }

    // ======================================
    // REQUIREMENT VALIDATION
    // ======================================
    if (
      !Array.isArray(requirements) ||
      requirements.length === 0
    ) {
      return res.status(400).json({
        message:
          "Please add at least one campaign requirement.",
      });
    }

    // Maximum 10 requirements
    if (requirements.length > 10) {
      return res.status(400).json({
        message:
          "A campaign can have a maximum of 10 requirements.",
      });
    }

    // ======================================
    // NORMALIZE REQUIREMENTS
    // ======================================
    const normalizedRequirements = [];

    for (const requirement of requirements) {

      if (
        !requirement.itemName ||
        !requirement.goalQuantity ||
        !requirement.unit
      ) {
        return res.status(400).json({
          message:
            "Each requirement must have an item, quantity and unit.",
        });
      }

      const goalQuantity =
        Number(
          requirement.goalQuantity
        );

      if (
        !Number.isFinite(
          goalQuantity
        ) ||
        goalQuantity <= 0
      ) {
        return res.status(400).json({
          message:
            "Requirement quantity must be greater than 0.",
        });
      }

      // ======================================
      // REQUIREMENT CATEGORY
      // ======================================

      const requirementCategory =
        requirement.category
          ?.trim()
          .toLowerCase();

      if (
        requirementCategory &&
        !allowedCategories.includes(
          requirementCategory
        )
      ) {
        return res.status(400).json({
          message:
            `Invalid requirement category: ${requirement.category}`,
        });
      }

      // ======================================
      // PRESERVE EXISTING REQUIREMENT
      // ======================================

      let existingRequirement = null;

      if (requirement._id) {
        existingRequirement =
          campaign.requirements.id(
            requirement._id
          );
      }

      // ======================================
      // PREVENT REDUCING GOAL BELOW
      // ALREADY COLLECTED QUANTITY
      // ======================================

      const existingCurrentQuantity =
        existingRequirement
          ? Number(
              existingRequirement.currentQuantity ||
                0
            )
          : 0;

      if (
        goalQuantity <
        existingCurrentQuantity
      ) {
        return res.status(400).json({
          message:
            `Goal quantity for "${requirement.itemName}" cannot be less than the quantity already collected (${existingCurrentQuantity}).`,
        });
      }

      // ======================================
      // PUSH NORMALIZED REQUIREMENT
      // ======================================

      normalizedRequirements.push({
        _id:
          existingRequirement
            ? existingRequirement._id
            : undefined,

        itemName:
          requirement.itemName.trim(),

        category:
          requirementCategory ||
          null,

        goalQuantity,

        currentQuantity:
          existingCurrentQuantity,

        unit:
          requirement.unit
            .trim()
            .toLowerCase(),
      });
    }

    // ======================================
    // NORMALIZE DURATION
    // ======================================
    const campaignDuration =
      Number(duration);

    if (
      !Number.isFinite(
        campaignDuration
      ) ||
      campaignDuration <= 0
    ) {
      return res.status(400).json({
        message:
          "Campaign duration must be greater than 0.",
      });
    }

    // ======================================
    // UPDATE BASIC INFORMATION
    // ======================================
    campaign.title =
      title.trim();

    campaign.description =
      description.trim();

    campaign.categories =
      categories;

    campaign.duration =
      campaignDuration;

    // ======================================
    // UPDATE REQUIREMENTS
    // ======================================
    campaign.requirements =
      normalizedRequirements;

    // ======================================
    // UPDATE IMAGES IF NEW FILES UPLOADED
    // ======================================
    if (
      req.files &&
      req.files.length > 0
    ) {
      const newImages =
        req.files.map(
          (file) =>
            `/uploads/${file.filename}`
        );

      campaign.campaignImages =
        newImages;
    }

    // ======================================
    // UPDATE END DATE
    // ======================================
    if (
      campaign.status === "active" &&
      campaign.startDate
    ) {
      campaign.endDate =
        new Date(
          campaign.startDate.getTime() +
            campaign.duration *
              24 *
              60 *
              60 *
              1000
        );
    }

    // ======================================
    // SAVE
    // ======================================
    await campaign.save();

    // ======================================
    // RESPONSE
    // ======================================
    return res.status(200).json({
      message:
        "Campaign updated successfully.",

      campaign,
    });

  } catch (error) {
    console.error(
      "Update Campaign Error:",
      error
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =======================================
// NGO Delete Campaign
// =======================================
const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    // ======================================
    // FIND CAMPAIGN
    // ======================================
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found.",
      });
    }

    // ======================================
    // OWNERSHIP CHECK
    // ======================================
    if (campaign.ngo.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message:
          "You are not authorized to delete this campaign.",
      });
    }

    // ======================================
    // CHECK DONATIONS
    // ======================================
    const donationCount =
      await Donation.countDocuments({
        campaign: campaign._id,
      });

    if (donationCount > 0) {
      return res.status(400).json({
        message:
          "This campaign cannot be deleted because donations have already been submitted.",
      });
    }

    // ======================================
    // DELETE CAMPAIGN
    // ======================================
    await Campaign.findByIdAndDelete(id);

    res.json({
      message: "Campaign deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete Campaign Error:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};
// =======================================
// ADMIN CAMPAIGN DETAILS
// =======================================
// ADMIN CAMPAIGN DETAILS
// =======================================
const getAdminCampaignDetails = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("=================================");
    console.log("ADMIN CAMPAIGN DETAILS");
    console.log("Campaign ID received:", id);
    console.log("=================================");

    // ======================================
    // VALIDATE CAMPAIGN ID
    // ======================================
    if (!id || id === ":id") {
      return res.status(400).json({
        message: "Invalid campaign ID.",
      });
    }

    // ======================================
    // FIND CAMPAIGN
    // ======================================
    const campaign = await Campaign.findById(id)
      .populate(
        "ngo",
        "name organizationName ngoCategory email phone"
      );

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found.",
      });
    }

    // ======================================
    // GET DONATIONS
    // ======================================
    const donations = await Donation.find({
      campaign: campaign._id,
    })
      .populate(
        "donor",
        "name email phone"
      )
      .sort({
        createdAt: -1,
      });

    // ======================================
    // GET REQUESTS
    // ======================================
    const donationIds = donations.map(
      (donation) => donation._id
    );

    const requests =
      donationIds.length > 0
        ? await Request.find({
            donation: {
              $in: donationIds,
            },
          })
            .populate(
              "assignedVolunteer",
              "name phone vehicleType"
            )
            .sort({
              createdAt: -1,
            })
        : [];

    // ======================================
    // UNIQUE SUPPORTERS
    // ======================================
    const uniqueSupporters = new Set();

    donations.forEach((donation) => {
      if (donation.donor?._id) {
        uniqueSupporters.add(
          donation.donor._id.toString()
        );
      }
    });

    // ======================================
    // REQUIREMENT ANALYTICS
    // ======================================
    const requirements =
      campaign.requirements || [];

    const requirementAnalytics =
      requirements.map((requirement) => {
        const goal = Number(
          requirement.goalQuantity || 0
        );

        const collected = Number(
          requirement.currentQuantity || 0
        );

        const remaining = Math.max(
          0,
          goal - collected
        );

        const progress =
          goal > 0
            ? Math.min(
                100,
                Math.round(
                  (collected / goal) * 100
                )
              )
            : 0;

        return {
          _id: requirement._id,
          itemName: requirement.itemName,
          goalQuantity: goal,
          currentQuantity: collected,
          remaining,
          unit: requirement.unit,
          progress,
          completed: collected >= goal,
        };
      });

    // ======================================
    // OVERALL ANALYTICS
    // ======================================
    const totalGoal =
      requirements.reduce(
        (sum, requirement) =>
          sum +
          Number(
            requirement.goalQuantity || 0
          ),
        0
      );

    const totalCollected =
      requirements.reduce(
        (sum, requirement) =>
          sum +
          Number(
            requirement.currentQuantity || 0
          ),
        0
      );

    const totalRemaining = Math.max(
      0,
      totalGoal - totalCollected
    );

    const overallProgress =
      totalGoal > 0
        ? Math.min(
            100,
            Math.round(
              (totalCollected / totalGoal) * 100
            )
          )
        : 0;

    // ======================================
    // DELIVERY ANALYTICS
    // ======================================
    const completedDeliveries =
      requests.filter(
        (request) =>
          request.status === "completed"
      ).length;

    const pendingDeliveries =
      requests.filter(
        (request) =>
          request.status !== "completed"
      ).length;

    // ======================================
    // RESPONSE
    // ======================================
    res.json({
      campaign,
      donations,
      requests,

      analytics: {
        totalDonations: donations.length,
        supporters: uniqueSupporters.size,

        goal: totalGoal,
        collected: totalCollected,
        remaining: totalRemaining,
        progress: overallProgress,

        allRequirementsCompleted:
          campaign.allRequirementsCompleted,

        requirements:
          requirementAnalytics,

        completedDeliveries,
        pendingDeliveries,
      },
    });
  } catch (error) {
    console.error(
      "Admin Campaign Details Error:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};
// =====================================================
// ADMIN - GET ALL CAMPAIGNS
// =====================================================

const getAdminCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate(
        "ngo",
        "name email organizationName ngoCategory"
      )
      .sort({ createdAt: -1 });

    res.status(200).json(campaigns);
  } catch (error) {
    console.error(
      "Admin Get All Campaigns Error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch campaigns",
      error: error.message,
    });
  }
};
module.exports = {

  createCampaign,

  getCampaigns,

  getMyCampaigns,

  getCampaignById,

  approveCampaign,

  rejectCampaign,

  addImpactReport,

 donateToCampaign,

    getCampaignDashboardStats,
  
    getCampaignDonations,

    getCampaignManagement,

    deleteCampaign,
    
    updateCampaign,

    getAdminCampaignDetails,
    getAdminCampaigns,
};