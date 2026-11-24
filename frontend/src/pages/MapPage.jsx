import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { getComplaints } from '../api/complaints';
import { getIoTReadings } from '../api/iot';

const categoryColors = {
  water:       '#3b82f6',
  roads:       '#f97316',
  health:      '#ef4444',
  electricity: '#eab308',
  sanitation:  '#22c55e',
  other:       '#8b5cf6',
};

export default function MapPage() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [complaints, setComplaints] = useState([]);
  const [iotReadings, setIotReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, iotRes] = await Promise.allSettled([
          getComplaints({ limit: 200 }),
          getIoTReadings(),
        ]);
        if (cRes.status === 'fulfilled') setComplaints(cRes.value.data.complaints || cRes.value.data || []);
        if (iotRes.status === 'fulfilled') setIotReadings(iotRes.value.data.readings || iotRes.value.data || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (typeof window === 'undefined' || !window.L) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const L = window.L;
    const map = L.map(mapRef.current, { center: [13.0827, 80.2707], zoom: 12 });
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Complaint markers
    complaints.forEach((c) => {
      const lat = c.location?.lat || (13.0827 + (Math.random() - 0.5) * 0.1);
      const lng = c.location?.lng || (80.2707 + (Math.random() - 0.5) * 0.1);
      const color = categoryColors[c.category] || '#6b7280';

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:200px">
            <b style="font-size:13px">${c.title}</b><br/>
            <span style="color:#6b7280;font-size:11px">${c.category} · ${c.location?.zone || ''}</span><br/>
            <span style="display:inline-block;margin-top:4px;padding:2px 8px;border-radius:9999px;font-size:11px;background:#f3f4f6">${c.status?.replace('_', ' ')}</span>
          </div>
        `);
    });

    // IoT Sensor markers
    iotReadings.forEach((r) => {
      const lat = r.location?.lat || (13.0827 + (Math.random() - 0.5) * 0.08);
      const lng = r.location?.lng || (80.2707 + (Math.random() - 0.5) * 0.08);

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;background:${r.alert ? '#ef4444' : '#14b8a6'};border:2px solid white;border-radius:3px;box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:8px">📡</div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:180px">
            <b style="font-size:12px">📡 ${r.sensorType?.replace('_', ' ')}</b><br/>
            <span style="font-size:12px">${r.value} ${r.unit}</span><br/>
            <span style="color:#6b7280;font-size:11px">${r.zone}</span><br/>
            ${r.alert ? '<span style="color:#ef4444;font-size:11px">⚠️ Alert: ' + (r.alertMessage || 'Threshold exceeded') + '</span>' : '<span style="color:#22c55e;font-size:11px">✅ Normal</span>'}
          </div>
        `);
    });

    // Zone circles
    const zoneCoords = [
      [13.09, 80.27],
      [13.07, 80.26],
      [13.08, 80.29],
      [13.06, 80.28],
      [13.10, 80.25],
    ];
    zoneCoords.forEach((coord, i) => {
      L.circle(coord, { radius: 1500, color: '#1e3a5f', fillColor: '#1e3a5f', fillOpacity: 0.05, weight: 1 })
        .addTo(map)
        .bindTooltip(`Zone ${i + 1}`, { permanent: true, direction: 'center', className: 'zone-label' });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading, complaints, iotReadings]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Map View</h1>
              <p className="text-gray-500 text-sm mt-1">{complaints.length} complaints · {iotReadings.length} IoT sensors</p>
            </div>
          </div>

          <div className="flex gap-5">
            {/* Map */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" style={{ height: '70vh' }}>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
                </div>
              ) : (
                <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
              )}
            </div>

            {/* Legend */}
            <div className="w-56 flex-shrink-0 space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <h3 className="font-bold text-gray-800 mb-3 text-sm">Complaint Categories</h3>
                <div className="space-y-2">
                  {Object.entries(categoryColors).map(([cat, color]) => (
                    <div key={cat} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></div>
                      <span className="capitalize text-gray-700">{cat}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <h3 className="font-bold text-gray-800 mb-3 text-sm">IoT Sensors</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-teal-500 flex-shrink-0"></div>
                    <span className="text-gray-700">Normal sensor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500 flex-shrink-0"></div>
                    <span className="text-gray-700">Alert sensor</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <h3 className="font-bold text-gray-800 mb-3 text-sm">Zones</h3>
                <div className="space-y-1 text-xs text-gray-500">
                  {[1,2,3,4,5].map(z => (
                    <div key={z} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full border border-blue-800 bg-blue-50 flex-shrink-0"></div>
                      Zone {z}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
