const express = require("express");
const router = express.Router();
const IoTReading = require("../models/IoTReading");
const { verifyToken } = require("../middleware/auth");

// Zone coordinates around Chennai (13.0827, 80.2707)
const ZONE_COORDS = {
  "Zone 1": { lat: 13.0827, lng: 80.2707 },
  "Zone 2": { lat: 13.0950, lng: 80.2850 },
  "Zone 3": { lat: 13.0700, lng: 80.2560 },
  "Zone 4": { lat: 13.1050, lng: 80.2600 },
  "Zone 5": { lat: 13.0650, lng: 80.2900 },
};

const SENSOR_CONFIG = [
  { type: "water_level", unit: "%", min: 20, max: 95 },
  { type: "air_quality", unit: "AQI", min: 30, max: 300 },
  { type: "waste_bin", unit: "%", min: 10, max: 100 },
  { type: "traffic", unit: "vehicles/hr", min: 100, max: 2000 },
  { type: "weather", unit: "°C", min: 15, max: 42 },
];

function getRandom(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function checkAlert(sensorType, value) {
  if (sensorType === "water_level" && value < 30) {
    return { alert: true, message: `Critical: Water level at ${value}% — below safe threshold` };
  }
  if (sensorType === "air_quality" && value > 200) {
    return { alert: true, message: `Hazardous AQI: ${value} — immediate action required` };
  }
  if (sensorType === "waste_bin" && value > 85) {
    return { alert: true, message: `Waste bin at ${value}% capacity — collection needed` };
  }
  return { alert: false, message: null };
}

// GET /api/iot/readings
router.get("/readings", verifyToken, async (req, res, next) => {
  try {
    const { zone, sensorType, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (zone) filter.zone = zone;
    if (sensorType) filter.sensorType = sensorType;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [readings, total] = await Promise.all([
      IoTReading.find(filter).sort({ timestamp: -1 }).skip(skip).limit(parseInt(limit)),
      IoTReading.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: readings,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/iot/readings/:zone
router.get("/readings/:zone", verifyToken, async (req, res, next) => {
  try {
    const zone = decodeURIComponent(req.params.zone);
    const latestByType = await IoTReading.aggregate([
      { $match: { zone } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$sensorType",
          latest: { $first: "$$ROOT" },
        },
      },
    ]);
    res.json({ success: true, zone, data: latestByType.map((r) => r.latest) });
  } catch (err) {
    next(err);
  }
});

// GET /api/iot/alerts
router.get("/alerts", verifyToken, async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h
    const alerts = await IoTReading.find({ alert: true, timestamp: { $gte: since } })
      .sort({ timestamp: -1 })
      .limit(100);
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    next(err);
  }
});

// POST /api/iot/simulate - generates mock IoT data for all zones
router.post("/simulate", verifyToken, async (req, res, next) => {
  try {
    const readings = [];
    const zones = Object.keys(ZONE_COORDS);

    for (const zone of zones) {
      const coords = ZONE_COORDS[zone];
      for (const sensor of SENSOR_CONFIG) {
        const value = getRandom(sensor.min, sensor.max);
        const { alert, message } = checkAlert(sensor.type, value);

        readings.push({
          sensorId: `${zone.replace(" ", "-").toLowerCase()}-${sensor.type}`,
          sensorType: sensor.type,
          value,
          unit: sensor.unit,
          zone,
          location: coords,
          timestamp: new Date(),
          alert,
          alertMessage: message,
        });
      }
    }

    const created = await IoTReading.insertMany(readings);
    const alertCount = created.filter((r) => r.alert).length;

    res.status(201).json({
      success: true,
      message: `Simulated ${created.length} IoT readings across ${zones.length} zones`,
      data: {
        totalReadings: created.length,
        alertsGenerated: alertCount,
        zones,
        readings: created,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
