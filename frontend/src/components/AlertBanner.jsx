import React, { useState } from 'react';

const severityStyle = {
  critical: 'bg-red-600 border-red-700',
  high:     'bg-orange-500 border-orange-600',
  medium:   'bg-yellow-500 border-yellow-600',
  low:      'bg-blue-500 border-blue-600',
};

export default function AlertBanner({ alerts = [], onDismissAll }) {
  const [dismissed, setDismissed] = useState([]);

  const visible = alerts.filter((a) => !dismissed.includes(a._id || a.id || a.message));

  if (!visible.length) return null;

  return (
    <div className="space-y-2 mb-4">
      {visible.slice(0, 5).map((alert, idx) => {
        const key = alert._id || alert.id || alert.message || idx;
        const severity = alert.severity || (alert.alert ? 'high' : 'medium');
        const style = severityStyle[severity] || severityStyle.medium;
        return (
          <div
            key={key}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-white text-sm ${style} shadow-md`}
          >
            <span className="text-xl">⚠️</span>
            <div className="flex-1 min-w-0">
              <span className="font-semibold">{alert.sensorType?.replace('_', ' ') || 'IoT Alert'}</span>
              {' — '}
              <span>{alert.alertMessage || alert.message}</span>
              {alert.zone && <span className="ml-2 opacity-80">({alert.zone})</span>}
            </div>
            <button
              onClick={() => setDismissed((d) => [...d, key])}
              className="text-white opacity-70 hover:opacity-100 flex-shrink-0"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        );
      })}
      {visible.length > 5 && (
        <div className="text-xs text-gray-500 text-center">
          +{visible.length - 5} more alerts
        </div>
      )}
      {onDismissAll && visible.length > 0 && (
        <button
          onClick={onDismissAll}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          Dismiss all
        </button>
      )}
    </div>
  );
}
