require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Models
const User = require("../models/User");
const Department = require("../models/Department");
const Complaint = require("../models/Complaint");
const IoTReading = require("../models/IoTReading");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/government_ai_os";

const zones = ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5"];
const categories = ["water", "roads", "electricity", "sanitation", "health", "other"];
const priorities = ["low", "medium", "high", "critical"];
const statuses = ["pending", "assigned", "in_progress", "resolved", "closed"];

const zoneCoords = {
  "Zone 1": { lat: 13.0827, lng: 80.2707 },
  "Zone 2": { lat: 13.0950, lng: 80.2850 },
  "Zone 3": { lat: 13.0700, lng: 80.2560 },
  "Zone 4": { lat: 13.1050, lng: 80.2600 },
  "Zone 5": { lat: 13.0650, lng: 80.2900 },
};

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function getRandomDate(daysBack = 30) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d;
}

const complaintTemplates = [
  { title: "Burst water pipe on main road", description: "Water is gushing from a broken pipe on the main road causing flooding and traffic disruption.", category: "water" },
  { title: "No water supply since 3 days", description: "Our entire street has not received water supply for the past 3 days. Residents are severely affected.", category: "water" },
  { title: "Large pothole causing accidents", description: "There is a large pothole near the school entrance that has caused multiple bike accidents this week.", category: "roads" },
  { title: "Road cave-in near bus stop", description: "The road near the bus stop has caved in creating a dangerous situation for pedestrians and vehicles.", category: "roads" },
  { title: "Street lights not working", description: "Street lights on our lane have not been working for 2 weeks making it unsafe at night.", category: "electricity" },
  { title: "Frequent power cuts", description: "We are experiencing 4-5 hour power cuts daily for the past week without prior notice.", category: "electricity" },
  { title: "Garbage not collected for a week", description: "Garbage has not been collected from our area for 7 days. It is causing hygiene issues and smell.", category: "sanitation" },
  { title: "Overflowing sewage drain", description: "The sewage drain near our apartment is overflowing onto the street causing health hazards.", category: "sanitation" },
  { title: "Stray dogs attacking residents", description: "A pack of aggressive stray dogs has been attacking residents and children in the area.", category: "health" },
  { title: "Illegal dumping of construction waste", description: "A contractor is dumping construction waste on the roadside illegally near Zone park.", category: "other" },
  { title: "Broken footpath tiles", description: "Multiple footpath tiles are broken creating tripping hazards especially for elderly citizens.", category: "roads" },
  { title: "Water contamination complaint", description: "The water supply appears brownish and smells bad. Multiple families have reported stomach issues.", category: "water" },
  { title: "Transformer humming loudly", description: "The electrical transformer near our building has been making loud humming noises and sparking at night.", category: "electricity" },
  { title: "Public toilet in disrepair", description: "The public toilet facility near the market has broken doors and no water supply. It is unusable.", category: "sanitation" },
  { title: "Mosquito breeding in stagnant water", description: "There is stagnant water collected in the vacant plot causing mosquito breeding. Dengue risk is high.", category: "health" },
];

async function seed() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected\n");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Complaint.deleteMany({}),
      IoTReading.deleteMany({}),
    ]);
    console.log("✅ Cleared\n");

    // ─── 1. DEPARTMENTS ────────────────────────────────────────────────────
    console.log("🏢 Seeding departments...");
    const deptData = [
      { name: "Water & Sanitation Department", code: "WSD", description: "Manages water supply and sanitation infrastructure", contactEmail: "wsd@gov.in", categories: ["water", "sanitation"] },
      { name: "Roads & Infrastructure Department", code: "RID", description: "Maintains roads, bridges and public infrastructure", contactEmail: "rid@gov.in", categories: ["roads"] },
      { name: "Electricity & Power Department", code: "EPD", description: "Manages electricity distribution and street lighting", contactEmail: "epd@gov.in", categories: ["electricity"] },
      { name: "Health & Environment Department", code: "HED", description: "Public health, environment and general administration", contactEmail: "hed@gov.in", categories: ["health", "other"] },
    ];
    const departments = await Department.insertMany(deptData);
    console.log(`✅ Created ${departments.length} departments\n`);

    // ─── 2. ADMIN ──────────────────────────────────────────────────────────
    console.log("👤 Seeding users...");
    const admin = await User.create({
      name: "System Administrator",
      email: "admin@gov.in",
      password: "Admin@123",
      role: "admin",
    });

    // ─── 3. DEPARTMENT HEADS ───────────────────────────────────────────────
    const headUsers = await Promise.all(
      departments.map((dept, i) =>
        User.create({
          name: `${dept.name.split(" ")[0]} Head`,
          email: `head.${dept.code.toLowerCase()}@gov.in`,
          password: "Head@123",
          role: "department_head",
          department: dept._id,
        })
      )
    );

    // Update departments with their heads
    await Promise.all(
      departments.map((dept, i) =>
        Department.findByIdAndUpdate(dept._id, { head: headUsers[i]._id })
      )
    );

    // ─── 4. OFFICERS ───────────────────────────────────────────────────────
    const officerUsers = [];
    for (let d = 0; d < departments.length; d++) {
      const deptOfficers = [];
      for (let o = 0; o < 3; o++) {
        const officer = await User.create({
          name: `Officer ${d * 3 + o + 1}`,
          email: `officer${d * 3 + o + 1}@gov.in`,
          password: "Officer@123",
          role: "officer",
          department: departments[d]._id,
          zone: zones[(d * 3 + o) % zones.length],
        });
        officerUsers.push(officer);
        deptOfficers.push(officer._id);
      }
      await Department.findByIdAndUpdate(departments[d]._id, { officers: deptOfficers });
    }

    // ─── 5. CITIZENS ───────────────────────────────────────────────────────
    const citizenUsers = [];
    const citizenNames = [
      "Rajesh Kumar", "Priya Sharma", "Mohammed Ali", "Anitha Rajan",
      "Suresh Babu", "Kavitha Nair", "Arun Patel", "Deepika Menon",
      "Vijay Krishnan", "Sunita Devi",
    ];

    for (let i = 0; i < 10; i++) {
      const citizen = await User.create({
        name: citizenNames[i],
        email: `citizen${i + 1}@gmail.com`,
        password: "Citizen@123",
        role: "citizen",
        zone: zones[i % zones.length],
        phone: `98765${String(i).padStart(5, "0")}`,
      });
      citizenUsers.push(citizen);
    }

    console.log(`✅ Created users: 1 admin, ${headUsers.length} dept heads, ${officerUsers.length} officers, ${citizenUsers.length} citizens\n`);

    // ─── 6. COMPLAINTS ─────────────────────────────────────────────────────
    console.log("📋 Seeding 50 complaints...");
    const complaints = [];
    for (let i = 0; i < 50; i++) {
      const template = complaintTemplates[i % complaintTemplates.length];
      const zone = zones[i % zones.length];
      const coords = zoneCoords[zone];
      const status = getRandom(statuses);
      const priority = getRandom(priorities);
      const citizen = getRandom(citizenUsers);
      const deptForCategory = departments.find((d) => d.categories.includes(template.category)) || departments[0];
      const officer = officerUsers.find((o) => o.department.toString() === deptForCategory._id.toString());

      const createdAt = getRandomDate(30);
      const resolvedAt = ["resolved", "closed"].includes(status)
        ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
        : null;

      complaints.push({
        title: `${template.title} - ${zone}`,
        description: template.description,
        category: template.category,
        priority,
        status,
        location: {
          address: `${100 + i} Main Street, ${zone}, Chennai`,
          lat: coords.lat + (Math.random() - 0.5) * 0.01,
          lng: coords.lng + (Math.random() - 0.5) * 0.01,
          zone,
        },
        citizen: citizen._id,
        assignedTo: ["assigned", "in_progress", "resolved", "closed"].includes(status) ? officer?._id : null,
        department: ["assigned", "in_progress", "resolved", "closed"].includes(status) ? deptForCategory._id : null,
        aiClassification: {
          category: template.category,
          priority,
          suggestedDept: deptForCategory.name,
          reasoning: `AI identified this as a ${template.category} issue based on description keywords`,
          recommendedActions: [
            "Dispatch field team for assessment",
            "Check infrastructure in the area",
            "Notify department head",
            "Issue public update within 24 hours",
            "Schedule repair work",
          ],
          classifiedAt: createdAt,
        },
        resolvedAt,
        createdAt,
        updatedAt: resolvedAt || createdAt,
        statusHistory: [
          { status: "pending", changedBy: citizen._id, note: "Complaint submitted", changedAt: createdAt },
        ],
      });
    }
    await Complaint.insertMany(complaints);
    console.log("✅ Created 50 complaints\n");

    // ─── 7. IOT READINGS ───────────────────────────────────────────────────
    console.log("📡 Seeding 100 IoT readings...");
    const sensorConfigs = [
      { type: "water_level", unit: "%", min: 20, max: 95 },
      { type: "air_quality", unit: "AQI", min: 30, max: 300 },
      { type: "waste_bin", unit: "%", min: 10, max: 100 },
      { type: "traffic", unit: "vehicles/hr", min: 100, max: 2000 },
      { type: "weather", unit: "°C", min: 15, max: 42 },
    ];

    function checkAlert(type, value) {
      if (type === "water_level" && value < 30) return { alert: true, msg: `Critical: Water level at ${value}%` };
      if (type === "air_quality" && value > 200) return { alert: true, msg: `Hazardous AQI: ${value}` };
      if (type === "waste_bin" && value > 85) return { alert: true, msg: `Waste bin at ${value}% capacity` };
      return { alert: false, msg: null };
    }

    const iotReadings = [];
    // 20 sets of readings (20 * 5 sensors = 100)
    for (let i = 0; i < 20; i++) {
      const zone = zones[i % zones.length];
      const coords = zoneCoords[zone];
      const timestamp = getRandomDate(7);

      for (const sensor of sensorConfigs) {
        const value = getRandomNumber(sensor.min, sensor.max);
        const { alert, msg } = checkAlert(sensor.type, value);
        iotReadings.push({
          sensorId: `${zone.replace(" ", "-").toLowerCase()}-${sensor.type}-${i}`,
          sensorType: sensor.type,
          value,
          unit: sensor.unit,
          zone,
          location: {
            lat: coords.lat + (Math.random() - 0.5) * 0.005,
            lng: coords.lng + (Math.random() - 0.5) * 0.005,
          },
          timestamp,
          alert,
          alertMessage: msg,
        });
      }
    }
    await IoTReading.insertMany(iotReadings);
    console.log("✅ Created 100 IoT readings\n");

    console.log("🎉 Seeding complete!\n");
    console.log("═══════════════════════════════════════");
    console.log("📧 Login credentials:");
    console.log("   Admin:         admin@gov.in / Admin@123");
    console.log("   Dept Head:     head.wsd@gov.in / Head@123");
    console.log("   Officer:       officer1@gov.in / Officer@123");
    console.log("   Citizen:       citizen1@gmail.com / Citizen@123");
    console.log("═══════════════════════════════════════\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
