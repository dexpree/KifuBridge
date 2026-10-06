const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    // ==========================================
    // DONATION
    // ==========================================

    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
      required: true,
    },

    // ==========================================
    // NGO
    // ==========================================

    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==========================================
    // REQUEST APPROVAL STATUS
    // ==========================================

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "completed",
      ],
      default: "pending",
    },

    // ==========================================
    // NGO SELECTED DELIVERY METHOD
    // ==========================================

    deliveryMethod: {
      type: String,
      enum: [
        "volunteer",
        "donor_self",
        "ngo_pickup",
      ],
      required: true,
    },

    // ==========================================
    // WHO SELECTED DELIVERY METHOD
    // ==========================================

    deliveryMethodSelectedBy: {
      type: String,
      enum: [
        "ngo",
        "admin",
      ],
      default: "ngo",
    },

    // ==========================================
    // DELIVERY METHOD STATUS
    // ==========================================

    deliveryMethodStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "changed",
      ],
      default: "pending",
    },

    // ==========================================
    // ASSIGNED VOLUNTEER
    // ==========================================

    assignedVolunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ==========================================
    // DELIVERY STATUS
    // ==========================================

    deliveryStatus: {
      type: String,
      enum: [
        "pending",
        "volunteer_assigned",
        "volunteer_accepted",
        "picked_up",
        "delivered",
        "received",
        "completed",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Request",
  requestSchema
);