import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { createComplaint, getComplaints } from '../api/complaints';
import { useAuth } from '../context/AuthContext';

const categories = ['water', 'roads', 'electricity', 'sanitation', 'health', 'other'];
const zones = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'];

const categoryIcons = {
  water: '💧', roads: '🛣️', electricity: '⚡',
  sanitation: '🗑️', health: '🏥', other: '📌',
};

const statusConfig = {
  pending:     { label: 'Pending',     color: 'bg-yellow-100 text-yellow-800 border-yellow-200',  icon: '⏳', desc: 'Your complaint has been received and is awaiting review.' },
  assigned:    { label: 'Assigned',    color: 'bg-blue-100 text-blue-800 border-blue-200',        icon: '👮', desc: 'An officer has been assigned to handle your complaint.' },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800 border-purple-200',  icon: '🔧', desc: 'Work is currently underway to resolve your complaint.' },
  resolved:    { label: 'Resolved',    color: 'bg-green-100 text-green-800 border-green-200',     icon: '✅', desc: 'Your complaint has been resolved! Thank you for your patience.' },
  closed:      { label: 'Closed',      color: 'bg-gray-100 text-gray-700 border-gray-200',        icon: '🔒', desc: 'This complaint has been closed.' },
};

const priorityConfig = {
  low:      'bg-slate-100 text-slate-600',
  medium:   'bg-blue-100 text-blue-700',
  high:     'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

function StatusTimeline({ history }) {
  if (!history || history.length === 0) return null;
  return (
    <div className="mt-4">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Status Timeline</div>
      <div className="space-y-3">
        {[...history].reverse().map((h, i) => {
          const cfg = statusConfig[h.status] || statusConfig.pending;
          return (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-sm">{cfg.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-xs text-slate-400">{h.changedAt ? new Date(h.changedAt).toLocaleString() : ''}</span>
                </div>
                {h.note && <p className="text-xs text-slate-500 mt-1">{h.note}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CitizenPortal() {
  const { user } = useAuth();
  const [tab, setTab] = useState('submit');
  const [form, setForm] = useState({ title: '', description: '', category: 'water', address: '', zone: 'Zone 1' });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [myComplaints, setMyComplaints] = useState([]);
  const [aiResult, setAiResult] = useState(null);
  const [success, setSuccess] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const fileInputRef = useRef();

  useEffect(() => {
    if (tab === 'list') fetchMyComplaints();
  }, [tab]);

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const res = await getComplaints({ limit: 100 });
      // Backend returns { data: [...] } for citizens (auto-filtered)
      const list = res.data?.data || res.data?.complaints || res.data || [];
      setMyComplaints(Array.isArray(list) ? list : []);
    } catch {
      setMyComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 3); // max 3 images
    setImages(files);
    const previews = files.map(f => URL.createObjectURL(f));
    setImagePreviews(previews);
  };

  const removeImage = (idx) => {
    const newImages = images.filter((_, i) => i !== idx);
    const newPreviews = imagePreviews.filter((_, i) => i !== idx);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setAiResult(null);
    setSubmitting(true);
    try {
      // Build FormData to support image upload
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('location[address]', form.address);
      formData.append('location[zone]', form.zone);
      formData.append('location[lat]', '13.0827');
      formData.append('location[lng]', '80.2707');
      images.forEach(img => formData.append('images', img));

      const res = await createComplaint(formData, true); // true = multipart
      const complaint = res.data?.data || res.data?.complaint || res.data;
      setAiResult(complaint?.aiClassification);
      setSuccess(`✅ Complaint #${complaint?._id?.slice(-6).toUpperCase() || 'XXXXXX'} submitted! You can track its status in "My Complaints" tab.`);
      setForm({ title: '', description: '', category: 'water', address: '', zone: 'Zone 1' });
      setImages([]);
      setImagePreviews([]);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to submit complaint. Please check all fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredComplaints = filter === 'all'
    ? myComplaints
    : myComplaints.filter(c => c.status === filter);

  const resolvedCount = myComplaints.filter(c => c.status === 'resolved' || c.status === 'closed').length;
  const pendingCount  = myComplaints.filter(c => c.status === 'pending').length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 max-w-5xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">🏛️ Citizen Portal</h1>
            <p className="text-slate-500 text-sm mt-1">Welcome, <span className="font-semibold text-teal-700">{user?.name}</span>. File complaints or track your submissions.</p>
          </div>

          {/* Quick Stats */}
          {tab === 'list' && myComplaints.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Filed', value: myComplaints.length, icon: '📋', color: 'bg-blue-50 border-blue-200 text-blue-800' },
                { label: 'Resolved', value: resolvedCount, icon: '✅', color: 'bg-green-50 border-green-200 text-green-800' },
                { label: 'Pending', value: pendingCount, icon: '⏳', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border p-4 flex items-center gap-3 ${s.color}`}>
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <div className="text-xl font-bold">{s.value}</div>
                    <div className="text-xs font-medium opacity-75">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            {[
              { key: 'submit', label: '📝 Submit Complaint' },
              { key: 'list',   label: `📋 My Complaints ${myComplaints.length > 0 ? `(${myComplaints.length})` : ''}` },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── SUBMIT TAB ─────────────────────────────────── */}
          {tab === 'submit' && (
            <div className="max-w-2xl">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4 flex items-start gap-2">
                  <span>⚠️</span><span>{error}</span>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-4 rounded-lg text-sm mb-4">
                  <div className="font-semibold mb-1">Complaint Submitted!</div>
                  <div>{success}</div>
                  <button onClick={() => setTab('list')} className="mt-2 text-teal-700 underline text-xs font-medium">View in My Complaints →</button>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <span>📝</span> File a New Complaint
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Complaint Title <span className="text-red-500">*</span></label>
                    <input
                      name="title" value={form.title} onChange={handleChange} required
                      placeholder="Brief description of the issue (e.g. Water pipe burst on Main Road)"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Detailed Description <span className="text-red-500">*</span></label>
                    <textarea
                      name="description" value={form.description} onChange={handleChange} required rows={4}
                      placeholder="Describe the problem in detail — when it started, impact on residents, any safety concerns..."
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    />
                    <div className="text-xs text-slate-400 mt-1 text-right">{form.description.length} chars</div>
                  </div>

                  {/* Category & Zone */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Category <span className="text-red-500">*</span></label>
                      <select
                        name="category" value={form.category} onChange={handleChange}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                      >
                        {categories.map(c => (
                          <option key={c} value={c}>{categoryIcons[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Zone <span className="text-red-500">*</span></label>
                      <select
                        name="zone" value={form.zone} onChange={handleChange}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                      >
                        {zones.map(z => <option key={z} value={z}>{z}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Location Address <span className="text-red-500">*</span></label>
                    <input
                      name="address" value={form.address} onChange={handleChange} required
                      placeholder="Street name, landmark, or area"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">📷 Attach Photos (Optional, max 3)</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      {imagePreviews.length === 0 ? (
                        <div className="text-slate-400 text-sm">
                          <div className="text-3xl mb-1">📷</div>
                          <div>Click to upload photos of the issue</div>
                          <div className="text-xs mt-1">JPG, PNG, WEBP — max 3 photos</div>
                        </div>
                      ) : (
                        <div className="flex gap-3 flex-wrap justify-center">
                          {imagePreviews.map((src, i) => (
                            <div key={i} className="relative">
                              <img src={src} alt="" className="w-24 h-24 object-cover rounded-lg border border-slate-200" />
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                              >×</button>
                            </div>
                          ))}
                          {imagePreviews.length < 3 && (
                            <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-2xl">+</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info box */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                    <span className="font-semibold">🤖 AI-Powered:</span> Your complaint will be automatically classified by AI and assigned to the right department. You can track status updates in real-time.
                  </div>

                  <button
                    type="submit" disabled={submitting}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-semibold text-sm transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> Submitting & AI Analyzing...</>
                    ) : '🚀 Submit Complaint'}
                  </button>
                </form>
              </div>

              {/* AI Result Card */}
              {aiResult && (
                <div className="mt-5 bg-gradient-to-r from-blue-50 to-teal-50 border border-teal-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🤖</span>
                    <h3 className="font-bold text-teal-800">AI Classification Result</h3>
                    <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">Gemini AI</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div><span className="text-slate-500">Category:</span> <span className="font-medium capitalize">{aiResult.category}</span></div>
                    <div><span className="text-slate-500">Priority:</span> <span className={`font-medium capitalize px-2 py-0.5 rounded-full text-xs ${priorityConfig[aiResult.priority] || 'bg-gray-100'}`}>{aiResult.priority}</span></div>
                    <div><span className="text-slate-500">Dept:</span> <span className="font-medium">{aiResult.suggestedDept}</span></div>
                    <div><span className="text-slate-500">Status:</span> <span className="font-medium text-yellow-700">⏳ Pending Review</span></div>
                  </div>
                  {aiResult.reasoning && (
                    <div className="text-xs text-slate-600 bg-white/70 rounded-lg p-3 mb-3">
                      <span className="font-medium">AI Reasoning: </span>{aiResult.reasoning}
                    </div>
                  )}
                  {aiResult.recommendedActions?.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-teal-700 mb-1.5">Recommended Actions for Officials:</div>
                      <ul className="space-y-1">
                        {aiResult.recommendedActions.map((a, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                            <span className="text-teal-500 mt-0.5 flex-shrink-0">✓</span> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── MY COMPLAINTS TAB ─────────────────────────── */}
          {tab === 'list' && (
            <div>
              {/* Filter bar */}
              {myComplaints.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-5">
                  {['all', 'pending', 'assigned', 'in_progress', 'resolved', 'closed'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                        filter === f
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                      }`}
                    >
                      {f === 'all' ? '🔍 All' : `${statusConfig[f]?.icon} ${statusConfig[f]?.label}`}
                    </button>
                  ))}
                  <button
                    onClick={fetchMyComplaints}
                    className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  >
                    🔄 Refresh
                  </button>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent mr-3"></div>
                  Loading your complaints...
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                  <div className="text-5xl mb-3">📭</div>
                  <h3 className="text-lg font-semibold text-slate-700">
                    {filter === 'all' ? 'No complaints filed yet' : `No ${filter} complaints`}
                  </h3>
                  <p className="text-slate-400 text-sm mt-2">
                    {filter === 'all' ? 'Your submitted complaints will appear here.' : 'Try a different filter.'}
                  </p>
                  {filter === 'all' && (
                    <button
                      onClick={() => setTab('submit')}
                      className="mt-4 bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-teal-700"
                    >
                      File a Complaint
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredComplaints.map(c => {
                    const cfg = statusConfig[c.status] || statusConfig.pending;
                    const isExpanded = expandedId === c._id;
                    const isResolved = c.status === 'resolved' || c.status === 'closed';

                    return (
                      <div
                        key={c._id}
                        className={`bg-white rounded-xl border shadow-sm transition-all ${
                          isResolved ? 'border-green-200' : 'border-slate-200'
                        } ${isExpanded ? 'shadow-md' : ''}`}
                      >
                        {/* Resolved banner */}
                        {c.status === 'resolved' && (
                          <div className="bg-green-500 text-white text-xs font-semibold px-4 py-2 rounded-t-xl flex items-center gap-2">
                            <span>✅</span> Your complaint has been RESOLVED! Thank you for helping improve our city.
                          </div>
                        )}

                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Category icon */}
                            <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-xl">
                              {categoryIcons[c.category] || '📌'}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-semibold text-slate-900 text-sm leading-tight">{c.title}</div>
                                  <div className="text-xs text-slate-400 mt-0.5">
                                    #{c._id?.slice(-6).toUpperCase()} · {c.location?.zone || 'Unknown Zone'} · {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${cfg.color}`}>
                                    {cfg.icon} {cfg.label}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${priorityConfig[c.priority] || 'bg-gray-100'}`}>
                                    {c.priority} priority
                                  </span>
                                </div>
                              </div>

                              {/* Status description */}
                              <div className={`mt-2 text-xs rounded-lg p-2 ${cfg.color} border opacity-80`}>
                                {cfg.desc}
                              </div>

                              {/* Assigned officer info */}
                              {c.assignedTo && (
                                <div className="mt-2 text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5">
                                  <span>👮</span> Assigned to: <strong>{c.assignedTo?.name || 'Government Officer'}</strong>
                                </div>
                              )}

                              {/* Resolution date */}
                              {c.resolvedAt && (
                                <div className="mt-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5 ml-2">
                                  <span>📅</span> Resolved on: <strong>{new Date(c.resolvedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Expand button */}
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : c._id)}
                            className="mt-3 text-xs text-teal-700 hover:text-teal-800 font-medium flex items-center gap-1"
                          >
                            {isExpanded ? '▲ Hide details' : '▼ View full details & timeline'}
                          </button>

                          {/* Expanded section */}
                          {isExpanded && (
                            <div className="mt-4 border-t border-slate-100 pt-4 space-y-4">
                              {/* Full description */}
                              <div>
                                <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Your Description</div>
                                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{c.description}</p>
                              </div>

                              {/* Location */}
                              {c.location?.address && (
                                <div>
                                  <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Location</div>
                                  <div className="text-sm text-slate-700 flex items-center gap-1.5">
                                    <span>📍</span> {c.location.address}
                                  </div>
                                </div>
                              )}

                              {/* AI Classification */}
                              {c.aiClassification?.category && (
                                <div>
                                  <div className="text-xs font-semibold text-slate-500 uppercase mb-2">🤖 AI Classification</div>
                                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs space-y-1">
                                    <div><span className="text-slate-500">Category:</span> <span className="font-medium capitalize">{c.aiClassification.category}</span></div>
                                    <div><span className="text-slate-500">Suggested Dept:</span> <span className="font-medium">{c.aiClassification.suggestedDept}</span></div>
                                    {c.aiClassification.reasoning && (
                                      <div><span className="text-slate-500">Reasoning:</span> <span className="text-slate-600">{c.aiClassification.reasoning}</span></div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Status Timeline */}
                              <StatusTimeline history={c.statusHistory} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
