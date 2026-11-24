const mongoose = require("mongoose");

const iotReadingSchema = new mongoose.Schema(
  {
    sensorId: {
      type: String,
      required: true,
      trim: true,
    },
    sensorType: {
      type: String,
      required: true,
      enum: ["water_level", "air_quality", "waste_bin", "traffic", "weather"],
    },
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    zone: {
      type: String,
      required: true,
      enum: ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5"],
    },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    alert: {
      type: Boolean,
      default: false,
    },
    alertMessage: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

iotReadingSchema.index({ zone: 1, sensorType: 1, timestamp: -1 });
iotReadingSchema.index({ alert: 1 });
iotReadingSchema.index({ timestamp: -1 });

module.exports = mongoose.model("IoTReading", iotReadingSchema);
