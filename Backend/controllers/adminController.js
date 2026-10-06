const User = require("../models/User");
const Donation = require("../models/Donation");
const sendNotification = require("../utils/sendNotification");
const Request = require("../models/Request");
const createAuditLog = require("../utils/createAuditLog");
const Campaign = require("../models/Campaign");

const getDashboardStats = async (req, res) => {
  try {
    // =====================================================
    // USERS
    // =====================================================

    const totalUsers = await User.countDocuments({
      isDeleted: false,
      role: {
        $ne: "admin",
      },
    });

    const totalDonors = await User.countDocuments({
      role: "donor",
      isDeleted: false,
    });

    const totalNgos = await User.countDocuments({
      role: "ngo",
      isDeleted: false,
    });

    const totalVolunteers = await User.countDocuments({
      role: "volunteer",
      isDeleted: false,
    });

    // =====================================================
    // DONATIONS
    // =====================================================

    const totalDonations =
      await Donation.countDocuments();

    // =====================================================
    // REQUESTS
    // =====================================================

    const totalRequests =
      await Request.countDocuments();

    // =====================================================
    // ACTIVE DELIVERIES
    // =====================================================

    const activeDeliveries =
      await Request.countDocuments({
        status: "approved",
        deliveryStatus: {
          $in: [
            "pending",
            "volunteer_assigned",
            "volunteer_accepted",
            "picked_up",
            "delivered",
          ],
        },
      });

    // =====================================================
    // COMPLETED DELIVERIES
    // =====================================================

    const completedDeliveries =
      await Request.countDocuments({
        $or: [
          {
            deliveryStatus: "received",
          },
          {
            deliveryStatus: "completed",
          },
          {
            status: "completed",
          },
        ],
      });

    // =====================================================
    // RECENT ACTIVITY
    // =====================================================

    const recentActivity = [];

    // =====================================================
    // 1. NEW USERS
    // =====================================================

    const recentUsers =
      await User.find({
        isDeleted: false,
        role: {
          $ne: "admin",
        },
      })
        .select(
          "name role donorType organizationName createdAt"
        )
        .sort({
          createdAt: -1,
        })
        .limit(5);

    recentUsers.forEach((user) => {
      let displayName =
        user.name || "User";

      if (
        user.role === "ngo" ||
        (
          user.role === "donor" &&
          user.donorType === "organization"
        )
      ) {
        displayName =
          user.organizationName ||
          user.name ||
          "Organization";
      }

      recentActivity.push({
        type: "user_registered",

        title: "New User Registration",

        description:
          `${displayName} registered as ${user.role}.`,

        icon:
          "bi-person-plus-fill",

        color:
          "primary",

        createdAt:
          user.createdAt,

        userId:
          user._id,
      });
    });

    // =====================================================
    // 2. NEW DONATIONS
    // =====================================================

    const recentDonations =
      await Donation.find()
        .populate(
          "donor",
          "name organizationName donorType"
        )
        .select(
          "itemName category quantity unit donor createdAt"
        )
        .sort({
          createdAt: -1,
        })
        .limit(5);

    recentDonations.forEach(
      (donation) => {
        const donorName =
          donation.donor
            ?.organizationName ||
          donation.donor?.name ||
          "A donor";

        recentActivity.push({
          type:
            "donation_created",

          title:
            "Donation Created",

          description:
            `${donorName} created a donation of ${donation.itemName}.`,

          icon:
            "bi-box-fill",

          color:
            "success",

          createdAt:
            donation.createdAt,

          donationId:
            donation._id,

          itemName:
            donation.itemName,
        });
      }
    );

    // =====================================================
    // 3. NGO REQUESTS
    // =====================================================

    const recentRequests =
      await Request.find()
        .populate({
          path: "donation",
          select:
            "itemName category quantity",
        })
        .populate({
          path: "ngo",
          select:
            "name organizationName",
        })
        .sort({
          createdAt: -1,
        })
        .limit(5);

    recentRequests.forEach(
      (request) => {
        const itemName =
          request.donation?.itemName ||
          "Donation";

        const ngoName =
          request.ngo?.organizationName ||
          request.ngo?.name ||
          "NGO";

        recentActivity.push({
          type:
            "donation_request",

          title:
            "NGO Donation Request",

          description:
            `${ngoName} requested ${itemName}.`,

          icon:
            "bi-clipboard-check-fill",

          color:
            "warning",

          createdAt:
            request.createdAt,

          requestId:
            request._id,

          donationId:
            request.donation?._id,
        });
      }
    );

    // =====================================================
    // 4. VOLUNTEER ASSIGNMENTS
    // =====================================================

    const assignedRequests =
      await Request.find({
        assignedVolunteer: {
          $ne: null,
        },
      })
        .populate({
          path: "donation",
          select:
            "itemName",
        })
        .populate({
          path: "assignedVolunteer",
          select:
            "name",
        })
        .sort({
          updatedAt: -1,
        })
        .limit(5);

    assignedRequests.forEach(
      (request) => {
        const itemName =
          request.donation?.itemName ||
          "Donation";

        const volunteerName =
          request.assignedVolunteer?.name ||
          "Volunteer";

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
        });
      }
    );

    // =====================================================
    // 5. COMPLETED DELIVERIES
    // =====================================================

    const completedRequests =
      await Request.find({
        $or: [
          {
            deliveryStatus:
              "received",
          },
          {
            deliveryStatus:
              "completed",
          },
          {
            status:
              "completed",
          },
        ],
      })
        .populate({
          path: "donation",
          select:
            "itemName",
        })
        .populate({
          path: "ngo",
          select:
            "name organizationName",
        })
        .sort({
          updatedAt: -1,
        })
        .limit(5);

    completedRequests.forEach(
      (request) => {
        const itemName =
          request.donation?.itemName ||
          "Donation";

        const ngoName =
          request.ngo?.organizationName ||
          request.ngo?.name ||
          "NGO";

        recentActivity.push({
          type:
            "delivery_completed",

          title:
            "Delivery Completed",

          description:
            `${itemName} was successfully delivered to ${ngoName}.`,

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
    );

    // =====================================================
    // 6. CAMPAIGNS
    // =====================================================

    if (Campaign) {
      const recentCampaigns =
        await Campaign.find()
          .populate(
            "ngo",
            "name organizationName"
          )
          .sort({
            createdAt: -1,
          })
          .limit(5);

      recentCampaigns.forEach(
        (campaign) => {
          const ngoName =
            campaign.ngo
              ?.organizationName ||
            campaign.ngo?.name ||
            "NGO";

          let title =
            "Campaign Created";

          let description =
            `${ngoName} created campaign "${campaign.title}".`;

          let icon =
            "bi-megaphone-fill";

          let color =
            "warning";

          if (
            campaign.status ===
            "active"
          ) {
            title =
              "Campaign Approved";

            description =
              `"${campaign.title}" is now active.`;

            icon =
              "bi-check-circle-fill";

            color =
              "success";
          }

          if (
            campaign.status ===
            "rejected"
          ) {
            title =
              "Campaign Rejected";

            description =
              `"${campaign.title}" was rejected.`;

            icon =
              "bi-x-circle-fill";

            color =
              "danger";
          }

          recentActivity.push({
            type:
              "campaign",

            title,

            description,

            icon,

            color,

            createdAt:
              campaign.updatedAt ||
              campaign.createdAt,

            campaignId:
              campaign._id,
          });
        }
      );
    }

    // =====================================================
    // SORT ALL ACTIVITIES
    // =====================================================

    recentActivity.sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );

    // =====================================================
    // LATEST 10 ACTIVITIES
    // =====================================================

    const latestActivity =
      recentActivity.slice(
        0,
        10
      );

    // =====================================================
    // DEBUG
    // =====================================================

    console.log(
      "======================================"
    );

    console.log(
      "ADMIN DASHBOARD"
    );

    console.log(
      "Users:",
      totalUsers
    );

    console.log(
      "Donors:",
      totalDonors
    );

    console.log(
      "NGOs:",
      totalNgos
    );

    console.log(
      "Volunteers:",
      totalVolunteers
    );

    console.log(
      "Donations:",
      totalDonations
    );

    console.log(
      "Requests:",
      totalRequests
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
      "Recent Activity Count:",
      latestActivity.length
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
      totalUsers,
      totalDonors,
      totalNgos,
      totalVolunteers,
      totalDonations,
      totalRequests,
      activeDeliveries,
      completedDeliveries,
      recentActivity:
        latestActivity,
    });

  } catch (error) {
    console.error(
      "Get Admin Dashboard Stats Error:",
      error
    );

    res.status(500).json({
      message:
        error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {

   const users = await User.find({
  role: { $ne: "admin" },
  isDeleted: { $ne: true },
}).select("-password");

    res.json(users);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: error.message,
    });

  }
};


const getUsersByRole = async (req, res) => {

  try {

  const users = await User.find({
  role: req.params.role,
  isDeleted: { $ne: true },
}).select("-password");

    res.json(users);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};

const approveUser = async (req, res) => {

  try {
    

   const user = await User.findById(req.params.id);

if (!user) {
  return res.status(404).json({
    message: "User not found",
  });
}

if (user.role === "admin") {
  return res.status(403).json({
    message: "Admin accounts cannot be modified.",
  });
}

user.isApproved = true;
await user.save();
await sendNotification(
  user._id,
  "Account Approved",
  "Your account has been approved by the admin.",
  "success"
);
await createAuditLog(
  req.user.id,
  "Approve User",
  `${user.name} was approved`,
  user._id
);

res.json({
  message: "User approved successfully.",
  user,
});
    

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};

const blockUser = async (req, res) => {

  try {

    const user =
      await User.findByIdAndUpdate(

        req.params.id,

        {
          isBlocked: true,
        },

        {
          new: true,
        }

      );
      await user.save();
      await sendNotification(
  user._id,
  "Account Blocked",
  "Your account has been blocked by the administrator.",
  "warning"
);
await createAuditLog(
  req.user.id,
  "Block User",
  `${user.name} was blocked`,
  user._id
);

    res.json({
      message:
        "User blocked successfully.",
      user,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};

const unblockUser = async (req, res) => {

  try {

    const user =
      await User.findByIdAndUpdate(

        req.params.id,

        {
          isBlocked: false,
        },

        {
          new: true,
        }

      );
      await user.save();
      await sendNotification(
  user._id,
  "Account Unblocked",
  "Your account has been unblocked by the administrator.",
  "success"
);
await createAuditLog(
  req.user.id,
  "Unblock User",
  `${user.name} was unblocked`,
  user._id
);
    res.json({
      message:
        "User unblocked successfully.",
      user,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};

const deleteUser = async (req, res) => {

  try {

    const user =
      await User.findByIdAndUpdate(

        req.params.id,

        {
          isDeleted: true,
        },

        {
          new: true,
        }

      );  await user.save();
      await sendNotification(
  user._id,
  "Account Deleted",
  "Your account has been deleted by the administrator.",
  "success"
);
      await createAuditLog(
  req.user.id,
  "Delete User",
  `${user.name} was deleted`,
  user._id
);

    res.json({
      message:
        "User removed successfully.",
      user,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};

const getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate(
        "donor",
        "name email phone address city state pincode donorType organizationName organizationCategory gstNumber profileImage"
      )
      .sort({
        createdAt: -1,
      });

    const result = await Promise.all(
      donations.map(async (donation) => {
        const request = await Request.findOne({
          donation: donation._id,
        })
          .populate(
            "ngo",
            "name email phone address city state pincode organizationName organizationCategory ngoCategory profileImage registrationCertificate isApproved isBlocked"
          )
          .populate(
            "assignedVolunteer",
            "name email phone address city state pincode vehicleType vehicleNumber vehicleCapacity availability licenseNumber profileImage licenseImage governmentIdImage vehicleRCImage isApproved isBlocked"
          );

        return {
          ...donation.toObject(),

          ngo: request?.ngo || null,

          volunteer:
            request?.assignedVolunteer || null,

          requestId:
            request?._id || null,

          requestStatus:
            request?.status || "Not Requested",

          deliveryMethod:
            request?.deliveryMethod || "-",

          deliveryStatus:
            request?.deliveryStatus || "-",
        };
      })
    );

    res.status(200).json(result);

  } catch (error) {
    console.error(
      "Get All Donations Error:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};
const getDonationsByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    console.log(
      "======================================"
    );

    console.log(
      "ADMIN DONATIONS BY STATUS"
    );

    console.log(
      "STATUS:",
      status
    );

    const donations =
      await Donation.find({
        status,
      })
        .populate(
          "donor",
          "name email phone address city state pincode donorType organizationName organizationCategory gstNumber profileImage"
        )
        .sort({
          createdAt: -1,
        });

    const result = await Promise.all(
      donations.map(async (donation) => {

        // =================================================
        // FIND REQUEST
        // =================================================

        const request =
          await Request.findOne({
            donation: donation._id,
          })
            // =============================================
            // NGO
            // =============================================

            .populate(
              "ngo",
              "name email phone address city state pincode organizationName organizationCategory ngoCategory profileImage registrationCertificate isApproved isBlocked"
            )

            // =============================================
            // VOLUNTEER
            // =============================================

            .populate(
              "assignedVolunteer",
              "name email phone address city state pincode vehicleType vehicleNumber vehicleCapacity availability licenseNumber profileImage licenseImage governmentIdImage vehicleRCImage isApproved isBlocked"
            );

        console.log(
          "DONATION:",
          donation.itemName
        );

        console.log(
          "NGO:",
          request?.ngo
        );

        console.log(
          "ASSIGNED VOLUNTEER:",
          request?.assignedVolunteer
        );

        // =================================================
        // RESPONSE
        // =================================================

        return {
          ...donation.toObject(),

          // Donor
          donor:
            donation.donor || null,

          // NGO
          ngo:
            request?.ngo || null,

          // Volunteer
          volunteer:
            request?.assignedVolunteer ||
            null,

          // Request
          requestId:
            request?._id || null,

          requestStatus:
            request?.status ||
            "Not Requested",

          deliveryMethod:
            request?.deliveryMethod ||
            "-",

          deliveryStatus:
            request?.deliveryStatus ||
            "-",
        };
      })
    );

    console.log(
      "RESULT COUNT:",
      result.length
    );

    console.log(
      "======================================"
    );

    res.status(200).json(result);

  } catch (error) {
    console.error(
      "Get Donations By Status Error:",
      error
    );

    res.status(500).json({
      message:
        error.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    // =====================================================
    // FIND USER
    // =====================================================

    const user = await User.findById(req.params.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // =====================================================
    // DEFAULT STATISTICS
    // =====================================================

    let stats = {
      totalDonations: 0,
      available: 0,
      requested: 0,
      approved: 0,
      pickedUp: 0,
      delivered: 0,
      completed: 0,
      expired: 0,

      totalRequests: 0,
      pending: 0,
      rejected: 0,

      assigned: 0,
      accepted: 0,

      campaigns: 0,
    };

    let donations = [];
    let requests = [];
    let deliveries = [];
    let campaigns = [];

    // =====================================================
    // DONOR
    // =====================================================

    if (user.role === "donor") {
      // ---------------------------------------------
      // DONATIONS
      // ---------------------------------------------

      donations = await Donation.find({
        donor: user._id,
      })
        .populate(
          "campaign",
          "title description status"
        )
        .sort({
          createdAt: -1,
        });

      // ---------------------------------------------
      // DONATION IDS
      // ---------------------------------------------

      const donationIds = donations.map(
        (donation) => donation._id
      );

      // ---------------------------------------------
      // REQUESTS FOR DONOR'S DONATIONS
      // ---------------------------------------------

      if (donationIds.length > 0) {
        requests = await Request.find({
          donation: {
            $in: donationIds,
          },
        })
          .populate({
            path: "donation",
            select:
              "itemName category quantity unit status createdAt",
          })
          .populate(
            "ngo",
            "name email phone organizationName"
          )
          .populate(
            "assignedVolunteer",
            "name email phone vehicleType vehicleNumber"
          )
          .sort({
            createdAt: -1,
          });
      }

      // ---------------------------------------------
      // DONOR STATISTICS
      // ---------------------------------------------

      stats = {
        totalDonations: donations.length,

        available: donations.filter(
          (d) => d.status === "available"
        ).length,

        requested: donations.filter(
          (d) => d.status === "requested"
        ).length,

        approved: donations.filter(
          (d) => d.status === "approved"
        ).length,

        pickedUp: donations.filter(
          (d) => d.status === "picked_up"
        ).length,

        delivered: donations.filter(
          (d) => d.status === "delivered"
        ).length,

        completed: donations.filter(
          (d) => d.status === "completed"
        ).length,

        expired: donations.filter(
          (d) => d.status === "expired"
        ).length,

        totalRequests: requests.length,
      };
    }

    // =====================================================
    // NGO
    // =====================================================

    if (user.role === "ngo") {
      // ---------------------------------------------
      // NGO REQUESTS
      // ---------------------------------------------

      requests = await Request.find({
        ngo: user._id,
      })
        .populate({
          path: "donation",
          select:
            "itemName category quantity unit status donor createdAt",

          populate: {
            path: "donor",
            select:
              "name email phone gender organizationName donorType",
          },
        })
        .populate(
          "assignedVolunteer",
          "name email phone gender vehicleType vehicleNumber vehicleCapacity availability licenseNumber profileImage licenseImage governmentIdImage vehicleRCImage vehicleImage skills"
        )
        .sort({
          createdAt: -1,
        });

      // ---------------------------------------------
      // NGO CAMPAIGNS
      // ---------------------------------------------

      campaigns = await Campaign.find({
        ngo: user._id,
      })
        .sort({
          createdAt: -1,
        });

      // ---------------------------------------------
      // NGO STATISTICS
      // ---------------------------------------------

      stats = {
        totalRequests: requests.length,

        pending: requests.filter(
          (r) => r.status === "pending"
        ).length,

        approved: requests.filter(
          (r) => r.status === "approved"
        ).length,

        rejected: requests.filter(
          (r) => r.status === "rejected"
        ).length,

        completed: requests.filter(
          (r) => r.status === "completed"
        ).length,

        delivered: requests.filter(
          (r) => r.deliveryStatus === "delivered"
        ).length,

        campaigns: campaigns.length,
      };
    }

    // =====================================================
    // VOLUNTEER
    // =====================================================

    if (user.role === "volunteer") {
      // ---------------------------------------------
      // ASSIGNED DELIVERIES
      // ---------------------------------------------

      deliveries = await Request.find({
        assignedVolunteer: user._id,
      })
        .populate({
          path: "donation",
          select:
            "itemName category quantity unit status donor createdAt",

          populate: {
            path: "donor",
            select:
              "name email phone gender organizationName donorType",
          },
        })
        .populate(
          "ngo",
          "name email phone gender organizationName"
        )
        .sort({
          createdAt: -1,
        });

      // ---------------------------------------------
      // VOLUNTEER STATISTICS
      // ---------------------------------------------

      stats = {
        assigned: deliveries.length,

        pending: deliveries.filter(
          (d) =>
            d.deliveryStatus === "pending"
        ).length,

        accepted: deliveries.filter(
          (d) =>
            d.deliveryStatus ===
            "volunteer_accepted"
        ).length,

        pickedUp: deliveries.filter(
          (d) =>
            d.deliveryStatus ===
            "picked_up"
        ).length,

        delivered: deliveries.filter(
          (d) =>
            d.deliveryStatus ===
            "delivered"
        ).length,

        completed: deliveries.filter(
          (d) =>
            d.deliveryStatus ===
            "completed"
        ).length,
      };
    }

    // =====================================================
    // USER RESPONSE
    // =====================================================

    const userResponse = {
      _id: user._id,

      // ===================================================
      // BASIC INFORMATION
      // ===================================================

      name: user.name,
      email: user.email,
      phone: user.phone,
      gender: user.gender || "",

      // ===================================================
      // ADDRESS
      // ===================================================

      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,

      // ===================================================
      // ACCOUNT
      // ===================================================

      role: user.role,
      isApproved: user.isApproved,
      isBlocked: user.isBlocked,
      isDeleted: user.isDeleted,

      // ===================================================
      // PROFILE
      // ===================================================

      profileImage: user.profileImage,

      // ===================================================
      // DONOR INFORMATION
      // ===================================================

      donorType: user.donorType,

      organizationName:
        user.organizationName,

      organizationCategory:
        user.organizationCategory,

      gstNumber:
        user.gstNumber,

      gstCertificate:
        user.gstCertificate,

      organizationProof:
        user.organizationProof,

      // ===================================================
      // NGO INFORMATION
      // ===================================================

      ngoCategory:
        user.ngoCategory,

      // Keep both names available for compatibility
      ngoCertificate:
        user.ngoCertificate,

      registrationCertificate:
        user.registrationCertificate,

      // ===================================================
      // VOLUNTEER INFORMATION
      // ===================================================

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

      skills:
        user.skills,

      // ===================================================
      // VOLUNTEER DOCUMENTS
      // =====================================================

      // Vehicle Photo
      vehicleImage:
        user.vehicleImage,

      // IMPORTANT:
      // Database field is licenseImage.
      // Admin API exposes it as drivingLicenseImage
      // so frontend can use the clearer name.
      drivingLicenseImage:
        user.licenseImage,

      // Also expose original database field
      licenseImage:
        user.licenseImage,

      // Government ID
      governmentIdImage:
        user.governmentIdImage,

      // Vehicle RC
      vehicleRCImage:
        user.vehicleRCImage,

      // ===================================================
      // DATES
      // ===================================================

      createdAt:
        user.createdAt,

      updatedAt:
        user.updatedAt,
    };

    // =====================================================
    // DEBUG DOCUMENTS
    // =====================================================

    console.log(
      "======================================"
    );

    console.log(
      "ADMIN USER DOCUMENT CHECK"
    );

    console.log(
      "User:",
      user.name
    );

    console.log(
      "Role:",
      user.role
    );

    console.log(
      "Profile Image:",
      user.profileImage
    );

    console.log(
      "Vehicle Image:",
      user.vehicleImage
    );

    console.log(
      "License Image:",
      user.licenseImage
    );

    console.log(
      "Government ID:",
      user.governmentIdImage
    );

    console.log(
      "Vehicle RC:",
      user.vehicleRCImage
    );

    console.log(
      "======================================"
    );

    // =====================================================
    // FINAL RESPONSE
    // =====================================================

    return res.status(200).json({
      user: userResponse,
      stats,
      donations,
      requests,
      deliveries,
      campaigns,
    });

  } catch (error) {
    console.error(
      "Admin Get User Details Error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch user details",
      error:
        error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {

    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      role,
      isApproved,
      isBlocked,
    } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Prevent editing another admin account
    if (user.role === "admin") {
      return res.status(403).json({
        message: "Admin accounts cannot be edited.",
      });
    }

    user.name = name;
    user.email = email;
    user.phone = phone;
    user.address = address;
    user.city = city;
    user.state = state;
    user.pincode = pincode;
    user.role = role;
    user.isApproved = isApproved;
    user.isBlocked = isBlocked;

    await user.save();
await createAuditLog(
  req.user.id,
  "Update User",
  `${user.name}'s profile was updated`,
  user._id
);  
      await sendNotification(
  user._id,
  "Account Updated",
  "Your account information has been updated.",
  "success"
);
    res.json({
      message: "User updated successfully.",
      user,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};


module.exports = {
  getDashboardStats,
  getAllUsers,
  getUsersByRole,
  approveUser,
  blockUser,
  unblockUser,
  deleteUser,
  getAllDonations,
  getDonationsByStatus,
  getUserById,
  updateUser,

};