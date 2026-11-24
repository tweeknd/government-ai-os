import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { getComplaint, updateComplaintStatus, assignComplaint } from '../api/complaints';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

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
  critical: 'bg-red-100 text-red-800',
};

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getComplaint(id);
        const c = res.data.complaint || res.data;
        setComplaint(c);
        setNewStatus(c.status);
      } catch {
        setComplaint(null);
      } finally {
        setLoading(false);
      }
    };
    load();
    // Load officers list
    API.get('/auth/officers').then(r => setOfficers(r.data?.officers || r.data || [])).catch(() => {});
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === complaint.status) return;
    setUpdating(true);
    try {
      await updateComplaintStatus(id, newStatus);
      setComplaint(prev => ({ ...prev, status: newStatus }));
      setMessage('Status updated successfully!');
    } catch {
      setMessage('Failed to update status.');
    } finally {
      setUpdating(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleAssign = async () => {
    if (!selectedOfficer) return;
    setUpdating(true);
    try {
      await assignComplaint(id, selectedOfficer);
      setMessage('Complaint assigned successfully!');
      const res = await getComplaint(id);
      setComplaint(res.data.complaint || res.data);
    } catch {
      setMessage('Failed to assign complaint.');
    } finally {
      setUpdating(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const canEdit = user?.role === 'officer' || user?.role === 'department_head' || user?.role === 'admin';

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
          </main>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4">❌</div>
              <h3 className="text-lg font-semibold text-gray-700">Complaint not found</h3>
              <button onClick={() => navigate('/complaints')} className="mt-4 text-teal-600 hover:underline text-sm">← Back to complaints</button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const ai = complaint.aiClassification;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto max-w-5xl">
          {/* Back */}
          <button onClick={() => navigate('/complaints')} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
            ← Back to Complaints
          </button>

          {message && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm border ${
              message.includes('success') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {message}
            </div>
          )}

          {/* Header */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 leading-tight">{complaint.title}</h1>
                <div className="text-xs text-gray-400 mt-1 font-mono">ID: {complaint._id}</div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <span className={`text-sm px-3 py-1 rounded-full border font-medium capitalize ${statusColors[complaint.status] || statusColors.pending}`}>
                  {complaint.status?.replace('_', ' ')}
                </span>
                <span className={`text-sm px-3 py-1 rounded-full font-medium capitalize ${priorityColors[complaint.priority] || priorityColors.medium}`}>
                  {complaint.priority}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* Main details */}
            <div className="xl:col-span-2 space-y-5">
              {/* Description + Info */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-800 mb-3">Complaint Details</h2>
                <p className="text-sm text-gray-700 leading-relaxed mb-5">{complaint.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-400 block text-xs uppercase font-medium mb-0.5">Category</span><span className="capitalize font-medium">{complaint.category}</span></div>
                  <div><span className="text-gray-400 block text-xs uppercase font-medium mb-0.5">Zone</span><span className="font-medium">{complaint.location?.zone || complaint.zone}</span></div>
                  <div><span className="text-gray-400 block text-xs uppercase font-medium mb-0.5">Address</span><span className="font-medium">{complaint.location?.address || '—'}</span></div>
                  <div><span className="text-gray-400 block text-xs uppercase font-medium mb-0.5">Citizen</span><span className="font-medium">{complaint.citizen?.name || 'Anonymous'}</span></div>
                  <div><span className="text-gray-400 block text-xs uppercase font-medium mb-0.5">Submitted</span><span className="font-medium">{complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : '—'}</span></div>
                  <div><span className="text-gray-400 block text-xs uppercase font-medium mb-0.5">Last Updated</span><span className="font-medium">{complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleString() : '—'}</span></div>
                  {complaint.assignedTo && (
                    <div><span className="text-gray-400 block text-xs uppercase font-medium mb-0.5">Assigned To</span><span className="font-medium text-blue-700">{complaint.assignedTo?.name}</span></div>
                  )}
                  {complaint.department && (
                    <div><span className="text-gray-400 block text-xs uppercase font-medium mb-0.5">Department</span><span className="font-medium">{complaint.department?.name || complaint.department}</span></div>
                  )}
                </div>
              </div>

              {/* AI Classification */}
              {ai && (
                <div className="bg-gradient-to-br from-blue-50 to-teal-50 border border-teal-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🤖</span>
                    <h2 className="text-base font-bold text-teal-800">AI Classification</h2>
                    <span className="ml-auto text-xs text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">Gemini AI</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div><span className="text-gray-500 text-xs">Category</span><div className="font-semibold capitalize">{ai.category}</div></div>
                    <div><span className="text-gray-500 text-xs">Priority</span>
                      <div className={`inline-block font-semibold capitalize px-2 py-0.5 rounded-full text-xs mt-0.5 ${priorityColors[ai.priority] || ''}`}>{ai.priority}</div>
                    </div>
                    <div><span className="text-gray-500 text-xs">Suggested Dept</span><div className="font-semibold">{ai.suggestedDept}</div></div>
                  </div>
                  {ai.reasoning && (
                    <div className="bg-white/70 rounded-lg p-3 text-xs text-gray-700 mb-3">
                      <span className="font-semibold">Reasoning: </span>{ai.reasoning}
                    </div>
                  )}
                  {ai.recommendedActions?.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-teal-700 mb-1.5">Recommended Actions:</div>
                      <ul className="space-y-1">
                        {ai.recommendedActions.map((a, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                            <span className="text-teal-500 mt-0.5">→</span> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Panel: Actions */}
            {canEdit && (
              <div className="space-y-4">
                {/* Status Update */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <h3 className="font-bold text-gray-800 mb-3">Update Status</h3>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white capitalize mb-3"
                  >
                    {['pending','assigned','in_progress','resolved','closed'].map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updating || newStatus === complaint.status}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Update Status'}
                  </button>
                </div>

                {/* Assign Officer */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <h3 className="font-bold text-gray-800 mb-3">Assign to Officer</h3>
                  <select
                    value={selectedOfficer}
                    onChange={e => setSelectedOfficer(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white mb-3"
                  >
                    <option value="">Select Officer</option>
                    {officers.map(o => (
                      <option key={o._id} value={o._id}>{o.name} — {o.department?.name || ''}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssign}
                    disabled={updating || !selectedOfficer}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {updating ? 'Assigning...' : 'Assign Officer'}
                  </button>
                </div>

                {/* Timeline */}
                {complaint.timeline && complaint.timeline.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <h3 className="font-bold text-gray-800 mb-3">Status Timeline</h3>
                    <div className="relative pl-4 border-l-2 border-gray-200 space-y-3">
                      {complaint.timeline.map((t, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-teal-500 border-2 border-white"></div>
                          <div className="text-xs font-medium text-gray-700 capitalize">{t.status?.replace('_', ' ')}</div>
                          <div className="text-xs text-gray-400">{t.updatedAt ? new Date(t.updatedAt).toLocaleString() : ''}</div>
                          {t.note && <div className="text-xs text-gray-500 mt-0.5">{t.note}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
