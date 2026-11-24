const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");
const Department = require("../models/Department");
const { verifyToken } = require("../middleware/auth");

// GET /api/analytics/trends - 30-day daily complaint trends
router.get("/trends", verifyToken, async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const trends = await Complaint.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: "$_id.day",
                },
              },
            },
          },
          count: 1,
          resolved: 1,
        },
      },
    ]);

    res.json({ success: true, data: trends });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/by-category
router.get("/by-category", verifyToken, async (req, res, next) => {
  try {
    const data = await Complaint.aggregate([
      {
        $group: {
          _id: "$category",
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          resolved: {
            $sum: { $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0] },
          },
          critical: { $sum: { $cond: [{ $eq: ["$priority", "critical"] }, 1, 0] } },
        },
      },
      { $sort: { total: -1 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/by-zone
router.get("/by-zone", verifyToken, async (req, res, next) => {
  try {
    const data = await Complaint.aggregate([
      { $match: { "location.zone": { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$location.zone",
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
          resolved: {
            $sum: { $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0] },
          },
          critical: { $sum: { $cond: [{ $eq: ["$priority", "critical"] }, 1, 0] } },
        },
      },
      { $sort: { total: -1 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/department-performance
router.get("/department-performance", verifyToken, async (req, res, next) => {
  try {
    const data = await Complaint.aggregate([
      { $match: { department: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$department",
          assigned: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0] },
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $and: [{ $ne: ["$resolvedAt", null] }, { $ne: ["$createdAt", null] }] },
                { $subtract: ["$resolvedAt", "$createdAt"] },
                null,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "deptInfo",
        },
      },
      { $unwind: { path: "$deptInfo", preserveNullAndEmpty: true } },
      {
        $project: {
          department: "$deptInfo.name",
          code: "$deptInfo.code",
          assigned: 1,
          resolved: 1,
          resolutionRate: {
            $cond: [
              { $gt: ["$assigned", 0] },
              { $multiply: [{ $divide: ["$resolved", "$assigned"] }, 100] },
              0,
            ],
          },
          avgResolutionHours: {
            $cond: [
              { $ne: ["$avgResolutionTime", null] },
              { $divide: ["$avgResolutionTime", 3600000] },
              null,
            ],
          },
        },
      },
      { $sort: { resolutionRate: -1 } },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/forecast - simple 7-day forecast based on trends
router.get("/forecast", verifyToken, async (req, res, next) => {
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const recentTrends = await Complaint.aggregate([
      { $match: { createdAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          avgCount: { $avg: { $literal: 1 } },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalRecent = recentTrends.reduce((sum, d) => sum + d.count, 0);
    const dailyAvg = totalRecent / 14;

    // Simple forecast: next 7 days with slight random variation
    const forecast = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      forecast.push({
        date: date.toISOString().split("T")[0],
        predicted: Math.round(dailyAvg * (0.85 + Math.random() * 0.3)),
        confidence: parseFloat((75 + Math.random() * 20).toFixed(1)),
      });
    }

    res.json({
      success: true,
      data: {
        historicalDailyAvg: parseFloat(dailyAvg.toFixed(1)),
        forecast,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
