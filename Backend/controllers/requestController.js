const Request = require("../models/Request");
const User = require("../models/User");
const Donation = require("../models/Donation");
const sendNotification = require("../utils/sendNotification");
const createAuditLog = require("../utils/createAuditLog");
const Campaign = require("../models/Campaign");
const mongoose = require("mongoose");

// =====================================================
// CREATE DONATION REQUEST
// =====================================================
const createRequest = async (req, res) => {
  try {
    const {
      donationId,
      deliveryMethod,
    } = req.body;

    console.log(
      "========== CREATE REQUEST =========="
    );

    console.log(
      "Donation ID:",
      donationId
    );

    console.log(
      "Delivery Method:",
      deliveryMethod
    );

    console.log(
      "NGO ID:",
      req.user.id
    );

    // =================================================
    // VALIDATE INPUT
    // =================================================

    if (!donationId) {
      return res.status(400).json({
        message:
          "Donation ID is required.",
      });
    }

    if (!deliveryMethod) {
      return res.status(400).json({
        message:
          "Please select a delivery method.",
      });
    }

    // =================================================
    // FIND DONATION
    // =================================================

    const donation =
      await Donation.findById(
        donationId
      );

    if (!donation) {
      return res.status(404).json({
        message:
          "Donation not found.",
      });
    }

    // =================================================
    // DIRECT NGO DONATION PROTECTION
    // =================================================

    /*
      If targetNGO exists, this donation
      was intentionally created for one
      specific NGO.

      Only that NGO is allowed to
      submit a request.
    */

    if (donation.targetNGO) {
      const targetNGOId =
        donation.targetNGO.toString();

      const requestingNGOId =
        req.user.id.toString();

      console.log(
        "DIRECT DONATION TARGET NGO:",
        targetNGOId
      );

      console.log(
        "REQUESTING NGO:",
        requestingNGOId
      );

      if (
        targetNGOId !==
        requestingNGOId
      ) {
        return res.status(403).json({
          message:
            "This donation is reserved for another NGO.",
        });
      }
    }

    // =================================================
    // DONATION CATEGORIES VALIDATION
    // =================================================

    if (
      !Array.isArray(
        donation.categories
      ) ||
      donation.categories.length === 0
    ) {
      return res.status(400).json({
        message:
          "This donation contains no categories.",
      });
    }

    // =================================================
    // DEBUG CATEGORIES
    // =================================================

    console.log(
      "DONATION NAME:",
      donation.donationName
    );

    console.log(
      "DONATION CATEGORIES:",
      donation.categories.map(
        (category) => ({
          itemName:
            category.itemName,

          category:
            category.category,

          quantity:
            category.quantity,

          unit:
            category.unit,

          condition:
            category.condition,
        })
      )
    );

    // =================================================
    // CAMPAIGN DONATION
    // =================================================

    if (donation.campaign) {
      const campaign =
        await Campaign.findById(
          donation.campaign
        );

      if (!campaign) {
        return res.status(404).json({
          message:
            "Campaign associated with this donation was not found.",
        });
      }

      console.log(
        "Campaign ID:",
        campaign._id
      );

      console.log(
        "Campaign NGO:",
        campaign.ngo
      );

      // ===============================================
      // ONLY CAMPAIGN NGO CAN REQUEST
      // ===============================================

      if (
        campaign.ngo.toString() !==
        req.user.id.toString()
      ) {
        return res.status(403).json({
          message:
            "This campaign donation is reserved for the campaign's NGO.",
        });
      }

      // ===============================================
      // CAMPAIGN MUST BE ACTIVE
      // ===============================================

      if (
        campaign.status !==
        "active"
      ) {
        return res.status(400).json({
          message:
            "This campaign is no longer accepting donations.",
        });
      }

      // ===============================================
      // CAMPAIGN REQUIREMENTS
      // ===============================================

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

      // ===============================================
      // VALIDATE EVERY DONATION CATEGORY
      // ===============================================

      for (
        const donationCategory
        of donation.categories
      ) {
        // ---------------------------------------------
        // REQUIREMENT ID
        // ---------------------------------------------

        if (
          !donationCategory
            .campaignRequirement
        ) {
          return res.status(400).json({
            message:
              `Donation category "${donationCategory.category}" is not linked to a campaign requirement.`,
          });
        }

        // ---------------------------------------------
        // FIND REQUIREMENT
        // ---------------------------------------------

        const requirement =
          campaign.requirements.id(
            donationCategory
              .campaignRequirement
          );

        if (!requirement) {
          return res.status(404).json({
            message:
              `Campaign requirement for "${donationCategory.itemName || donationCategory.category}" was not found.`,
          });
        }

        console.log(
          "Campaign Requirement:",
          requirement.itemName
        );

        // ---------------------------------------------
        // ITEM NAME CHECK
        // ---------------------------------------------

        if (
          requirement.itemName &&
          donationCategory.itemName
        ) {
          if (
            donationCategory
              .itemName
              .trim()
              .toLowerCase() !==
            requirement.itemName
              .trim()
              .toLowerCase()
          ) {
            return res.status(400).json({
              message:
                `Donation item "${donationCategory.itemName}" does not match its campaign requirement.`,
            });
          }
        }

        // ---------------------------------------------
        // CATEGORY CHECK
        // ---------------------------------------------

        const donationCategoryName =
          String(
            donationCategory.category ||
              ""
          )
            .trim()
            .toLowerCase();

        const requirementCategory =
          String(
            requirement.category ||
              ""
          )
            .trim()
            .toLowerCase();

        if (
          requirementCategory &&
          donationCategoryName !==
            requirementCategory
        ) {
          return res.status(400).json({
            message:
              `Category mismatch for "${donationCategory.itemName || donationCategory.category}".`,
          });
        }

        // ---------------------------------------------
        // UNIT CHECK
        // ---------------------------------------------

        if (
          donationCategory.unit !==
          requirement.unit
        ) {
          return res.status(400).json({
            message:
              `Donation unit for "${donationCategory.itemName || donationCategory.category}" does not match the campaign requirement.`,
          });
        }

        // ---------------------------------------------
        // REQUIREMENT COMPLETION CHECK
        // ---------------------------------------------

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

        if (
          currentQuantity >=
          goalQuantity
        ) {
          return res.status(400).json({
            message:
              `The campaign requirement "${requirement.itemName}" has already been fulfilled.`,
          });
        }

        // ---------------------------------------------
        // REMAINING QUANTITY CHECK
        // ---------------------------------------------

        const remainingQuantity =
          goalQuantity -
          currentQuantity;

        if (
          Number(
            donationCategory.quantity
          ) >
          remainingQuantity
        ) {
          return res.status(400).json({
            message:
              `Quantity for "${donationCategory.itemName || donationCategory.category}" cannot exceed the remaining campaign requirement of ${remainingQuantity} ${donationCategory.unit}.`,
          });
        }
      }
    }

    // =================================================
    // DELIVERY METHOD
    // =================================================

    if (
      !Array.isArray(
        donation.allowedDeliveryMethods
      ) ||
      donation.allowedDeliveryMethods
        .length === 0
    ) {
      return res.status(400).json({
        message:
          "This donation has no available delivery methods.",
      });
    }

    if (
      !donation.allowedDeliveryMethods.includes(
        deliveryMethod
      )
    ) {
      return res.status(400).json({
        message:
          "Selected delivery method is not allowed by the donor.",
      });
    }

    // =================================================
    // DATE VALIDATION
    // =================================================

    const now =
      new Date();

    if (
      donation.availableFrom &&
      donation.availableFrom >
        now
    ) {
      return res.status(400).json({
        message:
          "This donation is not yet available for requests.",
      });
    }

    if (
      donation.availableUntil &&
      donation.availableUntil <
        now
    ) {
      donation.isExpired =
        true;

      donation.status =
        "expired";

      await donation.save();

      return res.status(400).json({
        message:
          "This donation has expired and can no longer be requested.",
      });
    }

    // =================================================
    // EXPIRY FLAG
    // =================================================

    if (
      donation.isExpired
    ) {
      return res.status(400).json({
        message:
          "This donation has expired and can no longer be requested.",
      });
    }

    // =================================================
    // DONATION AVAILABILITY
    // =================================================

    if (
      donation.status !==
      "available"
    ) {
      return res.status(400).json({
        message:
          "Donation is no longer available.",
      });
    }

    // =================================================
    // DUPLICATE REQUEST
    // =================================================

    const existingRequest =
      await Request.findOne({
        donation:
          donationId,

        ngo:
          req.user.id,
      });

    if (existingRequest) {
      return res.status(400).json({
        message:
          "Request already submitted.",
      });
    }

    // =================================================
    // CREATE REQUEST
    // =================================================

    const request =
      await Request.create({
        donation:
          donationId,

        ngo:
          req.user.id,

        status:
          "pending",

        deliveryMethod,

        deliveryMethodSelectedBy:
          "ngo",

        deliveryMethodStatus:
          "pending",

        assignedVolunteer:
          null,

        deliveryStatus:
          "pending",
      });

    // =================================================
    // UPDATE DONATION STATUS
    // =================================================

    donation.status =
      "requested";

    await donation.save();

    // =================================================
    // DEBUG
    // =================================================

    console.log(
      "========== REQUEST CREATED =========="
    );

    console.log(
      "REQUEST ID:",
      request._id
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
      "TARGET NGO:",
      donation.targetNGO ||
        "PUBLIC DONATION"
    );

    console.log(
      "REQUESTING NGO:",
      req.user.id
    );

    console.log(
      "DONATION CATEGORIES:",
      donation.categories.map(
        (category) => ({
          itemName:
            category.itemName,

          category:
            category.category,

          quantity:
            category.quantity,

          unit:
            category.unit,

          condition:
            category.condition,
        })
      )
    );

    console.log(
      "DELIVERY METHOD:",
      deliveryMethod
    );

    console.log(
      "===================================="
    );

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(201).json({
      message:
        donation.targetNGO
          ? "Direct NGO donation request submitted successfully."
          : "Request submitted successfully.",

      request,
    });

  } catch (error) {
    console.error(
      "CREATE REQUEST ERROR:",
      error
    );

    return res.status(500).json({
      message:
        error.message,
    });
  }
};

// =====================================================
// DONOR - GET REQUESTS FOR MY DONATIONS
// =====================================================

const getDonorRequests = async (req, res) => {
  try {
    // =====================================================
    // FIND DONATIONS CREATED BY THIS DONOR
    // =====================================================

    const donations = await Donation.find({
      donor: req.user.id,
    }).select("_id");

    const donationIds = donations.map(
      (donation) => donation._id
    );

    // =====================================================
    // FIND REQUESTS FOR DONOR'S DONATIONS
    // =====================================================

    const requests = await Request.find({
      donation: {
        $in: donationIds,
      },
    })

      // ===================================================
      // NGO DETAILS
      // ===================================================

      .populate(
        "ngo",
        "name email phone address city state pincode organizationName ngoCategory profileImage"
      )

      // ===================================================
      // DONATION DETAILS
      // ===================================================

      .populate({
        path: "donation",

        // IMPORTANT:
        // donationName is the actual donation title.
        // categories contains itemName, category,
        // quantity, unit and condition.
        select:
          "donationName categories description status donor campaign itemImages pickupProofImage deliveryProofImage availableFrom availableUntil allowedDeliveryMethods createdAt",

        populate: {
          path: "campaign",
          select:
            "title categories status duration startDate endDate",
        },
      })

      // ===================================================
      // ASSIGNED VOLUNTEER DETAILS
      // ===================================================

      .populate(
        "assignedVolunteer",
        "name email phone address city state pincode profileImage vehicleType vehicleNumber vehicleCapacity availability licenseNumber licenseImage vehicleRCImage governmentIdImage"
      )

      // ===================================================
      // SORT NEWEST FIRST
      // ===================================================

      .sort({
        createdAt: -1,
      });

    // =====================================================
    // DEBUG
    // =====================================================

    console.log(
      "========== DONOR REQUESTS =========="
    );

    console.log(
      "DONOR:",
      req.user.id
    );

    console.log(
      "REQUEST COUNT:",
      requests.length
    );

    requests.forEach((request) => {
      console.log(
        "-----------------------------------"
      );

      console.log(
        "REQUEST ID:",
        request._id
      );

      console.log(
        "DONATION ID:",
        request.donation?._id
      );

      console.log(
        "DONATION NAME:",
        request.donation?.donationName
      );

      console.log(
        "DONATION CATEGORIES:",
        request.donation?.categories
      );

      console.log(
        "DESCRIPTION:",
        request.donation?.description
      );

      console.log(
        "NGO:",
        request.ngo?.organizationName ||
          request.ngo?.name
      );

      console.log(
        "ASSIGNED VOLUNTEER:",
        request.assignedVolunteer?.name ||
          "Not assigned"
      );

      console.log(
        "DELIVERY METHOD:",
        request.deliveryMethod
      );

      console.log(
        "DELIVERY STATUS:",
        request.deliveryStatus
      );

      console.log(
        "REQUEST STATUS:",
        request.status
      );
    });

    console.log(
      "==================================="
    );

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json(requests);

  } catch (error) {
    console.error(
      "Get Donor Requests Error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch donor requests.",
      error:
        error.message,
    });
  }
};
const getDonationRequests = async (req, res) => {
  try {
    // =================================================
    // GET DONATIONS CREATED BY THIS DONOR
    // =================================================

    const donations = await Donation.find({
      donor: req.user.id,
    }).select("_id");

    const donationIds = donations.map(
      (donation) => donation._id
    );

    // =================================================
    // GET REQUESTS FOR THOSE DONATIONS
    // =================================================

    const requests = await Request.find({
      donation: {
        $in: donationIds,
      },
    })

      // =================================================
      // NGO DETAILS
      // =================================================

      .populate(
        "ngo",
        "name email phone address city state pincode organizationName ngoCategory"
      )

      // =================================================
      // VOLUNTEER DETAILS
      // =================================================

      .populate(
        "assignedVolunteer",
        `
        name
        email
        phone
        address
        city
        state
        pincode
        vehicleType
        vehicleNumber
        vehicleCapacity
        availability
        licenseNumber
        licenseImage
        governmentIdImage
        vehicleRCImage
        `
      )

      // =================================================
      // DONATION DETAILS
      // NEW DONATION STRUCTURE
      // =================================================

      .populate({
        path: "donation",

        select: `
          donationName
          donor
          categories
          description
          itemImages
          status
          availableFrom
          availableUntil
          allowedDeliveryMethods
          campaign
          pickupProofImage
          deliveryProofImage
          pickedUpAt
          deliveredAt
          createdAt
          updatedAt
        `,

        // =================================================
        // DONOR DETAILS
        // =================================================

        populate: [
          {
            path: "donor",

            select: `
              name
              email
              phone
              address
              city
              state
              pincode
              organizationName
              organizationCategory
              donorType
              gstNumber
              profileImage
            `,
          },

          // =================================================
          // CAMPAIGN DETAILS
          // =================================================

          {
            path: "campaign",

            select: `
              title
              categories
              status
              duration
              startDate
              endDate
              requirements
            `,
          },
        ],
      })

      // =================================================
      // SORT NEWEST FIRST
      // =================================================

      .sort({
        createdAt: -1,
      });

    // =================================================
    // DEBUG
    // =================================================

    console.log(
      "===================================="
    );

    console.log(
      "DONOR REQUESTS:",
      requests.length
    );

    requests.forEach((request) => {
      console.log(
        "------------------------------------"
      );

      console.log(
        "REQUEST ID:",
        request._id
      );

      console.log(
        "REQUEST STATUS:",
        request.status
      );

      console.log(
        "DELIVERY METHOD:",
        request.deliveryMethod
      );

      console.log(
        "DELIVERY STATUS:",
        request.deliveryStatus
      );

      console.log(
        "DELIVERY METHOD STATUS:",
        request.deliveryMethodStatus
      );

      console.log(
        "DONATION ID:",
        request.donation?._id
      );

      console.log(
        "DONATION NAME:",
        request.donation?.donationName
      );

      console.log(
        "DONATION CATEGORIES:",
        request.donation?.categories
      );

      // =================================================
      // LOG ITEM NAMES
      // =================================================

      if (
        Array.isArray(
          request.donation?.categories
        )
      ) {
        request.donation.categories.forEach(
          (category, index) => {
            console.log(
              `CATEGORY ${index + 1}:`,
              {
                itemName:
                  category.itemName,

                category:
                  category.category,

                customCategory:
                  category.customCategory,

                quantity:
                  category.quantity,

                unit:
                  category.unit,

                condition:
                  category.condition,
              }
            );
          }
        );
      }

      console.log(
        "DONATION IMAGES:",
        request.donation?.itemImages
      );

      console.log(
        "DONOR:",
        request.donation?.donor?.name ||
          "Unknown Donor"
      );

      console.log(
        "DONOR EMAIL:",
        request.donation?.donor?.email ||
          "Not available"
      );

      console.log(
        "NGO:",
        request.ngo?.name ||
          request.ngo?.organizationName ||
          "Unknown NGO"
      );

      console.log(
        "VOLUNTEER:",
        request.assignedVolunteer?.name ||
          "Not assigned"
      );
    });

    console.log(
      "===================================="
    );

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json(
      requests
    );

  } catch (error) {
    console.error(
      "Get Donation Requests Error:",
      error
    );

    return res.status(500).json({
      message:
        error.message,
    });
  }
};

const updateRequestStatus = async (
req,
res
) => {
try {

const {
  status,
  deliveryMethod,
} = req.body;

const request =
  await Request.findById(
    req.params.id
  );

if (!request) {
  return res.status(404).json({
    message: "Request not found",
  });
}

request.status = status;

if (deliveryMethod) {
  request.deliveryMethod =
    deliveryMethod;
}

await request.save();

// Update donation status
if (status === "approved") {
  await Donation.findByIdAndUpdate(
    request.donation,
    {
      status: "approved",
    }
  );
  console.log(
    "Donation updated to approved"
  );
}

res.json(request);

} catch (error) {
res.status(500).json({
message: error.message,
});
}
};

// =====================================================
// NGO - GET MY REQUESTS
// =====================================================

const getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({
      ngo: req.user.id,
    })
      // ================================================
      // DONATION DETAILS
      // ================================================
      .populate({
        path: "donation",
        select:
          "items description status donor campaign itemImages pickupProofImage deliveryProofImage availableFrom availableUntil allowedDeliveryMethods createdAt",
        populate: [
          {
            path: "donor",
            select:
              "name organizationName donorType phone email address city state pincode profileImage",
          },
          {
            path: "campaign",
            select:
              "title categories status startDate endDate",
          },
        ],
      })

      // ================================================
      // ASSIGNED VOLUNTEER
      // ================================================
      .populate({
        path: "assignedVolunteer",
        select:
          "name phone email address city state pincode profileImage vehicleType vehicleNumber vehicleCapacity availability licenseNumber",
      })

      // ================================================
      // NEWEST REQUESTS FIRST
      // ================================================
      .sort({
        createdAt: -1,
      });

    // ================================================
    // DEBUG
    // ================================================

    console.log(
      "========== NGO MY REQUESTS =========="
    );

    console.log(
      "NGO:",
      req.user.id
    );

    console.log(
      "REQUEST COUNT:",
      requests.length
    );

    requests.forEach((request) => {
      console.log(
        "REQUEST:",
        request._id
      );

      console.log(
        "DONATION:",
        request.donation?._id
      );

      console.log(
        "ITEM COUNT:",
        request.donation?.items?.length || 0
      );
    });

    // ================================================
    // RESPONSE
    // ================================================

    return res.status(200).json(
      requests
    );

  } catch (error) {
    console.error(
      "Get My Requests Error:",
      error
    );

    return res.status(500).json({
      message:
        error.message,
    });
  }
};
const confirmReceived = async (req, res) => {
  try {
    // =====================================================
    // FIND REQUEST
    // =====================================================

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Request not found.",
      });
    }

    console.log("========== CONFIRM RECEIVED ==========");
    console.log("REQUEST ID:", request._id);
    console.log("NGO:", request.ngo);
    console.log("REQUEST STATUS:", request.status);
    console.log("DELIVERY METHOD:", request.deliveryMethod);
    console.log("DELIVERY STATUS:", request.deliveryStatus);

    // =====================================================
    // NGO AUTHORIZATION
    // =====================================================

    if (
      !request.ngo ||
      request.ngo.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({
        message:
          "You are not authorized to confirm this donation.",
      });
    }

    // =====================================================
    // FIND DONATION
    // =====================================================

    const donation = await Donation.findById(
      request.donation
    );

    if (!donation) {
      return res.status(404).json({
        message: "Donation not found.",
      });
    }

    console.log("DONATION ID:", donation._id);
    console.log("DONATION NAME:", donation.donationName);
    console.log("DONATION STATUS:", donation.status);
    console.log("CATEGORIES:", donation.categories);

    // =====================================================
    // PREVENT DOUBLE CONFIRMATION
    // =====================================================

    if (
      request.deliveryStatus === "received" ||
      request.deliveryStatus === "completed" ||
      request.status === "completed"
    ) {
      return res.status(400).json({
        message:
          "This donation has already been confirmed.",
      });
    }

    // =====================================================
    // REQUEST STATUS VALIDATION
    // =====================================================

    if (
      request.status !== "approved" &&
      request.status !== "pending"
    ) {
      return res.status(400).json({
        message:
          `This request cannot be confirmed because its status is ${request.status}.`,
      });
    }

    // =====================================================
    // DELIVERY WORKFLOW VALIDATION
    // =====================================================

    /*
      NGO PICKUP
      -----------
      approved + pending
              ↓
      NGO collects donation
              ↓
          received
              ↓
          completed


      VOLUNTEER / DONOR DELIVERY
      --------------------------
      approved + delivered
              ↓
      NGO confirms receipt
              ↓
          received
              ↓
          completed
    */

    const isNgoPickup =
      request.deliveryMethod === "ngo_pickup";

    if (isNgoPickup) {
      // ===================================================
      // NGO PICKUP
      // ===================================================

      if (
        request.deliveryStatus !== "pending"
      ) {
        return res.status(400).json({
          message:
            `This NGO pickup cannot be confirmed from its current delivery status: ${request.deliveryStatus}.`,
        });
      }
    } else {
      // ===================================================
      // VOLUNTEER / DONOR DELIVERY
      // ===================================================

      if (
        request.deliveryStatus !== "delivered"
      ) {
        return res.status(400).json({
          message:
            "Donation must be delivered before it can be confirmed.",
        });
      }
    }

    // =====================================================
    // CAMPAIGN VALIDATION
    // IMPORTANT:
    // Validate campaign BEFORE changing request/donation
    // status so we don't leave partial updates.
    // =====================================================

    let campaign = null;
    let updatedCampaign = null;

    if (donation.campaign) {
      campaign = await Campaign.findById(
        donation.campaign
      );

      if (!campaign) {
        return res.status(404).json({
          message:
            "Campaign associated with this donation was not found.",
        });
      }

      // ===================================================
      // DONATION CATEGORIES
      // ===================================================

      if (
        !Array.isArray(donation.categories) ||
        donation.categories.length === 0
      ) {
        return res.status(400).json({
          message:
            "This campaign donation contains no donation categories.",
        });
      }

      // ===================================================
      // CAMPAIGN REQUIREMENTS
      // ===================================================

      if (
        !Array.isArray(campaign.requirements) ||
        campaign.requirements.length === 0
      ) {
        return res.status(400).json({
          message:
            "This campaign has no donation requirements.",
        });
      }

      // ===================================================
      // VALIDATE EVERY DONATION CATEGORY
      // ===================================================

      for (
        const donationCategory of donation.categories
      ) {
        const donationCategoryValue =
          String(
            donationCategory.category || ""
          )
            .trim()
            .toLowerCase();

        const donationCustomCategory =
          String(
            donationCategory.customCategory || ""
          )
            .trim()
            .toLowerCase();

        const donationItemName =
          String(
            donationCategory.itemName || ""
          )
            .trim()
            .toLowerCase();

        const donationUnit =
          String(
            donationCategory.unit || ""
          )
            .trim()
            .toLowerCase();

        const donationCategoryName =
          donationCategoryValue === "other" &&
          donationCustomCategory
            ? donationCustomCategory
            : donationCategoryValue;

        const donationQuantity =
          Number(
            donationCategory.quantity || 0
          );

        // =================================================
        // FIND MATCHING REQUIREMENT
        // =================================================

        const requirement =
          campaign.requirements.find(
            (item) => {
              const requirementCategory =
                String(
                  item.category || ""
                )
                  .trim()
                  .toLowerCase();

              const requirementItemName =
                String(
                  item.itemName || ""
                )
                  .trim()
                  .toLowerCase();

              const requirementUnit =
                String(
                  item.unit || ""
                )
                  .trim()
                  .toLowerCase();

              const categoryMatches =
                requirementCategory ===
                donationCategoryValue;

              const itemNameMatches =
                !requirementItemName ||
                requirementItemName ===
                  donationItemName;

              const unitMatches =
                !requirementUnit ||
                requirementUnit ===
                  donationUnit;

              const customCategoryMatches =
                donationCategoryValue !== "other" ||
                !donationCustomCategory ||
                donationCustomCategory ===
                  requirementCategory ||
                donationCustomCategory ===
                  requirementItemName;

              return (
                categoryMatches &&
                itemNameMatches &&
                unitMatches &&
                customCategoryMatches
              );
            }
          );

        if (!requirement) {
          return res.status(400).json({
            message:
              `Campaign requirement for "${donationItemName || donationCategoryName}" was not found.`,
          });
        }

        console.log(
          "MATCHED REQUIREMENT:",
          requirement.itemName ||
            requirement.category
        );

        // =================================================
        // VERIFY CATEGORY
        // =================================================

        if (
          requirement.category &&
          String(
            requirement.category
          )
            .trim()
            .toLowerCase() !==
            donationCategoryValue
        ) {
          return res.status(400).json({
            message:
              `Category mismatch for "${donationCategoryName}".`,
          });
        }

        // =================================================
        // VERIFY ITEM NAME
        // =================================================

        if (
          requirement.itemName &&
          donationCategory.itemName
        ) {
          if (
            requirement.itemName
              .trim()
              .toLowerCase() !==
            donationCategory.itemName
              .trim()
              .toLowerCase()
          ) {
            return res.status(400).json({
              message:
                `Item "${donationCategory.itemName}" does not match the campaign requirement.`,
            });
          }
        }

        // =================================================
        // VERIFY UNIT
        // =================================================

        if (
          requirement.unit &&
          String(
            requirement.unit
          )
            .trim()
            .toLowerCase() !==
            donationUnit
        ) {
          return res.status(400).json({
            message:
              `Unit mismatch for "${donationCategoryName}".`,
          });
        }

        // =================================================
        // VERIFY QUANTITY
        // =================================================

        const currentQuantity =
          Number(
            requirement.currentQuantity || 0
          );

        const goalQuantity =
          Number(
            requirement.goalQuantity || 0
          );

        if (
          currentQuantity >=
          goalQuantity
        ) {
          return res.status(400).json({
            message:
              `The campaign requirement "${requirement.itemName || requirement.category}" has already been fulfilled.`,
          });
        }

        if (
          donationQuantity <= 0
        ) {
          return res.status(400).json({
            message:
              `Invalid donation quantity for "${donationCategoryName}".`,
          });
        }
      }
    }

    // =====================================================
    // UPDATE REQUEST
    // =====================================================

    request.deliveryStatus =
      "received";

    request.status =
      "completed";

    await request.save();

    // =====================================================
    // UPDATE DONATION
    // =====================================================

    donation.status =
      "completed";

    /*
      For NGO Pickup, this represents the
      time the NGO collected/received it.

      For other delivery methods, it is the
      confirmation time.
    */

    donation.deliveredAt =
      donation.deliveredAt ||
      new Date();

    if (isNgoPickup) {
      donation.pickedUpAt =
        donation.pickedUpAt ||
        new Date();
    }

    await donation.save();

    // =====================================================
    // UPDATE CAMPAIGN
    // =====================================================

    if (campaign) {
      for (
        const donationCategory of donation.categories
      ) {
        const donationCategoryValue =
          String(
            donationCategory.category || ""
          )
            .trim()
            .toLowerCase();

        const donationCustomCategory =
          String(
            donationCategory.customCategory || ""
          )
            .trim()
            .toLowerCase();

        const donationItemName =
          String(
            donationCategory.itemName || ""
          )
            .trim()
            .toLowerCase();

        const donationUnit =
          String(
            donationCategory.unit || ""
          )
            .trim()
            .toLowerCase();

        const donationCategoryName =
          donationCategoryValue === "other" &&
          donationCustomCategory
            ? donationCustomCategory
            : donationCategoryValue;

        const donationQuantity =
          Number(
            donationCategory.quantity || 0
          );

        const requirement =
          campaign.requirements.find(
            (item) => {
              const requirementCategory =
                String(
                  item.category || ""
                )
                  .trim()
                  .toLowerCase();

              const requirementItemName =
                String(
                  item.itemName || ""
                )
                  .trim()
                  .toLowerCase();

              const requirementUnit =
                String(
                  item.unit || ""
                )
                  .trim()
                  .toLowerCase();

              const categoryMatches =
                requirementCategory ===
                donationCategoryValue;

              const itemNameMatches =
                !requirementItemName ||
                requirementItemName ===
                  donationItemName;

              const unitMatches =
                !requirementUnit ||
                requirementUnit ===
                  donationUnit;

              const customCategoryMatches =
                donationCategoryValue !== "other" ||
                !donationCustomCategory ||
                donationCustomCategory ===
                  requirementCategory ||
                donationCustomCategory ===
                  requirementItemName;

              return (
                categoryMatches &&
                itemNameMatches &&
                unitMatches &&
                customCategoryMatches
              );
            }
          );

        if (!requirement) {
          return res.status(400).json({
            message:
              `Campaign requirement for "${donationCategoryName}" was not found while updating the campaign.`,
          });
        }

        const currentQuantity =
          Number(
            requirement.currentQuantity || 0
          );

        const goalQuantity =
          Number(
            requirement.goalQuantity || 0
          );

        requirement.currentQuantity =
          Math.min(
            goalQuantity,
            currentQuantity +
              donationQuantity
          );

        console.log(
          "UPDATED CAMPAIGN REQUIREMENT:",
          {
            itemName:
              requirement.itemName,
            category:
              requirement.category,
            previousQuantity:
              currentQuantity,
            donatedQuantity:
              donationQuantity,
            newQuantity:
              requirement.currentQuantity,
            goalQuantity,
          }
        );
      }

      // ===================================================
      // CHECK ALL REQUIREMENTS
      // ===================================================

      const allCompleted =
        campaign.requirements.every(
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

      // ===================================================
      // UPDATE CAMPAIGN STATUS
      // ===================================================

      if (allCompleted) {
        campaign.status =
          "completed";
      }

      // ===================================================
      // SAVE CAMPAIGN
      // ===================================================

      await campaign.save();

      updatedCampaign =
        campaign;

      // ===================================================
      // CAMPAIGN NOTIFICATION
      // ===================================================

      try {
        await sendNotification(
          campaign.ngo,

          allCompleted
            ? "Campaign Completed"
            : "Campaign Donation Received",

          allCompleted
            ? `All requirements for "${campaign.title}" have been fulfilled.`
            : `A donation has been received for "${campaign.title}".`,

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
    // NOTIFY DONOR
    // =====================================================

    try {
      await sendNotification(
        donation.donor,

        "Donation Received",

        `"${donation.donationName}" has been received and confirmed by the NGO.`,

        "success",

        "/my-donations"
      );
    } catch (
      notificationError
    ) {
      console.error(
        "Donor notification error:",
        notificationError.message
      );
    }

    // =====================================================
    // AUDIT LOG
    // =====================================================

    try {
      await createAuditLog(
        req.user.id,

        "Donation Completed",

        `NGO confirmed receipt of donation "${donation._id}".`,

        donation.donor,

        donation._id
      );
    } catch (
      auditError
    ) {
      console.error(
        "Audit log error:",
        auditError.message
      );
    }

    // =====================================================
    // DEBUG
    // =====================================================

    console.log(
      "=========================================="
    );

    console.log(
      "DONATION RECEIVED SUCCESSFULLY"
    );

    console.log(
      "REQUEST ID:",
      request._id
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
      "DELIVERY METHOD:",
      request.deliveryMethod
    );

    console.log(
      "DELIVERY STATUS:",
      request.deliveryStatus
    );

    console.log(
      "REQUEST STATUS:",
      request.status
    );

    console.log(
      "DONATION STATUS:",
      donation.status
    );

    console.log(
      "=========================================="
    );

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      message:
        "Donation received successfully.",

      request,

      donation,

      campaign:
        updatedCampaign,

      campaignCompleted:
        updatedCampaign
          ? updatedCampaign.status ===
            "completed"
          : false,
    });
  } catch (error) {
    console.error(
      "Confirm Received Error:",
      error
    );

    return res.status(500).json({
      message:
        error.message,
    });
  }
};

const getVolunteerDeliveries = async (req, res) => {
  try {

    const requests = await Request.find({
      status: "approved",
      deliveryMethod: "volunteer_delivery",
      volunteer: null,
    })
      .populate({
  path: "donation",
  populate: {
    path: "donor",
    select: "name email phone address city state pincode organizationName ngoCategory vehicleType vehicleNumber vehicleCapacity availability licenseNumber",
  },
})
.populate(
  "ngo",
  "name email phone address city state pincode organizationName ngoCategory "
);
    res.json(requests);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};
const getMyDeliveries = async (req, res) => {
  try {

    const requests = await Request.find({
      assignedVolunteer: req.user.id,
    })
    .populate({
      path: "donation",
      populate: {
        path: "donor",
        select: "name email phone address city state pincode organizationName ngoCategory vehicleType vehicleNumber vehicleCapacity availability licenseNumber",
      },
    })
    .populate(
      "ngo",
      "name email phone address city state pincode organizationName ngoCategory "
    );

    res.json(requests);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

const acceptDelivery = async (req, res) => {
  try {

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Request not found.",
      });
    }

    // Only assigned volunteer can accept
    if (
      !request.assignedVolunteer ||
      request.assignedVolunteer.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "Not authorized.",
      });
    }

    if (request.deliveryStatus !== "volunteer_assigned") {
      return res.status(400).json({
        message: "Delivery has already been accepted.",
      });
    }

    request.deliveryStatus = "volunteer_accepted";

    await request.save();
    const donation = await Donation.findById(request.donation);

await sendNotification(
  donation.donor,
  "Volunteer Accepted",
  "The volunteer has accepted your delivery assignment.",
  "info"
);

    res.json({
      message: "Delivery accepted successfully.",
      request,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

const declineDelivery = async (req, res) => {
  try {

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Request not found.",
      });
    }

    // Only assigned volunteer can decline
    if (
      !request.assignedVolunteer ||
      request.assignedVolunteer.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "Not authorized.",
      });
    }

    if (request.deliveryStatus !== "volunteer_assigned") {
      return res.status(400).json({
        message: "Delivery cannot be declined now.",
      });
    }

    // Remove volunteer assignment
    request.assignedVolunteer = null;

    request.deliveryStatus = "pending";

    await request.save();

    res.json({
      message: "Delivery declined. Donor can assign another volunteer.",
      request,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

const updateDeliveryStatus = async (req, res) => {
  try {

    const { deliveryStatus } = req.body;

    const proofImage = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Request not found.",
      });
    }

    // Only assigned volunteer can update
    if (
      !request.assignedVolunteer ||
      request.assignedVolunteer.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "Not authorized.",
      });
    }

    const donation = await Donation.findById(request.donation);

    if (!donation) {
      return res.status(404).json({
        message: "Donation not found.",
      });
    }

    // Volunteer Accepted -> Picked Up
    if (
      request.deliveryStatus === "volunteer_accepted" &&
      deliveryStatus === "picked_up"
    ) {

      if (!proofImage) {
        return res.status(400).json({
          message: "Pickup proof photo is required.",
        });
      }

      request.deliveryStatus = "picked_up";

      donation.pickupProofImage = proofImage;
      donation.pickedUpAt = new Date();

      await donation.save();

    }

    // Picked Up -> Delivered
    else if (
      request.deliveryStatus === "picked_up" &&
      deliveryStatus === "delivered"
    ) {

      if (!proofImage) {
        return res.status(400).json({
          message: "Delivery proof photo is required.",
        });
      }

      request.deliveryStatus = "delivered";

      donation.deliveryProofImage = proofImage;
      donation.deliveredAt = new Date();

      await donation.save();

      await sendNotification(
        donation.donor,
        "Delivery Completed",
        "Your donation has been delivered successfully.",
        "success"
      );

      await sendNotification(
        request.ngo,
        "Donation Delivered",
        "Your requested donation has been delivered.",
        "success"
      );

    }

    else {

      return res.status(400).json({
        message: "Invalid delivery status transition.",
      });

    }

    await request.save();

    res.json({
      message: "Delivery status updated successfully.",
      request,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message,
    });

  }
};
const getNgoDashboardStats = async (req, res) => {
  try {
    const ngoId = req.user.id;

    // =====================================================
    // AVAILABLE DONATIONS
    // =====================================================

    const availableDonations =
      await Donation.countDocuments({
        status: "available",
        availableFrom: {
          $lte: new Date(),
        },
        availableUntil: {
          $gte: new Date(),
        },
        isExpired: false,
      });

    // =====================================================
    // NGO REQUESTS
    // =====================================================

    const requests =
      await Request.find({
        ngo: ngoId,
      })
        .populate({
          path: "donation",
          select:
            "itemName category quantity unit status donor createdAt",
          populate: {
            path: "donor",
            select:
              "name organizationName donorType",
          },
        })
        .populate({
          path: "assignedVolunteer",
          select:
            "name email phone vehicleType vehicleNumber",
        })
        .sort({
          updatedAt: -1,
        });

    // =====================================================
    // MY REQUESTS
    // =====================================================

    const myRequests =
      requests.length;

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
    // RECEIVED DONATIONS
    // =====================================================

    const receivedDonations =
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

    requests.forEach((request) => {
      const itemName =
        request.donation?.itemName ||
        "Donation";

      const donorName =
        request.donation?.donor
          ?.organizationName ||
        request.donation?.donor?.name ||
        "Donor";

      // ===================================================
      // REQUEST CREATED
      // ===================================================

      recentActivity.push({
        type: "request_created",

        title: "Donation Requested",

        description:
          `You requested ${itemName} from ${donorName}.`,

        icon: "bi-box",

        color: "primary",

        createdAt:
          request.createdAt,

        requestId:
          request._id,

        donationId:
          request.donation?._id,

        itemName,
      });

      // ===================================================
      // REQUEST APPROVED
      // ===================================================

      if (
        request.status === "approved"
      ) {
        recentActivity.push({
          type: "request_approved",

          title: "Request Approved",

          description:
            `Your request for ${itemName} was approved.`,

          icon:
            "bi-check-circle-fill",

          color: "success",

          createdAt:
            request.updatedAt,

          requestId:
            request._id,

          donationId:
            request.donation?._id,

          itemName,
        });
      }

      // ===================================================
      // REQUEST REJECTED
      // ===================================================

      if (
        request.status === "rejected"
      ) {
        recentActivity.push({
          type: "request_rejected",

          title: "Request Rejected",

          description:
            `Your request for ${itemName} was rejected.`,

          icon:
            "bi-x-circle-fill",

          color: "danger",

          createdAt:
            request.updatedAt,

          requestId:
            request._id,

          donationId:
            request.donation?._id,

          itemName,
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
          "A volunteer";

        recentActivity.push({
          type:
            "volunteer_assigned",

          title:
            "Volunteer Assigned",

          description:
            `${volunteerName} was assigned to deliver ${itemName}.`,

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

          itemName,
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
            `${volunteerName} accepted the delivery for ${itemName}.`,

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

          itemName,
        });
      }

      // ===================================================
      // PICKED UP
      // ===================================================

      if (
        request.deliveryStatus ===
        "picked_up"
      ) {
        const volunteerName =
          request.assignedVolunteer?.name ||
          "The volunteer";

        recentActivity.push({
          type:
            "picked_up",

          title:
            "Donation Picked Up",

          description:
            `${volunteerName} picked up ${itemName}.`,

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

          itemName,
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
            "donation_delivered",

          title:
            "Donation Delivered",

          description:
            `${itemName} has been delivered to your NGO.`,

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

          itemName,
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
            "donation_received",

          title:
            "Donation Received",

          description:
            `You confirmed receipt of ${itemName}.`,

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

          itemName,
        });
      }
    });

    // =====================================================
    // SORT ACTIVITY
    // =====================================================

    recentActivity.sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );

    // =====================================================
    // SHOW LATEST 8
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
      "======================================"
    );

    console.log(
      "NGO DASHBOARD STATS"
    );

    console.log(
      "NGO ID:",
      ngoId
    );

    console.log(
      "Available Donations:",
      availableDonations
    );

    console.log(
      "My Requests:",
      myRequests
    );

    console.log(
      "Active Deliveries:",
      activeDeliveries
    );

    console.log(
      "Received Donations:",
      receivedDonations
    );

    console.log(
      "Recent Activity:",
      latestActivity
    );

    console.log(
      "======================================"
    );

    // =====================================================
    // RESPONSE
    // =====================================================

    res.status(200).json({
      availableDonations,

      myRequests,

      activeDeliveries,

      receivedDonations,

      recentActivity:
        latestActivity,
    });

  } catch (error) {
    console.error(
      "Get NGO Dashboard Stats Error:",
      error
    );

    res.status(500).json({
      message:
        error.message,
    });
  }
};
const getVolunteerDashboardStats = async (req, res) => {
  try {
    const volunteerId = req.user.id;

    // =====================================================
    // GET ASSIGNED DELIVERIES
    // =====================================================

    const deliveries = await Request.find({
      assignedVolunteer: volunteerId,
    })
      .populate({
        path: "donation",
        select:
          "itemName category quantity unit status donor",
        populate: {
          path: "donor",
          select:
            "name organizationName donorType phone city state",
        },
      })
      .populate({
        path: "ngo",
        select:
          "name organizationName ngoCategory phone city state",
      })
      .sort({
        updatedAt: -1,
      });

    // =====================================================
    // MY DELIVERIES
    // =====================================================

    const myDeliveries =
      deliveries.length;

    // =====================================================
    // ACTIVE DELIVERIES
    // =====================================================

    const activeStatuses = [
      "volunteer_assigned",
      "volunteer_accepted",
      "picked_up",
      "delivered",
    ];

    const activeDeliveries =
      deliveries.filter(
        (delivery) =>
          activeStatuses.includes(
            delivery.deliveryStatus
          )
      ).length;

    // =====================================================
    // COMPLETED DELIVERIES
    // =====================================================

    const completedDeliveries =
      deliveries.filter(
        (delivery) =>
          delivery.deliveryStatus ===
            "completed" ||
          delivery.deliveryStatus ===
            "received" ||
          delivery.status ===
            "completed"
      ).length;

    // =====================================================
    // RECENT ACTIVITY
    // =====================================================

    const recentActivity = [];

    deliveries.forEach((delivery) => {
      const itemName =
        delivery.donation?.itemName ||
        "Donation";

      const donorName =
        delivery.donation?.donor
          ?.organizationName ||
        delivery.donation?.donor?.name ||
        "Donor";

      const ngoName =
        delivery.ngo?.organizationName ||
        delivery.ngo?.name ||
        "NGO";

      // ===================================================
      // ASSIGNED
      // ===================================================

      recentActivity.push({
        type:
          "delivery_assigned",

        title:
          "Delivery Assigned",

        description:
          `You were assigned to deliver ${itemName} from ${donorName} to ${ngoName}.`,

        icon:
          "bi-truck",

        color:
          "primary",

        createdAt:
          delivery.createdAt,

        requestId:
          delivery._id,

        donationId:
          delivery.donation?._id,

        itemName,
      });

      // ===================================================
      // ACCEPTED
      // ===================================================

      if (
        delivery.deliveryStatus ===
          "volunteer_accepted" ||
        delivery.deliveryStatus ===
          "picked_up" ||
        delivery.deliveryStatus ===
          "delivered" ||
        delivery.deliveryStatus ===
          "received" ||
        delivery.deliveryStatus ===
          "completed"
      ) {
        recentActivity.push({
          type:
            "delivery_accepted",

          title:
            "Delivery Accepted",

          description:
            `You accepted the delivery of ${itemName}.`,

          icon:
            "bi-check-circle-fill",

          color:
            "info",

          createdAt:
            delivery.updatedAt,

          requestId:
            delivery._id,

          donationId:
            delivery.donation?._id,

          itemName,
        });
      }

      // ===================================================
      // PICKED UP
      // ===================================================

      if (
        delivery.deliveryStatus ===
          "picked_up" ||
        delivery.deliveryStatus ===
          "delivered" ||
        delivery.deliveryStatus ===
          "received" ||
        delivery.deliveryStatus ===
          "completed"
      ) {
        recentActivity.push({
          type:
            "package_picked_up",

          title:
            "Package Picked Up",

          description:
            `You picked up ${itemName} from ${donorName}.`,

          icon:
            "bi-box-seam-fill",

          color:
            "warning",

          createdAt:
            delivery.updatedAt,

          requestId:
            delivery._id,

          donationId:
            delivery.donation?._id,

          itemName,
        });
      }

      // ===================================================
      // DELIVERED
      // ===================================================

      if (
        delivery.deliveryStatus ===
          "delivered" ||
        delivery.deliveryStatus ===
          "received" ||
        delivery.deliveryStatus ===
          "completed"
      ) {
        recentActivity.push({
          type:
            "delivery_completed",

          title:
            "Donation Delivered",

          description:
            `${itemName} was delivered to ${ngoName}.`,

          icon:
            "bi-truck",

          color:
            "info",

          createdAt:
            delivery.updatedAt,

          requestId:
            delivery._id,

          donationId:
            delivery.donation?._id,

          itemName,
        });
      }

      // ===================================================
      // COMPLETED
      // ===================================================

      if (
        delivery.deliveryStatus ===
          "received" ||
        delivery.deliveryStatus ===
          "completed" ||
        delivery.status ===
          "completed"
      ) {
        recentActivity.push({
          type:
            "delivery_finished",

          title:
            "Delivery Completed",

          description:
            `Delivery of ${itemName} has been completed successfully.`,

          icon:
            "bi-check-circle-fill",

          color:
            "success",

          createdAt:
            delivery.updatedAt,

          requestId:
            delivery._id,

          donationId:
            delivery.donation?._id,

          itemName,
        });
      }
    });

    // =====================================================
    // SORT ACTIVITY
    // =====================================================

    recentActivity.sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );

    // =====================================================
    // LATEST 8
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
      "======================================"
    );

    console.log(
      "VOLUNTEER DASHBOARD"
    );

    console.log(
      "Volunteer ID:",
      volunteerId
    );

    console.log(
      "My Deliveries:",
      myDeliveries
    );

    console.log(
      "Active Deliveries:",
      activeDeliveries
    );

    console.log(
      "Completed Deliveries:",
      completedDeliveries
    );

    console.log(
      "Recent Activity:",
      latestActivity
    );

    console.log(
      "======================================"
    );

    // =====================================================
    // RESPONSE
    // =====================================================

    res.status(200).json({
      availableDeliveries: 0,

      myDeliveries,

      activeDeliveries,

      completedDeliveries,

      recentActivity:
        latestActivity,
    });

  } catch (error) {
    console.error(
      "Get Volunteer Dashboard Stats Error:",
      error
    );

    res.status(500).json({
      message:
        error.message,
    });
  }
};


// =====================================================
// ACCEPT DONATION REQUEST
// =====================================================
const acceptRequest = async (req, res) => {
  try {
    // ==========================================
    // FIND REQUEST
    // ==========================================

    const request = await Request.findById(
      req.params.id
    );

    if (!request) {
      return res.status(404).json({
        message: "Request not found.",
      });
    }

    // ==========================================
    // FIND DONATION
    // ==========================================

    const donation =
      await Donation.findById(
        request.donation
      );

    if (!donation) {
      return res.status(404).json({
        message: "Donation not found.",
      });
    }

    // ==========================================
    // DONOR AUTHORIZATION
    // ==========================================

    if (
      donation.donor.toString() !==
      req.user.id.toString()
    ) {
      return res.status(403).json({
        message: "Not authorized.",
      });
    }

    // ==========================================
    // REQUEST STATUS CHECK
    // ==========================================

    if (request.status !== "pending") {
      return res.status(400).json({
        message:
          `This request is already ${request.status}.`,
      });
    }

    // ==========================================
    // DONATION STATUS CHECK
    // ==========================================

    if (
      donation.status !== "requested"
    ) {
      return res.status(400).json({
        message:
          "This donation is no longer waiting for approval.",
      });
    }

    // ==========================================
    // VERIFY DONATION HAS CATEGORIES
    // ==========================================

    if (
      !Array.isArray(
        donation.categories
      ) ||
      donation.categories.length === 0
    ) {
      return res.status(400).json({
        message:
          "This donation contains no categories.",
      });
    }

    // ==========================================
    // DEBUG DONATION
    // ==========================================

    console.log(
      "========== ACCEPT REQUEST =========="
    );

    console.log(
      "REQUEST ID:",
      request._id
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
      donation.categories.map(
        (category) => ({
          category:
            category.category,
          customCategory:
            category.customCategory,
          quantity:
            category.quantity,
          unit:
            category.unit,
          condition:
            category.condition,
        })
      )
    );

    console.log(
      "DELIVERY METHOD:",
      request.deliveryMethod
    );

    // ==========================================
    // APPROVE SELECTED REQUEST
    // ==========================================

    request.status =
      "approved";

    request.deliveryStatus =
      "pending";

    await request.save();

    // ==========================================
    // REJECT OTHER PENDING REQUESTS
    // ==========================================

    await Request.updateMany(
      {
        donation:
          donation._id,

        _id: {
          $ne:
            request._id,
        },

        status:
          "pending",
      },
      {
        $set: {
          status:
            "rejected",
        },
      }
    );

    // ==========================================
    // UPDATE DONATION STATUS
    // ==========================================

    donation.status =
      "approved";

    await donation.save();

    // ==========================================
    // NOTIFY NGO
    // ==========================================

    try {
      await sendNotification(
        request.ngo,

        "Donation Approved",

        `Your request for "${donation.donationName}" has been approved by the donor.`,

        "success",

        "/my-requests"
      );
    } catch (
      notificationError
    ) {
      console.error(
        "Approval notification error:",
        notificationError.message
      );
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      message:
        "Request approved successfully.",

      request,
    });

  } catch (error) {
    console.error(
      "Accept Request Error:",
      error
    );

    return res.status(500).json({
      message:
        error.message,
    });
  }
};

// =====================================================
// REJECT DONATION REQUEST
// =====================================================

const rejectRequest = async (req, res) => {
  try {
    // ==========================================
    // FIND REQUEST
    // ==========================================

    const request =
      await Request.findById(
        req.params.id
      );

    if (!request) {
      return res.status(404).json({
        message:
          "Request not found.",
      });
    }

    // ==========================================
    // FIND DONATION
    // ==========================================

    const donation =
      await Donation.findById(
        request.donation
      );

    if (!donation) {
      return res.status(404).json({
        message:
          "Donation not found.",
      });
    }

    // ==========================================
    // DONOR AUTHORIZATION
    // ==========================================

    if (
      donation.donor.toString() !==
      req.user.id.toString()
    ) {
      return res.status(403).json({
        message:
          "Not authorized.",
      });
    }

    // ==========================================
    // REQUEST STATUS CHECK
    // ==========================================

    if (
      request.status !==
      "pending"
    ) {
      return res.status(400).json({
        message:
          `This request is already ${request.status}.`,
      });
    }

    // ==========================================
    // REJECT REQUEST
    // ==========================================

    request.status =
      "rejected";

    await request.save();

    // ==========================================
    // NOTIFY NGO
    // ==========================================

    try {
      await sendNotification(
        request.ngo,

        "Donation Rejected",

        "Your donation request has been rejected by the donor.",

        "error",

        "/my-requests"
      );
    } catch (
      notificationError
    ) {
      console.error(
        "Rejection notification error:",
        notificationError.message
      );
    }

    // ==========================================
    // KEEP DONATION AVAILABLE WHEN APPROPRIATE
    // ==========================================
    //
    // If this was the only pending request,
    // allow another NGO to request the donation.
    //
    // ==========================================

    const remainingPendingRequests =
      await Request.countDocuments({
        donation:
          donation._id,

        status:
          "pending",
      });

    if (
      remainingPendingRequests ===
        0 &&
      donation.status ===
        "requested"
    ) {
      donation.status =
        "available";

      await donation.save();
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      message:
        "Request rejected successfully.",

      request,
    });

  } catch (error) {
    console.error(
      "Reject Request Error:",
      error
    );

    return res.status(500).json({
      message:
        error.message,
    });
  }
};
const markDonorDelivered = async (req, res) => {

  try {

    const request = await Request.findById(req.params.id)
      .populate("donation");

    if (!request) {

      return res.status(404).json({
        message: "Request not found.",
      });

    }

    const donation = await Donation.findById(
      request.donation._id
    );

    if (donation.donor.toString() !== req.user.id) {

      return res.status(403).json({
        message: "Not authorized.",
      });

    }

    if (request.deliveryMethod !== "donor_self") {

      return res.status(400).json({
        message:
          "This request is not using Donor Delivery.",
      });

    }

    request.deliveryStatus = "delivered";

    await request.save();

    res.json({
      message:
        "Donation marked as delivered.",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};const assignVolunteer = async (req, res) => {
  try {
    const { volunteerId } = req.body;

    // =====================================================
    // VALIDATE VOLUNTEER ID
    // =====================================================

    if (!volunteerId) {
      return res.status(400).json({
        message: "Volunteer ID is required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(volunteerId)) {
      return res.status(400).json({
        message: "Invalid volunteer ID.",
      });
    }

    // =====================================================
    // FIND REQUEST
    // =====================================================

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Request not found.",
      });
    }

    // =====================================================
    // REQUEST STATUS
    // =====================================================

    if (request.status !== "approved") {
      return res.status(400).json({
        message:
          "Request must be approved before assigning a volunteer.",
      });
    }

    // =====================================================
    // DELIVERY METHOD
    // =====================================================

    if (request.deliveryMethod !== "volunteer") {
      return res.status(400).json({
        message:
          "A volunteer can only be assigned to volunteer delivery requests.",
      });
    }

    // =====================================================
    // CHECK EXISTING ASSIGNMENT
    // =====================================================

    if (
      request.assignedVolunteer &&
      request.deliveryStatus === "volunteer_assigned"
    ) {
      return res.status(400).json({
        message:
          "A volunteer is already assigned to this request.",
      });
    }

    // =====================================================
    // FIND VOLUNTEER
    // =====================================================

    const volunteer = await User.findById(volunteerId).select(
      "-password"
    );

    if (!volunteer) {
      return res.status(404).json({
        message: "Volunteer not found.",
      });
    }

    // =====================================================
    // ROLE CHECK
    // =====================================================

    if (volunteer.role !== "volunteer") {
      return res.status(400).json({
        message: "Selected user is not a volunteer.",
      });
    }

    // =====================================================
    // ACCOUNT STATUS CHECK
    // =====================================================

    if (volunteer.isDeleted) {
      return res.status(400).json({
        message:
          "This volunteer account has been deleted.",
      });
    }

    if (volunteer.isBlocked) {
      return res.status(400).json({
        message:
          "This volunteer account is blocked.",
      });
    }

    if (!volunteer.isApproved) {
      return res.status(400).json({
        message:
          "This volunteer has not been approved yet.",
      });
    }

    // =====================================================
    // AVAILABILITY / SCHEDULE CHECK
    // =====================================================
    //
    // "availability" currently represents schedules such as:
    //
    //   "Full Time"
    //   "Weekends"
    //
    // Therefore we do not reject based on this field.
    //
    // =====================================================

    // No availability rejection here.

    // =====================================================
    // ASSIGN VOLUNTEER
    // =====================================================

    request.assignedVolunteer = volunteer._id;

    // IMPORTANT:
    // Request schema already contains "assignedVolunteer".
    // There is no separate "volunteer" field in the schema.
    //
    // DO NOT use:
    //
    // request.volunteer = volunteer._id;

    request.deliveryStatus = "volunteer_assigned";

    await request.save();

    // =====================================================
    // NOTIFICATION TO VOLUNTEER
    // =====================================================

    try {
      await sendNotification(
        volunteer._id,
        "New Delivery Assigned",
        "A new donation delivery has been assigned to you.",
        "info",
        "/my-deliveries"
      );
    } catch (notificationError) {
      console.error(
        "Volunteer notification error:",
        notificationError.message
      );
    }

    // =====================================================
    // NOTIFICATION TO NGO
    // =====================================================

    try {
      if (request.ngo) {
        await sendNotification(
          request.ngo,
          "Volunteer Assigned",
          "A volunteer has been assigned for your donation.",
          "success",
          "/my-requests"
        );
      }
    } catch (notificationError) {
      console.error(
        "NGO notification error:",
        notificationError.message
      );
    }

    // =====================================================
    // AUDIT LOG
    // =====================================================

    try {
      await createAuditLog(
        req.user.id,
        "Assign Volunteer",
        "Volunteer assigned to donation request",
        volunteer._id,
        request.donation
      );
    } catch (auditError) {
      console.error(
        "Audit log error:",
        auditError.message
      );
    }

    // =====================================================
    // GET UPDATED REQUEST
    // =====================================================

    const updatedRequest = await Request.findById(
      request._id
    )

      // ===================================================
      // VOLUNTEER DETAILS
      // ===================================================

      .populate(
        "assignedVolunteer",
        "name email phone address city state pincode profileImage vehicleType vehicleNumber vehicleCapacity availability licenseNumber"
      )

      // ===================================================
      // NGO DETAILS
      // ===================================================

      .populate(
        "ngo",
        "name email phone address city state pincode organizationName ngoCategory profileImage"
      )

      // ===================================================
      // DONATION DETAILS
      // ===================================================
      //
      // IMPORTANT:
      //
      // The Donation model uses:
      //
      // donationName
      // categories
      //
      // NOT:
      //
      // itemName
      // category
      // quantity
      // unit
      // condition
      //
      // ===================================================

      .populate({
        path: "donation",

        select:
          "donationName categories description status donor campaign itemImages pickupProofImage deliveryProofImage availableFrom availableUntil allowedDeliveryMethods createdAt",

        populate: {
          path: "campaign",
          select:
            "title categories status duration startDate endDate",
        },
      });

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      message:
        "Volunteer assigned successfully.",

      request: updatedRequest,
    });

  } catch (error) {
    console.error(
      "Assign Volunteer Error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to assign volunteer.",

      error:
        error.message,
    });
  }
};
module.exports = {
createRequest,
getNgoDashboardStats,
getDonationRequests,
updateRequestStatus,
getVolunteerDeliveries,
getMyRequests,
confirmReceived,
getMyDeliveries,
acceptDelivery,
declineDelivery,
updateDeliveryStatus,
getVolunteerDashboardStats,
getDonorRequests,
acceptRequest,
rejectRequest,
markDonorDelivered,
assignVolunteer,
};