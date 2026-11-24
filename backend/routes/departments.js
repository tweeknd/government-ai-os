const express = require("express");
const router = express.Router();
const Department = require("../models/Department");
const { verifyToken, requireRole } = require("../middleware/auth");

// GET /api/departments
router.get("/", async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate("head", "name email")
      .populate("officers", "name email")
      .sort("name");
    res.json({ success: true, count: departments.length, data: departments });
  } catch (err) {
    next(err);
  }
});

// POST /api/departments (admin only)
router.post("/", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { name, code, description, contactEmail, categories } = req.body;
    const department = await Department.create({ name, code, description, contactEmail, categories });
    res.status(201).json({ success: true, message: "Department created", data: department });
  } catch (err) {
    next(err);
  }
});

// GET /api/departments/:id
router.get("/:id", async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate("head", "name email phone")
      .populate("officers", "name email phone");
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }
    res.json({ success: true, data: department });
  } catch (err) {
    next(err);
  }
});

// PUT /api/departments/:id
router.put("/:id", verifyToken, requireRole("admin", "department_head"), async (req, res, next) => {
  try {
    const { name, description, contactEmail, categories, head, officers } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, description, contactEmail, categories, head, officers },
      { new: true, runValidators: true }
    )
      .populate("head", "name email")
      .populate("officers", "name email");

    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }
    res.json({ success: true, message: "Department updated", data: department });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
