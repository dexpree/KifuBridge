

const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

router.get("/create-admin", async (req, res) => {

  const adminExists = await User.findOne({
    email: "admin@gmail.com"
  });

  if (adminExists) {
    return res.json({
      message: "Admin already exists"
    });
  }
  
  const hashedPassword = await bcrypt.hash(
    "admin123",
    10
  );

  await User.create({
    name: "Admin",
    email: "admin@gmail.com",
    password: hashedPassword,
    role: "admin"
  });

  res.json({
    message: "Admin created"
  });

});

module.exports = router;