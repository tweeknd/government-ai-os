const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Complaint = require("../models/Complaint");
const IoTReading = require("../models/IoTReading");
const { verifyToken } = require("../middleware/auth");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function getGeminiModel() {
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

// POST /api/ai/classify - Classify a complaint using Gemini
router.post("/classify", verifyToken, async (req, res, next) => {
  try {
    const { title, description, complaintId } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: "title and description required" });
    }

    let classification;

    if (!process.env.GEMINI_API_KEY) {
      // Mock fallback
      classification = {
        category: "water",
        priority: "medium",
        suggestedDept: "Water & Sanitation Department",
        reasoning: "Based on keywords related to water infrastructure",
        recommendedActions: [
          "Dispatch field inspection team",
          "Check pipeline pressure in the area",
          "Notify water supply department",
          "Issue public advisory if needed",
          "Schedule repair within 48 hours",
        ],
      };
    } else {
      try {
        const model = await getGeminiModel();
        const prompt = `You are an AI assistant for a government complaint management system.

Analyze this citizen complaint and respond ONLY with valid JSON (no markdown, no explanation):

Title: ${title}
Description: ${description}

Respond with this exact JSON structure:
{
  "category": "<one of: water, roads, electricity, sanitation, health, other>",
  "priority": "<one of: low, medium, high, critical>",
  "suggestedDept": "<department name>",
  "reasoning": "<brief reasoning>",
  "recommendedActions": ["action1", "action2", "action3", "action4", "action5"]
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        classification = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch (aiError) {
        console.error("Gemini API error:", aiError.message);
        classification = {
          category: "other",
          priority: "medium",
          suggestedDept: "General Administration",
          reasoning: "AI classification unavailable",
          recommendedActions: [
            "Review complaint manually",
            "Assign to appropriate department",
            "Contact citizen for more details",
            "Schedule inspection",
            "Follow up within 72 hours",
          ],
        };
      }
    }

    // If complaintId provided, update the complaint
    if (complaintId && classification) {
      await Complaint.findByIdAndUpdate(complaintId, {
        aiClassification: { ...classification, classifiedAt: new Date() },
        category: classification.category || undefined,
        priority: classification.priority || undefined,
      });
    }

    res.json({ success: true, data: classification });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/chat - Gemini chatbot for officials
router.post("/chat", verifyToken, async (req, res, next) => {
  try {
    const { message, context } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: "message is required" });
    }

    let reply;

    if (!process.env.GEMINI_API_KEY) {
      reply =
        "I'm your Government AI Assistant. I can help you analyze complaints, generate reports, and provide recommendations. Please configure your Gemini API key to enable full AI capabilities.";
    } else {
      try {
        const model = await getGeminiModel();
        const systemContext = `You are an AI assistant for government officials in a smart city management system. 
You help officials analyze citizen complaints, understand IoT sensor data, make decisions about resource allocation, 
and generate actionable insights. Be concise, professional, and data-driven.
${context ? `\nContext: ${JSON.stringify(context)}` : ""}`;

        const result = await model.generateContent(`${systemContext}\n\nOfficial: ${message}`);
        reply = result.response.text();
      } catch (aiError) {
        console.error("Gemini chat error:", aiError.message);
        reply = "AI service temporarily unavailable. Please try again later.";
      }
    }

    res.json({ success: true, data: { reply, timestamp: new Date() } });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/recommendations - 5 AI action recommendations
router.post("/recommendations", verifyToken, async (req, res, next) => {
  try {
    const { zone, category, currentData } = req.body;

    // Gather real data for context
    const [recentComplaints, recentAlerts] = await Promise.all([
      Complaint.find({
        ...(zone ? { "location.zone": zone } : {}),
        ...(category ? { category } : {}),
        status: { $in: ["pending", "in_progress"] },
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("title category priority status location"),
      IoTReading.find({ alert: true }).sort({ timestamp: -1 }).limit(10).select("zone sensorType value alertMessage"),
    ]);

    let recommendations;

    if (!process.env.GEMINI_API_KEY) {
      recommendations = [
        { priority: 1, action: "Deploy emergency water tankers to Zone 3 — water level critical", category: "water", urgency: "critical" },
        { priority: 2, action: "Schedule pothole repair crew for Zone 1 — 8 pending road complaints", category: "roads", urgency: "high" },
        { priority: 3, action: "Alert sanitation team: Zone 5 waste bins at 90% capacity", category: "sanitation", urgency: "high" },
        { priority: 4, action: "Issue air quality advisory for Zone 2 — AQI exceeding safe limits", category: "health", urgency: "medium" },
        { priority: 5, action: "Preventive electrical inspection in Zone 4 based on historical outage pattern", category: "electricity", urgency: "medium" },
      ];
    } else {
      try {
        const model = await getGeminiModel();
        const prompt = `You are a smart city AI advisor. Based on this data, provide exactly 5 prioritized action recommendations.

Pending complaints: ${JSON.stringify(recentComplaints.map((c) => ({ title: c.title, category: c.category, priority: c.priority, zone: c.location?.zone })))}
Active IoT alerts: ${JSON.stringify(recentAlerts.map((a) => ({ zone: a.zone, type: a.sensorType, message: a.alertMessage })))}
${currentData ? `Additional context: ${JSON.stringify(currentData)}` : ""}

Respond ONLY with valid JSON array (no markdown):
[
  {"priority": 1, "action": "...", "category": "...", "urgency": "critical|high|medium|low"},
  ...5 items total
]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch (aiError) {
        console.error("Gemini recommendations error:", aiError.message);
        recommendations = [
          { priority: 1, action: "Review and prioritize all critical complaints immediately", category: "other", urgency: "critical" },
          { priority: 2, action: "Check IoT sensor alerts and dispatch response teams", category: "other", urgency: "high" },
          { priority: 3, action: "Update citizens on pending complaint status", category: "other", urgency: "medium" },
          { priority: 4, action: "Coordinate inter-department resource sharing", category: "other", urgency: "medium" },
          { priority: 5, action: "Generate weekly performance report for review", category: "other", urgency: "low" },
        ];
      }
    }

    res.json({ success: true, data: { recommendations, generatedAt: new Date() } });
  } catch (err) {
    next(err);
  }
});

// GET /api/ai/risk-assessment - Gemini assesses top 3 risks
router.get("/risk-assessment", verifyToken, async (req, res, next) => {
  try {
    const [criticalComplaints, iotAlerts, zoneStats] = await Promise.all([
      Complaint.find({ priority: "critical", status: { $in: ["pending", "in_progress"] } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title category location status createdAt"),
      IoTReading.find({ alert: true }).sort({ timestamp: -1 }).limit(10).select("zone sensorType value alertMessage timestamp"),
      Complaint.aggregate([
        { $match: { status: { $in: ["pending", "in_progress"] } } },
        { $group: { _id: "$location.zone", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    let risks;

    if (!process.env.GEMINI_API_KEY) {
      risks = [
        {
          rank: 1,
          risk: "Water Supply Failure in Zone 3",
          likelihood: "High",
          impact: "Critical",
          affectedZones: ["Zone 3"],
          mitigationSteps: ["Deploy emergency tankers", "Repair pipeline immediately", "Notify residents"],
        },
        {
          rank: 2,
          risk: "Air Quality Deterioration in Zone 2",
          likelihood: "Medium",
          impact: "High",
          affectedZones: ["Zone 2"],
          mitigationSteps: ["Issue health advisory", "Increase monitoring frequency", "Coordinate with health dept"],
        },
        {
          rank: 3,
          risk: "Infrastructure Backlog in High-Complaint Zones",
          likelihood: "High",
          impact: "Medium",
          affectedZones: ["Zone 1", "Zone 4"],
          mitigationSteps: ["Prioritize repair schedule", "Allocate additional budget", "Deploy extra field teams"],
        },
      ];
    } else {
      try {
        const model = await getGeminiModel();
        const prompt = `You are a risk assessment AI for a smart city. Analyze the following data and identify the top 3 risks.

Critical complaints: ${JSON.stringify(criticalComplaints)}
IoT Alerts: ${JSON.stringify(iotAlerts)}
Zone complaint counts: ${JSON.stringify(zoneStats)}

Respond ONLY with valid JSON array of exactly 3 risks (no markdown):
[
  {
    "rank": 1,
    "risk": "risk name",
    "likelihood": "High|Medium|Low",
    "impact": "Critical|High|Medium|Low",
    "affectedZones": ["Zone X"],
    "mitigationSteps": ["step1", "step2", "step3"]
  }
]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        risks = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch (aiError) {
        console.error("Gemini risk assessment error:", aiError.message);
        risks = [
          { rank: 1, risk: "Service Degradation Risk", likelihood: "Medium", impact: "High", affectedZones: ["All"], mitigationSteps: ["Review SLAs", "Allocate resources", "Monitor performance"] },
          { rank: 2, risk: "Infrastructure Overload", likelihood: "Low", impact: "Critical", affectedZones: ["Zone 1", "Zone 2"], mitigationSteps: ["Inspect infrastructure", "Upgrade capacity", "Emergency backup plan"] },
          { rank: 3, risk: "Citizen Dissatisfaction", likelihood: "Medium", impact: "Medium", affectedZones: ["All"], mitigationSteps: ["Improve communication", "Speed up resolution", "Publish transparency report"] },
        ];
      }
    }

    res.json({ success: true, data: { risks, assessedAt: new Date() } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
