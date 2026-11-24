import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import AlertBanner from '../components/AlertBanner';
import { getIoTReadings, getIoTAlerts, simulateReadings } from '../api/iot';

const sensorIcons = {
  water_level:  '💧',
  air_quality:  '🌫️',
  waste_bin:    '🗑️',
  traffic:      '🚗',
  weather:      '🌡️',
};

const sensorUnits = {
  water_level:  '%',
  air_quality:  'AQI',
  waste_bin:    '%',
  traffic:      'v/hr',
  weather:      '°C',
};

function getStatusColor(reading) {
  if (reading.alert) return 'border-red-300 bg-red-50';
  const val = reading.value;
  const type = reading.sensorType;
  if (type === 'water_level' && val < 40) return 'border-yellow-300 bg-yellow-50';
  if (type === 'air_quality' && val > 100) return 'border-yellow-300 bg-yellow-50';
  if (type === 'waste_bin' && val > 70) return 'border-yellow-300 bg-yellow-50';
  return 'border-green-200 bg-green-50';
}

function getSensorStatusLabel(reading) {
  if (reading.alert) return { label: '🔴 Alert', color: 'text-red-700 bg-red-100' };
  const val = reading.value;
  const type = reading.sensorType;
  if (type === 'water_level' && val < 40) return { label: '🟡 Warning', color: 'text-yellow-700 bg-yellow-100' };
  if (type === 'air_quality' && val > 100) return { label: '🟡 Warning', color: 'text-yellow-700 bg-yellow-100' };
  if (type === 'waste_bin' && val > 70) return { label: '🟡 Warning', color: 'text-yellow-700 bg-yellow-100' };
  return { label: '🟢 Normal', color: 'text-green-700 bg-green-100' };
}

export default function IoTPage() {
  const [readings, setReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simMsg, setSimMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, aRes] = await Promise.allSettled([getIoTReadings(), getIoTAlerts()]);
      if (rRes.status === 'fulfilled') setReadings(rRes.value.data.readings || rRes.value.data || []);
      if (aRes.status === 'fulfilled') setAlerts(aRes.value.data.alerts || aRes.value.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSimulate = async () => {
    setSimulating(true);
    setSimMsg('');
    try {
      await simulateReadings();
      setSimMsg('✅ New readings generated!');
      await fetchData();
    } catch {
      setSimMsg('❌ Simulation failed. Try again.');
    } finally {
      setSimulating(false);
      setTimeout(() => setSimMsg(''), 4000);
    }
  };

  // Group by zone
  const zones = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'];
  const sensorTypes = ['water_level', 'air_quality', 'waste_bin', 'traffic', 'weather'];

  const getReading = (zone, type) =>
    readings.find(r => r.zone === zone && r.sensorType === type);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">IoT Sensors</h1>
              <p className="text-gray-500 text-sm mt-1">{readings.length} sensor readings across {zones.length} zones</p>
            </div>
            <div className="flex items-center gap-3">
              {simMsg && <span className="text-sm text-gray-600">{simMsg}</span>}
              <button
                onClick={handleSimulate}
                disabled={simulating}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {simulating ? (
                  <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> Simulating...</>
                ) : '⚡ Simulate New Readings'}
              </button>
            </div>
          </div>

          {/* Alerts banner */}
          <AlertBanner alerts={alerts} />

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
            </div>
          ) : (
            <>
              {/* Sensor Grid */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 pr-4 w-28">Zone</th>
                      {sensorTypes.map(type => (
                        <th key={type} className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 px-2">
                          <div className="text-lg">{sensorIcons[type]}</div>
                          <div>{type.replace('_', ' ')}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    {zones.map(zone => (
                      <tr key={zone}>
                        <td className="pr-4 py-2 font-semibold text-sm text-gray-700">{zone}</td>
                        {sensorTypes.map(type => {
                          const r = getReading(zone, type);
                          if (!r) return (
                            <td key={type} className="px-2 py-2">
                              <div className="bg-gray-100 rounded-xl p-3 text-center text-xs text-gray-400 h-20 flex flex-col items-center justify-center">
                                <div className="text-lg opacity-30">{sensorIcons[type]}</div>
                                No data
                              </div>
                            </td>
                          );
                          const status = getSensorStatusLabel(r);
                          return (
                            <td key={type} className="px-2 py-2">
                              <div className={`rounded-xl p-3 border text-center h-20 flex flex-col items-center justify-center gap-1 transition-all ${getStatusColor(r)}`}>
                                <div className="text-xl">{sensorIcons[type]}</div>
                                <div className="font-bold text-gray-900 text-sm leading-tight">
                                  {r.value}<span className="text-xs text-gray-500 font-normal ml-0.5">{sensorUnits[type]}</span>
                                </div>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${status.color}`}>{status.label}</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Alert List */}
              {alerts.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">⚠️ Active Alerts ({alerts.length})</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {alerts.map((a, i) => (
                      <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{sensorIcons[a.sensorType] || '📡'}</span>
                          <div>
                            <div className="font-semibold text-red-800 text-sm">{a.sensorType?.replace('_', ' ')}</div>
                            <div className="text-xs text-red-600 mt-0.5">{a.alertMessage}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {a.zone} · {a.value} {sensorUnits[a.sensorType]}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
