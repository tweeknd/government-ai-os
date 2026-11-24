import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { getComplaints } from '../api/complaints';

const statusColors = {
  pending:     'bg-yellow-100 text-yellow-800',
  assigned:    'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  resolved:    'bg-green-100 text-green-800',
  closed:      'bg-gray-100 text-gray-700',
};
const priorityColors = {
  low:      'bg-slate-100 text-slate-700',
  medium:   'bg-blue-100 text-blue-800',
  high:     'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};
const categoryIcons = {
  water:'💧', roads:'🛣️', electricity:'⚡', sanitation:'🗑️', health:'🏥', other:'📌',
};

const CATEGORIES = ['water', 'roads', 'electricity', 'sanitation', 'health', 'other'];
const STATUSES = ['pending', 'assigned', 'in_progress', 'resolved', 'closed'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const ZONES = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'];
const PAGE_SIZE = 10;

export default function ComplaintsPage() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', category: '', zone: '', priority: '', search: '' });

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.zone) params.zone = filters.zone;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      const res = await getComplaints(params);
      setComplaints(res.data.complaints || res.data || []);
      setTotal(res.data.total || (res.data.complaints || res.data || []).length);
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const handleFilter = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-gray-900">Complaints</h1>
            <p className="text-gray-500 text-sm mt-1">{total} total complaints</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-5">
            <div className="flex flex-wrap gap-3 items-center">
              <input
                type="text"
                placeholder="🔍 Search complaints..."
                value={filters.search}
                onChange={e => handleFilter('search', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-48"
              />
              {[
                { key: 'status', options: STATUSES, placeholder: 'All Statuses' },
                { key: 'category', options: CATEGORIES, placeholder: 'All Categories' },
                { key: 'zone', options: ZONES, placeholder: 'All Zones' },
                { key: 'priority', options: PRIORITIES, placeholder: 'All Priorities' },
              ].map(({ key, options, placeholder }) => (
                <select
                  key={key}
                  value={filters[key]}
                  onChange={e => handleFilter(key, e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white capitalize"
                >
                  <option value="">{placeholder}</option>
                  {options.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
                </select>
              ))}
              {Object.values(filters).some(Boolean) && (
                <button
                  onClick={() => { setFilters({ status:'', category:'', zone:'', priority:'', search:'' }); setPage(1); }}
                  className="text-sm text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-3 py-2"
                >
                  ✕ Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Complaints Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent"></div>
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-gray-500">No complaints found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                        <th className="text-left px-4 py-3 font-semibold">ID</th>
                        <th className="text-left px-4 py-3 font-semibold">Title</th>
                        <th className="text-left px-4 py-3 font-semibold">Category</th>
                        <th className="text-left px-4 py-3 font-semibold">Zone</th>
                        <th className="text-left px-4 py-3 font-semibold">Priority</th>
                        <th className="text-left px-4 py-3 font-semibold">Status</th>
                        <th className="text-left px-4 py-3 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {complaints.map((c) => (
                        <tr
                          key={c._id}
                          onClick={() => navigate(`/complaints/${c._id}`)}
                          className="hover:bg-blue-50 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                            #{c._id?.slice(-6)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span>{categoryIcons[c.category] || '📌'}</span>
                              <span className="text-sm font-medium text-gray-900 truncate max-w-xs">{c.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 capitalize">{c.category}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{c.location?.zone || c.zone || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${priorityColors[c.priority] || priorityColors.medium}`}>
                              {c.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${statusColors[c.status] || statusColors.pending}`}>
                              {c.status?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Page {page} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        ← Prev
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                        return (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`px-3 py-1.5 rounded-lg border text-sm ${
                              p === page ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
