import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  { icon: '👥', title: 'Citizen Data', desc: 'Unified citizen profiles, complaint history, and engagement tracking for a smarter government.' },
  { icon: '🏛️', title: 'Gov Services', desc: 'Streamline service delivery across all departments with real-time status updates.' },
  { icon: '🤖', title: 'AI Engine', desc: 'Gemini-powered AI classifies complaints, predicts hotspots, and recommends actions automatically.' },
  { icon: '🗺️', title: 'GIS Mapping', desc: 'Interactive Leaflet maps show complaint density, IoT sensors, and zone heatmaps.' },
  { icon: '📡', title: 'IoT Integration', desc: 'Real-time sensor data for water levels, air quality, waste bins, and traffic across all zones.' },
  { icon: '📊', title: 'Analytics', desc: 'Rich dashboards with trend charts, category breakdowns, and AI-forecasted complaint volumes.' },
  { icon: '📋', title: 'Smart Dashboards', desc: 'Role-based dashboards for citizens, officers, department heads, and administrators.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#1a4a7a] to-[#0d6b6b]">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🏛️</span>
          <div>
            <div className="text-white font-bold text-lg leading-tight">Government AI OS</div>
            <div className="text-blue-300 text-xs">Smart City Platform</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-blue-200 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/10"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-teal-500 hover:bg-teal-400 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center px-6 pt-20 pb-16 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/30 text-teal-300 text-sm px-4 py-1.5 rounded-full mb-6">
          <span className="animate-pulse w-2 h-2 bg-teal-400 rounded-full"></span>
          Powered by Google Gemini AI
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
          Government AI{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-400">
            Operating System
          </span>
        </h1>
        <p className="text-xl text-blue-200 max-w-3xl mx-auto mb-10 leading-relaxed">
          AI-powered platform for smart city governance. From citizen complaints to IoT sensors,
          from predictive analytics to automated resolutions — all in one unified platform.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto bg-teal-500 hover:bg-teal-400 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-xl transition-all hover:scale-105 hover:shadow-teal-500/30"
          >
            📝 File a Complaint
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105 backdrop-blur-sm"
          >
            🔒 Official Login
          </Link>
        </div>

        {/* Stats Row */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { label: 'Complaints Resolved', value: '12,500+' },
            { label: 'IoT Sensors Active', value: '250+' },
            { label: 'Avg Resolution Time', value: '4.2 days' },
            { label: 'Citizen Satisfaction', value: '94%' },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold text-teal-300">{s.value}</div>
              <div className="text-xs text-blue-300 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20 max-w-7xl mx-auto">
        <h2 className="text-center text-white text-3xl font-bold mb-10">
          Everything You Need for Smart Governance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/20 transition-all hover:scale-105 cursor-default"
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-blue-200 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="bg-white/5 border-t border-white/10 py-12 px-6 text-center">
        <h3 className="text-white text-2xl font-bold mb-3">Ready to transform your city?</h3>
        <p className="text-blue-200 mb-6">Join thousands of citizens and officials using the platform.</p>
        <div className="flex justify-center gap-4">
          <Link to="/register" className="bg-teal-500 hover:bg-teal-400 text-white px-7 py-3 rounded-xl font-semibold transition-colors">
            Get Started
          </Link>
          <Link to="/login" className="border border-white/30 text-white px-7 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors">
            Sign In
          </Link>
        </div>
      </section>

      <footer className="text-center py-6 text-blue-400 text-xs border-t border-white/10">
        © 2024 Government AI Operating System · Built with React & Google Gemini AI
      </footer>
    </div>
  );
}
