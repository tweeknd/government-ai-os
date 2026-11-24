import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from 'recharts';
import { getTrends, getByCategory, getByZone, getDepartmentPerformance, getForecast } from '../api/analytics';

const PIE_COLORS = ['#3b82f6', '#f97316', '#ef4444', '#eab308', '#22c55e', '#8b5cf6'];

function LoadBox({ children, loading, height = 240 }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent"></div>
      </div>
    );
  }
  return children;
}

export default function AnalyticsPage() {
  const [trends, setTrends] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [byZone, setByZone] = useState([]);
  const [deptPerf, setDeptPerf] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState({ trends: true, category: true, zone: true, dept: true, forecast: true });

  useEffect(() => {
    getTrends().then(r => { setTrends(r.data?.data || r.data || []); setLoading(l => ({ ...l, trends: false })); }).catch(() => setLoading(l => ({ ...l, trends: false })));
    getByCategory().then(r => { setByCategory(r.data?.data || r.data || []); setLoading(l => ({ ...l, category: false })); }).catch(() => setLoading(l => ({ ...l, category: false })));
    getByZone().then(r => { setByZone(r.data?.data || r.data || []); setLoading(l => ({ ...l, zone: false })); }).catch(() => setLoading(l => ({ ...l, zone: false })));
    getDepartmentPerformance().then(r => { setDeptPerf(r.data?.data || r.data || []); setLoading(l => ({ ...l, dept: false })); }).catch(() => setLoading(l => ({ ...l, dept: false })));
    getForecast().then(r => { setForecast(r.data?.data || r.data || []); setLoading(l => ({ ...l, forecast: false })); }).catch(() => setLoading(l => ({ ...l, forecast: false })));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-500 text-sm mt-1">Insights, trends, and AI-powered forecasts</p>
          </div>

          {/* Row 1: Trends + Pie */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
            {/* Line Chart: Trends */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-base font-bold text-gray-800 mb-4">Complaints Trend (Last 30 Days)</h2>
              <LoadBox loading={loading.trends} height={240}>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v?.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2} dot={false} name="Complaints" />
                  </LineChart>
                </ResponsiveContainer>
              </LoadBox>
            </div>

            {/* Pie Chart: By Category */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-base font-bold text-gray-800 mb-4">Complaints by Category</h2>
              <LoadBox loading={loading.category} height={240}>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={byCategory} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {byCategory.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </LoadBox>
            </div>
          </div>

          {/* Row 2: By Zone + Dept Performance */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
            {/* Bar: By Zone */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-base font-bold text-gray-800 mb-4">Complaints by Zone</h2>
              <LoadBox loading={loading.zone} height={240}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={byZone} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="zone" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1e3a5f" radius={[4, 4, 0, 0]} name="Complaints" />
                  </BarChart>
                </ResponsiveContainer>
              </LoadBox>
            </div>

            {/* Bar: Dept Performance */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-base font-bold text-gray-800 mb-4">Department Performance</h2>
              <LoadBox loading={loading.dept} height={240}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={deptPerf} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="assigned" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Assigned" />
                    <Bar dataKey="resolved" fill="#22c55e" radius={[4, 4, 0, 0]} name="Resolved" />
                  </BarChart>
                </ResponsiveContainer>
              </LoadBox>
            </div>
          </div>

          {/* Forecast Card */}
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#0d6b6b] rounded-xl p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🔮</span>
              <h2 className="text-lg font-bold">AI Forecast — Next 7 Days</h2>
              <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">Gemini AI</span>
            </div>
            <LoadBox loading={loading.forecast} height={80}>
              {forecast.length === 0 ? (
                <p className="text-blue-200 text-sm">No forecast data available</p>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {forecast.map((f, i) => (
                    <div key={i} className="bg-white/10 rounded-lg p-3 text-center">
                      <div className="text-xs text-blue-200 mb-1">{f.date?.slice(5) || `Day ${i+1}`}</div>
                      <div className="text-xl font-bold">{f.predicted || f.count || 0}</div>
                      <div className="text-xs text-blue-300 mt-1">est.</div>
                    </div>
                  ))}
                </div>
              )}
            </LoadBox>
          </div>
        </main>
      </div>
    </div>
  );
}
