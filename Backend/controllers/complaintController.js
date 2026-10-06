const Complaint = require("../models/Complaint");
const User = require("../models/User");

const sendNotification = require("../utils/sendNotification");
const createAuditLog = require("../utils/createAuditLog");

// ===============================
// Create Complaint
// ===============================

const createComplaint = async (req, res) => {

  try {

    const {
      againstUser,
      donation,
      title,
      description,
      category,
      priority,
    } = req.body;

    const complaint = await Complaint.create({

      reportedBy: req.user.id,

      againstUser,

      donation,

      title,

      description,

      category,

      priority,

    });

    res.status(201).json({

      message: "Complaint submitted successfully.",

      complaint,

    });

  } catch (error) {

    res.status(500).json({

      message: error.message,

    });

  }

};

// ===============================
// My Complaints
// ===============================

const getMyComplaints = async (req, res) => {

  try {

    const complaints = await Complaint.find({

      reportedBy: req.user.id,

    })

      .populate(
        "againstUser",
        "name role"
      )

      .populate(
        "donation",
        "itemName"
      )

      .sort({

        createdAt: -1,

      });

    res.json(complaints);

  } catch (error) {

    res.status(500).json({

      message: error.message,

    });

  }

};

// ===============================
// Admin View All Complaints
// ===============================

const getAllComplaints = async (req, res) => {

  try {

    const complaints = await Complaint.find()

      .populate(
        "reportedBy",
        "name role email"
      )

      .populate(
        "againstUser",
        "name role"
      )

      .populate(
        "donation",
        "itemName category"
      )

      .sort({

        createdAt: -1,

      });

    res.json(complaints);

  } catch (error) {

    res.status(500).json({

      message: error.message,

    });

  }

};

// ===============================
// Reply Complaint
// ===============================

const replyComplaint = async (req, res) => {

  try {

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {

      return res.status(404).json({

        message: "Complaint not found.",

      });

    }

    complaint.adminReply = req.body.adminReply;

    complaint.status = "In Progress";

    await complaint.save();

    // Notify user

    await sendNotification(

      complaint.reportedBy,

      "Complaint Updated",

      "The administrator has replied to your complaint.",

      "info",

      "/my-complaints"

    );

    // Audit Log

    await createAuditLog(

      req.user.id,

      "Reply Complaint",

      `Admin replied to complaint: ${complaint.title}`,

      complaint.reportedBy

    );

    res.json({

      message: "Reply sent successfully.",

      complaint,

    });

  } catch (error) {

    res.status(500).json({

      message: error.message,

    });

  }

};

// ===============================
// Resolve Complaint
// ===============================

const resolveComplaint = async (req, res) => {

  try {

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {

      return res.status(404).json({

        message: "Complaint not found.",

      });

    }

    complaint.status = "Resolved";

    await complaint.save();

    await sendNotification(

      complaint.reportedBy,

      "Complaint Resolved",

      "Your complaint has been resolved by the administrator.",

      "success",

      "/my-complaints"

    );

    await createAuditLog(

      req.user.id,

      "Resolve Complaint",

      `Resolved complaint: ${complaint.title}`,

      complaint.reportedBy

    );

    res.json({

      message: "Complaint resolved successfully.",

      complaint,

    });

  } catch (error) {

    res.status(500).json({

      message: error.message,

    });

  }

};

module.exports = {

  createComplaint,

  getMyComplaints,

  getAllComplaints,

  replyComplaint,

  resolveComplaint,

};