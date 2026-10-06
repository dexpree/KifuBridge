// ============================================================
// LOAD ENVIRONMENT VARIABLES FIRST
// ============================================================

const dotenv = require("dotenv");

dotenv.config();

// ============================================================
// IMPORT PACKAGES
// ============================================================

const express = require("express");
const cors = require("cors");
const path = require("path");

// ============================================================
// IMPORT DATABASE
// ============================================================

const connectDB = require("./config/db");

// ============================================================
// IMPORT ROUTES
// ============================================================

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const donationRoutes = require("./routes/donationRoutes");
const adminSeed = require("./routes/adminSeed");
const adminRoutes = require("./routes/adminRoutes");
const requestRoutes = require("./routes/requestRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const auditRoutes = require("./routes/auditRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// ============================================================
// DATABASE
// ============================================================

connectDB();

// ============================================================
// EXPRESS APP
// ============================================================

const app = express();

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());

app.use(express.json());

// ============================================================
// API ROUTES
// ============================================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/donations",
  donationRoutes
);

app.use(
  "/api/seed",
  adminSeed
);

app.use(
  "/api/admin",
  adminRoutes
);

app.use(
  "/api/requests",
  requestRoutes
);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use(
  "/api/audit-logs",
  auditRoutes
);

app.use(
  "/api/complaints",
  complaintRoutes
);

app.use(
  "/api/campaigns",
  campaignRoutes
);

app.use(
  "/api/payments",
  paymentRoutes
);

// ============================================================
// HOME
// ============================================================

app.get("/", (req, res) => {
  res.send(
    "Donation Management API Running"
  );
});

// ============================================================
// UPLOADS
// ============================================================

app.use(
  "/uploads",
  express.static(
    path.join(
      __dirname,
      "uploads"
    )
  )
);

// ============================================================
// PORT
// ============================================================

const PORT =
  process.env.PORT || 5000;

app.listen(
  PORT,
  () => {
    console.log(
      "===================================="
    );

    console.log(
      "Donation Management API Running"
    );

    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      "Demo payment system: ACTIVE"
    );

    console.log(
      "===================================="
    );
  }
);