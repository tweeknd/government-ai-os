import React from 'react';
import { useNavigate } from 'react-router-dom';

const statusColors = {
  pending:     'bg-yellow-100 text-yellow-800 border-yellow-300',
  assigned:    'bg-blue-100 text-blue-800 border-blue-300',
  in_progress: 'bg-purple-100 text-purple-800 border-purple-300',
  resolved:    'bg-green-100 text-green-800 border-green-300',
  closed:      'bg-gray-100 text-gray-700 border-gray-300',
};

const priorityColors = {
  low:      'bg-slate-100 text-slate-700',
  medium:   'bg-blue-100 text-blue-800',
  high:     'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800 font-bold',
};

const categoryIcons = {
  water:       '💧',
  roads:       '🛣️',
  electricity: '⚡',
  sanitation:  '🗑️',
  health:      '🏥',
  other:       '📌',
};

export default function ComplaintCard({ complaint, compact = false }) {
  const navigate = useNavigate();

  if (!complaint) return null;

  return (
    <div
      onClick={() => navigate(`/complaints/${complaint._id}`)}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-xl flex-shrink-0">{categoryIcons[complaint.category] || '📌'}</span>
          <div className="min-w-0">
            <div className={`font-semibold text-gray-900 truncate ${compact ? 'text-sm' : 'text-base'}`}>
              {complaint.title}
            </div>
            {!compact && (
              <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{complaint.description}</div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[complaint.status] || statusColors.pending}`}>
            {complaint.status?.replace('_', ' ')}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[complaint.priority] || priorityColors.medium}`}>
            {complaint.priority}
          </span>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
          <span>📍 {complaint.location?.zone || complaint.zone}</span>
          <span>🏷️ {complaint.category}</span>
          <span className="ml-auto">
            {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : ''}
          </span>
        </div>
      )}
    </div>
  );
}
