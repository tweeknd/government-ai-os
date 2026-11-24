import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import ComplaintCard from '../components/ComplaintCard';
import AlertBanner from '../components/AlertBanner';
import { getComplaintStats, getComplaints } from '../api/complaints';
import { getRecommendations } from '../api/ai';
import { getIoTAlerts } from '../api/iot';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, complaintsRes] = await Promise.allSettled([
          getComplaintStats(),
          getComplaints({ limit: 10, sort: '-createdAt' }),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (complaintsRes.status === 'fulfilled') {
          setRecentComplaints(complaintsRes.value.data.complaints || complaintsRes.value.data || []);
        }
      } catch {}

      try {
        const alertsRes = await getIoTAlerts();
        setAlerts(alertsRes.data?.alerts || alertsRes.data || []);
      } catch {}

      try {
        const recRes = await getRecommendations();
        setRecommendations(recRes.data?.recommendations || recRes.data || []);
      } catch {}

      setLoading(false);
    };
    load();
  }, []);

  const statCards = [
    { title: 'Total Complaints', value: stats?.total ?? '—', icon: '📋', color: 'blue' },
    { title: 'Pending', value: stats?.pending ?? '—', icon: '⏳', color: 'amber' },
    { title: 'Resolved', value: stats?.resolved ?? '—', icon: '✅', color: 'green' },
    { title: 'Critical', value: stats?.critical ?? '—', icon: '🚨', color: 'red' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Real-time overview of city governance metrics</p>
          </div>

          {/* IoT Alerts */}
          {alerts.length > 0 && <AlertBanner alerts={alerts} />}

          {/* Stat Cards */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-xl border h-24 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {statCards.map((s) => (
                <StatCard key={s.title} {...s} />
              ))}
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Recent Complaints */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Recent Complaints</h2>
                <span className="text-xs text-gray-400">Last 10</span>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : recentComplaints.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-sm">No complaints yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentComplaints.map((c) => (
                    <ComplaintCard key={c._id} complaint={c} compact />
                  ))}
                </div>
              )}
            </div>

            {/* Right Panel: AI Recommendations + IoT Alerts */}
            <div className="space-y-5">
              {/* AI Recommendations */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🤖</span>
                  <h2 className="text-lg font-bold text-gray-800">AI Recommendations</h2>
                </div>
                {loading ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse"></div>)}
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">No recommendations available</div>
                ) : (
                  <div className="space-y-3">
                    {recommendations.slice(0, 5).map((rec, i) => (
                      <div key={i} className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-100 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                          }`}>{rec.priority || 'info'}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-800">{rec.title || rec.action || rec}</div>
                            {rec.description && <div className="text-xs text-gray-500 mt-0.5">{rec.description}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* IoT Alert Summary */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">📡</span>
                  <h2 className="text-lg font-bold text-gray-800">Active IoT Alerts</h2>
                </div>
                {alerts.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-100">
                    <span>✅</span> All sensors operating normally
                  </div>
                ) : (
                  <div className="space-y-2">
                    {alerts.slice(0, 5).map((a, i) => (
                      <div key={i} className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3 text-sm">
                        <span className="text-red-500 flex-shrink-0">🔴</span>
                        <div>
                          <div className="font-medium text-red-800">{a.sensorType?.replace('_', ' ')}</div>
                          <div className="text-xs text-red-600">{a.alertMessage} · {a.zone}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
