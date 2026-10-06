const Payment = require("../models/Payment");
const User = require("../models/User");

// ============================================================
// HELPER — FIND VERIFIED NGO
// ============================================================

const findVerifiedNGO = async (ngoId) => {
  const ngo = await User.findOne({
    _id: ngoId,
    role: "ngo",
    isApproved: true,
    isBlocked: false,
    isDeleted: false,
  });

  if (!ngo) {
    return {
      valid: false,
      message:
        "NGO not found or is no longer available.",
    };
  }

  // ==========================================================
  // CHECK NGO PAYMENT VERIFICATION
  // ==========================================================

  const verificationStatus =
    ngo.paymentDetails?.verificationStatus;

  if (verificationStatus !== "verified") {
    return {
      valid: false,
      message:
        "This NGO is not currently verified for receiving payments.",
    };
  }

  return {
    valid: true,
    ngo,
  };
};

// ============================================================
// GENERATE DEMO TRANSACTION ID
// ============================================================

const generateTransactionId = (paymentMethod) => {
  const methodPrefix = {
    upi: "UPI",
    bank_transfer: "BANK",
    card: "CARD",
  };

  const prefix =
    methodPrefix[paymentMethod] || "PAY";

  const timestamp = Date.now();

  const randomPart = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `DEMO-${prefix}-${timestamp}-${randomPart}`;
};

// ============================================================
// CREATE DEMO PAYMENT
// ============================================================

// ============================================================
// CREATE NORMAL DEMO PAYMENT
// ============================================================

const createPayment = async (req, res) => {
  try {
    const donorId = req.user.id;

    const {
      ngoId,
      amount,
      paymentMethod,
      paymentReference,
    } = req.body;

    console.log("====================================");
    console.log("CREATE DEMO PAYMENT");
    console.log("DONOR:", donorId);
    console.log("NGO:", ngoId);
    console.log("AMOUNT:", amount);
    console.log("METHOD:", paymentMethod);
    console.log("REFERENCE:", paymentReference);
    console.log("====================================");

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!ngoId) {
      return res.status(400).json({
        message: "NGO is required.",
      });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        message: "Enter a valid payment amount.",
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        message: "Payment method is required.",
      });
    }

    // ========================================================
    // ALLOWED PAYMENT METHODS
    // ========================================================

    const allowedMethods = [
      "upi",
      "bank_transfer",
      "card",
    ];

    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        message: "Invalid payment method.",
      });
    }

    // ========================================================
    // FIND VERIFIED NGO
    // ========================================================

    const ngoResult = await findVerifiedNGO(ngoId);

    if (!ngoResult.valid) {
      return res.status(400).json({
        message: ngoResult.message,
      });
    }

    const ngo = ngoResult.ngo;

    // ========================================================
    // GENERATE DEMO TRANSACTION ID
    // ========================================================

    const transactionId =
      `DEMO-${Date.now()}-${Math.floor(
        Math.random() * 10000
      )}`;

    // ========================================================
    // CREATE PAYMENT
    // ========================================================

    const payment = await Payment.create({
      donor: donorId,

      ngo: ngoId,

      amount: Number(amount),

      paymentMethod,

      transactionId,

      status: "successful",

      paidAt: new Date(),
    });

    console.log("====================================");
    console.log("DEMO PAYMENT CREATED SUCCESSFULLY");
    console.log("PAYMENT ID:", payment._id);
    console.log("TRANSACTION ID:", transactionId);
    console.log("====================================");

    // ========================================================
    // POPULATE PAYMENT
    // ========================================================

    const populatedPayment =
      await Payment.findById(payment._id)
        .populate(
          "donor",
          "name email phone"
        )
        .populate(
          "ngo",
          "name organizationName email phone city state"
        );

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(201).json({
      message:
        "Demo payment completed successfully.",

      payment: populatedPayment,
    });

  } catch (error) {

    console.error(
      "===================================="
    );

    console.error(
      "CREATE DEMO PAYMENT ERROR"
    );

    console.error(
      "MESSAGE:",
      error.message
    );

    console.error(
      "ERROR:",
      error
    );

    console.error(
      "===================================="
    );

    return res.status(500).json({
      message:
        error.message ||
        "Unable to complete demo payment.",
    });
  }
};

// ============================================================
// DONOR PAYMENT HISTORY
// ============================================================

const getMyPayments = async (
  req,
  res
) => {
  try {
    const payments =
      await Payment.find({
        donor:
          req.user.id,
      })
        .populate(
          "ngo",
          "name organizationName email phone city state"
        )
        .sort({
          createdAt: -1,
        });

    return res.json(
      payments
    );
  } catch (error) {
    console.error(
      "GET MY PAYMENTS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        error.message,
    });
  }
};

// ============================================================
// NGO PAYMENT HISTORY
// ============================================================

const getNgoPayments = async (
  req,
  res
) => {
  try {
    const payments =
      await Payment.find({
        ngo:
          req.user.id,

        status:
          "successful",
      })
        .populate(
          "donor",
          "name email phone"
        )
        .sort({
          createdAt: -1,
        });

    return res.json(
      payments
    );
  } catch (error) {
    console.error(
      "GET NGO PAYMENTS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        error.message,
    });
  }
};

// ============================================================
// ADMIN — ALL PAYMENTS
// ============================================================

const getAllPayments = async (
  req,
  res
) => {
  try {
    const payments =
      await Payment.find()
        .populate(
          "donor",
          "name email phone"
        )
        .populate(
          "ngo",
          "name organizationName email phone city state"
        )
        .sort({
          createdAt: -1,
        });

    return res.json(
      payments
    );
  } catch (error) {
    console.error(
      "GET ALL PAYMENTS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        error.message,
    });
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  createPayment,
  getMyPayments,
  getNgoPayments,
  getAllPayments,
};