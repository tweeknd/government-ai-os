const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["water", "roads", "electricity", "sanitation", "health", "other"],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "in_progress", "resolved", "closed"],
      default: "pending",
    },
    location: {
      address: { type: String, trim: true },
      lat: { type: Number },
      lng: { type: Number },
      zone: {
        type: String,
        enum: ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5"],
      },
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    aiClassification: {
      category: String,
      priority: String,
      suggestedDept: String,
      reasoning: String,
      recommendedActions: [String],
      classifiedAt: Date,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    statusHistory: [
      {
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],
    upvotes: {
      type: Number,
      default: 0,
    },
    attachments: [String],
  },
  {
    timestamps: true,
  }
);

// Index for geospatial and common queries
complaintSchema.index({ "location.zone": 1, status: 1, category: 1 });
complaintSchema.index({ citizen: 1 });
complaintSchema.index({ department: 1, status: 1 });
complaintSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Complaint", complaintSchema);
