const express = require("express");

const router = express.Router();

const {
  createPayment,
  getMyPayments,
  getNgoPayments,
  getAllPayments,
} = require("../controllers/paymentController");

const protect = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");

// ============================================================
// DONOR — CREATE DEMO PAYMENT
// ============================================================
//
// This is a simulated payment.
// No real money is transferred.
//

router.post(
  "/",
  protect,
  authorize("donor"),
  createPayment
);

// ============================================================
// DONOR — MY PAYMENT HISTORY
// ============================================================

router.get(
  "/my-payments",
  protect,
  authorize("donor"),
  getMyPayments
);

// ============================================================
// NGO — RECEIVED PAYMENTS
// ============================================================

router.get(
  "/ngo-payments",
  protect,
  authorize("ngo"),
  getNgoPayments
);

// ============================================================
// ADMIN — ALL PAYMENTS
// ============================================================

router.get(
  "/admin",
  protect,
  authorize("admin"),
  getAllPayments
);

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;