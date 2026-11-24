/**
 * API-based seed script — seeds data through the running backend REST API
 * Run with: node utils/apiSeed.js
 */
const http = require("http");

const BASE = "http://localhost:5000";
let token = "";

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    if (data) headers["Content-Length"] = Buffer.byteLength(data);

    const req = http.request(`${BASE}${path}`, { method, headers }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function seed() {
  console.log("🌱 Seeding data via API...\n");

  // 1. Register Admin
  console.log("👤 Creating admin...");
  const adminReg = await request("POST", "/api/auth/register", {
    name: "System Administrator",
    email: "admin@gov.in",
    password: "Admin@123",
    role: "admin",
  });
  if (adminReg.status === 201 || adminReg.body?.token) {
    token = adminReg.body.token;
    console.log("   ✅ Admin registered");
  } else if (adminReg.status === 400 && adminReg.body?.message?.includes("exists")) {
    // Already exists — login instead
    const login = await request("POST", "/api/auth/login", {
      email: "admin@gov.in",
      password: "Admin@123",
    });
    token = login.body.token;
    console.log("   ℹ️  Admin already exists, logged in");
  } else {
    console.log("   ⚠️  Admin reg:", JSON.stringify(adminReg.body));
  }

  // 2. Create Departments
  console.log("🏢 Creating departments...");
  const depts = [
    { name: "Water & Sanitation Department", code: "WSD", description: "Manages water supply and sanitation", contactEmail: "wsd@gov.in", categories: ["water", "sanitation"] },
    { name: "Roads & Infrastructure Department", code: "RID", description: "Maintains roads and public infrastructure", contactEmail: "rid@gov.in", categories: ["roads"] },
    { name: "Electricity & Power Department", code: "EPD", description: "Manages electricity distribution", contactEmail: "epd@gov.in", categories: ["electricity"] },
    { name: "Health & Environment Department", code: "HED", description: "Public health and environment", contactEmail: "hed@gov.in", categories: ["health", "other"] },
  ];
  const deptIds = [];
  for (const d of depts) {
    const r = await request("POST", "/api/departments", d);
    if (r.status === 201) {
      deptIds.push(r.body.data._id);
      console.log(`   ✅ ${d.name}`);
    } else if (r.status === 400 && r.body?.message?.includes("duplicate")) {
      console.log(`   ℹ️  ${d.name} already exists`);
    }
  }

  // 3. Register Citizens
  console.log("👥 Creating citizens...");
  const citizenNames = ["Rajesh Kumar","Priya Sharma","Mohammed Ali","Anitha Rajan","Suresh Babu"];
  const citizenTokens = [];
  for (let i = 0; i < 5; i++) {
    const r = await request("POST", "/api/auth/register", {
      name: citizenNames[i],
      email: `citizen${i + 1}@gmail.com`,
      password: "Citizen@123",
      role: "citizen",
    });
    if (r.body?.token) citizenTokens.push(r.body.token);
  }
  console.log(`   ✅ ${citizenTokens.length} citizens created`);

  // 4. Register Officers
  console.log("👮 Creating officers...");
  const officerNames = ["Officer Ravi","Officer Meena","Officer Suresh","Officer Kavitha"];
  for (let i = 0; i < 4; i++) {
    await request("POST", "/api/auth/register", {
      name: officerNames[i],
      email: `officer${i + 1}@gov.in`,
      password: "Officer@123",
      role: "officer",
    });
  }
  console.log("   ✅ 4 officers created");

  // 5. Submit Complaints (as citizens)
  if (citizenTokens.length > 0) {
    console.log("📋 Submitting complaints...");
    const complaintData = [
      { title: "Burst water pipe on main road - Zone 1", description: "Water gushing from broken pipe causing flooding and traffic disruption near Zone 1 main road junction.", category: "water", location: { address: "Main Road, Zone 1", lat: 13.0827, lng: 80.2707, zone: "Zone 1" } },
      { title: "Large pothole causing accidents - Zone 2", description: "Dangerous pothole near school entrance in Zone 2. Multiple bike accidents this week.", category: "roads", location: { address: "School Street, Zone 2", lat: 13.0950, lng: 80.2850, zone: "Zone 2" } },
      { title: "No water supply since 3 days - Zone 3", description: "Entire Zone 3 street has no water supply for 3 days. Residents severely affected.", category: "water", location: { address: "Gandhi Nagar, Zone 3", lat: 13.0700, lng: 80.2560, zone: "Zone 3" } },
      { title: "Street lights not working - Zone 1", description: "Street lights on our lane not working for 2 weeks. Very unsafe at night.", category: "electricity", location: { address: "Park Lane, Zone 1", lat: 13.0830, lng: 80.2710, zone: "Zone 1" } },
      { title: "Garbage not collected for a week - Zone 4", description: "Garbage not collected from Zone 4 for 7 days causing hygiene issues and bad smell.", category: "sanitation", location: { address: "Market Area, Zone 4", lat: 13.1050, lng: 80.2600, zone: "Zone 4" } },
      { title: "Overflowing sewage drain - Zone 2", description: "Sewage drain near apartment overflowing onto street in Zone 2 causing health hazard.", category: "sanitation", location: { address: "River Road, Zone 2", lat: 13.0960, lng: 80.2860, zone: "Zone 2" } },
      { title: "Frequent power cuts - Zone 5", description: "4-5 hour power cuts daily for past week in Zone 5 without prior notice.", category: "electricity", location: { address: "Nehru Colony, Zone 5", lat: 13.0650, lng: 80.2900, zone: "Zone 5" } },
      { title: "Stray dogs attacking residents - Zone 3", description: "Pack of aggressive stray dogs attacking residents and children in Zone 3.", category: "health", location: { address: "Housing Board, Zone 3", lat: 13.0710, lng: 80.2570, zone: "Zone 3" } },
      { title: "Water contamination - Zone 5", description: "Water supply appears brownish with bad smell in Zone 5. Multiple families have stomach issues.", category: "water", location: { address: "Tank Road, Zone 5", lat: 13.0660, lng: 80.2910, zone: "Zone 5" } },
      { title: "Road cave-in near bus stop - Zone 4", description: "Road near Zone 4 bus stop has caved in. Dangerous for pedestrians and vehicles.", category: "roads", location: { address: "Bus Stand Road, Zone 4", lat: 13.1055, lng: 80.2605, zone: "Zone 4" } },
      { title: "Broken footpath tiles - Zone 1", description: "Multiple footpath tiles broken creating tripping hazards for elderly in Zone 1.", category: "roads", location: { address: "MG Road, Zone 1", lat: 13.0828, lng: 80.2708, zone: "Zone 1" } },
      { title: "Transformer sparking loudly - Zone 2", description: "Electrical transformer near building making loud humming and sparking at night in Zone 2.", category: "electricity", location: { address: "Transformer Lane, Zone 2", lat: 13.0945, lng: 80.2845, zone: "Zone 2" } },
      { title: "Mosquito breeding in stagnant water - Zone 4", description: "Stagnant water in vacant plot causing mosquito breeding in Zone 4. Dengue risk very high.", category: "health", location: { address: "Vacant Plot, Zone 4", lat: 13.1048, lng: 80.2598, zone: "Zone 4" } },
      { title: "Public toilet in disrepair - Zone 3", description: "Public toilet near Zone 3 market has broken doors and no water. Unusable.", category: "sanitation", location: { address: "Market Cross, Zone 3", lat: 13.0705, lng: 80.2565, zone: "Zone 3" } },
      { title: "Illegal construction waste dumping - Zone 5", description: "Contractor dumping construction waste on roadside illegally in Zone 5 park area.", category: "other", location: { address: "Park Corner, Zone 5", lat: 13.0655, lng: 80.2905, zone: "Zone 5" } },
    ];

    let count = 0;
    for (let i = 0; i < complaintData.length; i++) {
      const cToken = citizenTokens[i % citizenTokens.length];
      const savedToken = token;
      token = cToken;
      const r = await request("POST", "/api/complaints", complaintData[i]);
      token = savedToken;
      if (r.status === 201) count++;
    }
    console.log(`   ✅ ${count}/${complaintData.length} complaints submitted`);
  }

  // 6. Simulate IoT Readings
  console.log("📡 Simulating IoT readings...");
  const iotR = await request("POST", "/api/iot/simulate", {});
  if (iotR.status === 200 || iotR.status === 201) {
    console.log(`   ✅ IoT readings generated`);
  }

  console.log("\n════════════════════════════════════════");
  console.log("🎉 Seeding complete!");
  console.log("🌐 Frontend: http://localhost:3000");
  console.log("🔧 Backend:  http://localhost:5000");
  console.log("════════════════════════════════════════");
  console.log("Login credentials:");
  console.log("  Admin:    admin@gov.in     / Admin@123");
  console.log("  Officer:  officer1@gov.in  / Officer@123");
  console.log("  Citizen:  citizen1@gmail.com / Citizen@123");
  console.log("════════════════════════════════════════\n");
}

seed().catch((e) => {
  console.error("❌ Seed failed:", e.message);
  process.exit(1);
});
