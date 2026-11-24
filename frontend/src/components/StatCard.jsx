import React from 'react';

export default function StatCard({ title, value, subtitle, icon, color = 'blue', trend }) {
  const colorMap = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-700', text: 'text-blue-700', val: 'text-blue-900' },
    teal: { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'bg-teal-100 text-teal-700', text: 'text-teal-700', val: 'text-teal-900' },
    red:  { bg: 'bg-red-50',  border: 'border-red-200',  icon: 'bg-red-100 text-red-700',   text: 'text-red-700',  val: 'text-red-900' },
    amber:{ bg: 'bg-amber-50',border: 'border-amber-200',icon: 'bg-amber-100 text-amber-700',text: 'text-amber-700',val: 'text-amber-900' },
    green:{ bg: 'bg-green-50',border: 'border-green-200',icon: 'bg-green-100 text-green-700',text: 'text-green-700',val: 'text-green-900' },
    purple:{bg:'bg-purple-50',border:'border-purple-200',icon:'bg-purple-100 text-purple-700',text:'text-purple-700',val:'text-purple-900'},
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`rounded-xl border p-5 shadow-sm flex items-center gap-4 ${c.bg} ${c.border}`}>
      {icon && (
        <div className={`text-3xl w-14 h-14 rounded-xl flex items-center justify-center ${c.icon} flex-shrink-0`}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-semibold uppercase tracking-wide ${c.text}`}>{title}</div>
        <div className={`text-3xl font-bold mt-1 ${c.val}`}>{value ?? '—'}</div>
        {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
        {trend !== undefined && (
          <div className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% from last week
          </div>
        )}
      </div>
    </div>
  );
}
