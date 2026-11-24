const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Complaint = require("../models/Complaint");
const Department = require("../models/Department");
const { verifyToken, requireRole } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

// ── Multer setup (image uploads) ────────────────────────────────────────────
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `complaint-${Date.now()}-${Math.round(Math.random() * 1e5)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images are allowed"), false);
  },
}).array("images", 3); // max 3 images

// Serve uploaded images statically
router.use("/uploads", express.static(uploadDir));

// ── POST /api/complaints ─────────────────────────────────────────────────────
router.post("/", verifyToken, (req, res, next) => {
  upload(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ success: false, message: uploadErr.message });
    }

    // Validate required fields
    const { title, description, category } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: "Description is required" });
    }
    const validCategories = ["water", "roads", "electricity", "sanitation", "health", "other"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, message: "Invalid category" });
    }

    try {
      // Parse location — can come as flat fields (from FormData) or nested JSON
      let location = {};
      if (req.body["location[address]"] !== undefined) {
        location = {
          address: req.body["location[address]"] || "",
          zone:    req.body["location[zone]"]    || "Zone 1",
          lat:     parseFloat(req.body["location[lat]"])  || 13.0827,
          lng:     parseFloat(req.body["location[lng]"])  || 80.2707,
        };
      } else if (req.body.location) {
        try { location = JSON.parse(req.body.location); } catch { location = req.body.location; }
      }

      // Image file paths
      const attachments = (req.files || []).map(f => `/uploads/${f.filename}`);

      // Try Gemini AI classification
      let aiClassification = {
        category: category,
        priority: "medium",
        suggestedDept: "General Administration",
        reasoning: "Auto-classified based on complaint category",
        recommendedActions: [
          "Dispatch field team for assessment",
          "Notify department head",
          "Schedule repair work within 48 hours",
          "Issue public advisory if needed",
          "Document and close within SLA",
        ],
        classifiedAt: new Date(),
      };

      try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here") {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const prompt = `You are an AI assistant for a government complaint management system. Analyze this citizen complaint and respond ONLY with valid JSON (no markdown):

Title: ${title}
Description: ${description}
Category: ${category}

Respond with this exact JSON structure:
{
  "category": "${category}",
  "priority": "<one of: low, medium, high, critical>",
  "suggestedDept": "<department name>",
  "reasoning": "<brief reasoning>",
  "recommendedActions": ["action1", "action2", "action3"]
}`;
          const result = await model.generateContent(prompt);
          const text = result.response.text().trim();
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            aiClassification = { ...aiClassification, ...parsed, classifiedAt: new Date() };
          }
        }
      } catch (_) { /* use mock classification */ }

      const complaint = await Complaint.create({
        title: title.trim(),
        description: description.trim(),
        category,
        location,
        priority: aiClassification.priority || "medium",
        citizen: req.user._id,
        aiClassification,
        attachments,
        statusHistory: [{ status: "pending", changedBy: req.user._id, note: "Complaint submitted by citizen", changedAt: new Date() }],
      });

      await complaint.populate("citizen", "name email");
      res.status(201).json({ success: true, message: "Complaint submitted successfully", data: complaint });
    } catch (err) {
      next(err);
    }
  });
});

// ── GET /api/complaints ───────────────────────────────────────────────────────
router.get("/", verifyToken, async (req, res, next) => {
  try {
    const {
      status, category, priority, zone, department,
      page = 1, limit = 50, sortBy = "createdAt", order = "desc",
    } = req.query;

    const filter = {};

    // Citizens only see their own complaints
    if (req.user.role === "citizen") {
      filter.citizen = req.user._id;
    } else if (req.user.role === "officer") {
      // Officers see assigned + dept complaints
      if (req.user.department) {
        filter.$or = [{ assignedTo: req.user._id }, { department: req.user.department }];
      }
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (zone) filter["location.zone"] = zone;
    if (department) filter.department = department;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === "asc" ? 1 : -1;

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate("citizen", "name email")
        .populate("assignedTo", "name email")
        .populate("department", "name code")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit)),
      Complaint.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: complaints,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/complaints/stats/summary ────────────────────────────────────────
router.get("/stats/summary", verifyToken, async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === "citizen") filter.citizen = req.user._id;

    const [totalComplaints, byStatus, byCategory, byPriority, resolvedToday] = await Promise.all([
      Complaint.countDocuments(filter),
      Complaint.aggregate([{ $match: filter }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $match: filter }, { $group: { _id: "$category", count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $match: filter }, { $group: { _id: "$priority", count: { $sum: 1 } } }]),
      Complaint.countDocuments({ ...filter, resolvedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
    ]);

    const statusMap = {};
    byStatus.forEach((s) => (statusMap[s._id] = s.count));
    const categoryMap = {};
    byCategory.forEach((c) => (categoryMap[c._id] = c.count));
    const priorityMap = {};
    byPriority.forEach((p) => (priorityMap[p._id] = p.count));

    res.json({
      success: true,
      data: {
        total: totalComplaints,
        pending: statusMap.pending || 0,
        assigned: statusMap.assigned || 0,
        in_progress: statusMap.in_progress || 0,
        resolved: statusMap.resolved || 0,
        closed: statusMap.closed || 0,
        byStatus: statusMap,
        byCategory: categoryMap,
        byPriority: priorityMap,
        resolvedToday,
        resolutionRate: totalComplaints > 0
          ? (((statusMap.resolved || 0) + (statusMap.closed || 0)) / totalComplaints * 100).toFixed(1)
          : 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/complaints/hotspots ─────────────────────────────────────────────
router.get("/hotspots", verifyToken, async (req, res, next) => {
  try {
    const hotspots = await Complaint.aggregate([
      { $match: { "location.zone": { $exists: true }, status: { $in: ["pending", "assigned", "in_progress"] } } },
      { $group: { _id: "$location.zone", count: { $sum: 1 }, categories: { $push: "$category" } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, data: hotspots });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/complaints/:id ───────────────────────────────────────────────────
router.get("/:id", verifyToken, async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("citizen", "name email")
      .populate("assignedTo", "name email")
      .populate("department", "name code contactEmail")
      .populate("statusHistory.changedBy", "name role");

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }
    if (req.user.role === "citizen" && complaint.citizen._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    res.json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/complaints/:id/status ───────────────────────────────────────────
router.put("/:id/status", verifyToken, requireRole("officer", "department_head", "admin"), async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ["pending", "assigned", "in_progress", "resolved", "closed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });

    complaint.status = status;
    if (status === "resolved") complaint.resolvedAt = new Date();
    complaint.statusHistory.push({
      status,
      changedBy: req.user._id,
      note: note || `Status updated to ${status}`,
      changedAt: new Date(),
    });
    await complaint.save();
    await complaint.populate("citizen assignedTo department");
    res.json({ success: true, message: "Status updated", data: complaint });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/complaints/:id/assign ───────────────────────────────────────────
router.put("/:id/assign", verifyToken, requireRole("department_head", "admin", "officer"), async (req, res, next) => {
  try {
    const { assignedTo, department } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });

    if (assignedTo) complaint.assignedTo = assignedTo;
    if (department) complaint.department = department;
    complaint.status = "assigned";
    complaint.statusHistory.push({
      status: "assigned",
      changedBy: req.user._id,
      note: "Complaint assigned to officer",
      changedAt: new Date(),
    });
    await complaint.save();
    await complaint.populate("citizen assignedTo department");
    res.json({ success: true, message: "Complaint assigned", data: complaint });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
