# 🏛️ Government AI Operating System

An AI-powered platform for smart city governance using Node.js, React, MongoDB, and Google Gemini AI.

## Architecture

The platform is organized into **7 modules**:

1. **Authentication & RBAC** – JWT-based login with 4 roles: Citizen, Officer, Department Head, Admin
2. **Citizen Complaint Portal** – Submit, track, and manage civic complaints with AI auto-classification
3. **GIS Map Module** – Interactive Leaflet.js map showing complaint hotspots and IoT sensor readings by zone
4. **IoT Sensor Dashboard** – Real-time simulation of 5 city zones monitoring air quality, water pressure, traffic, noise, and waste levels
5. **Analytics & Reporting** – Recharts-powered dashboards with trend, category, zone, and performance charts; AI forecasting
6. **Gemini AI Chatbot** – Context-aware assistant for officials; answers questions about complaints, risk, and city data
7. **Admin Control Panel** – User management, department assignment, system-wide stats, and AI risk assessment

## Tech Stack

- **Frontend:** React (CRA) + Tailwind CSS + Leaflet.js + Recharts
- **Backend:** Node.js + Express.js
- **Database:** MongoDB
- **AI:** Google Gemini API (`@google/generative-ai`)
- **Auth:** JWT

## Project Structure

```
government-ai-os/
  backend/   ← Express API (port 5000)
  frontend/  ← React app (port 3000)
```

## Prerequisites

- Node.js v18+
- MongoDB (running locally or MongoDB Atlas)
- Google Gemini API key (from Google AI Studio: https://aistudio.google.com)

## Setup Instructions

### 1. Clone & navigate

```bash
cd "Rag Chatbot/government-ai-os"
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: add MONGODB_URI and GEMINI_API_KEY
npm run seed     # Seeds demo data
npm run dev      # Starts on http://localhost:5000
```

### 3. Frontend Setup (new terminal)

```bash
cd frontend
npm install
npm start        # Starts on http://localhost:3000
```

## Demo Credentials (after seeding)

| Role         | Email                | Password    |
|--------------|----------------------|-------------|
| Admin        | admin@gov.in         | Admin@123   |
| Dept Head    | head.water@gov.in    | Head@123    |
| Officer      | officer1@gov.in      | Officer@123 |
| Citizen      | citizen1@gov.in      | Citizen@123 |

## API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

### Complaints
```
POST   /api/complaints
GET    /api/complaints
GET    /api/complaints/:id
PUT    /api/complaints/:id/status
PUT    /api/complaints/:id/assign
GET    /api/complaints/stats/summary
GET    /api/complaints/hotspots
```

### IoT
```
GET    /api/iot/readings
GET    /api/iot/readings/:zone
GET    /api/iot/alerts
POST   /api/iot/simulate
```

### Analytics
```
GET    /api/analytics/trends
GET    /api/analytics/by-category
GET    /api/analytics/by-zone
GET    /api/analytics/department-performance
GET    /api/analytics/forecast
```

### AI (Gemini)
```
POST   /api/ai/classify
POST   /api/ai/chat
POST   /api/ai/recommendations
GET    /api/ai/risk-assessment
```

## Features

- ✅ Citizen complaint portal with AI auto-classification
- ✅ Role-based dashboards (Citizen, Officer, Dept Head, Admin)
- ✅ Interactive GIS map with complaint + IoT markers
- ✅ Analytics with 4 chart types
- ✅ IoT sensor simulation for 5 zones
- ✅ Gemini AI chatbot for officials
- ✅ AI risk assessment and action recommendations
- ✅ JWT authentication
