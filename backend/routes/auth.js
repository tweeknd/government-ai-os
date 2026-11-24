const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret_key_32chars_min!!", {
    expiresIn: "7d",
  });
};

// POST /api/auth/register
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").optional().isIn(["citizen", "officer", "department_head", "admin"]),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, email, password, role, department, phone, zone } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ success: false, message: "Email already registered" });
      }

      const user = await User.create({ name, email, password, role: role || "citizen", department, phone, zone });
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: "Registration successful",
        token,
        user,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password } = req.body;
      const user = await User.findOne({ email }).select("+password").populate("department", "name code");

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: "Account deactivated. Contact admin." });
      }

      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      const token = generateToken(user._id);

      res.json({
        success: true,
        message: "Login successful",
        token,
        user,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me
router.get("/me", verifyToken, async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

module.exports = router;
