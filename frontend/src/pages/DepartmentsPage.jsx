import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { getDepartments, createDepartment } from '../api/departments';
import { useAuth } from '../context/AuthContext';

export default function DepartmentsPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    contactEmail: '',
    categories: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchDepts = async () => {
    setLoading(true);
    try {
      const res = await getDepartments();
      setDepartments(res.data?.data || res.data || []);
    } catch (err) {
      setError('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase(),
        categories: formData.categories
          ? formData.categories.split(',').map((c) => c.trim().toLowerCase())
          : [],
      };
      await createDepartment(payload);
      setShowAddModal(false);
      setFormData({ name: '', code: '', description: '', contactEmail: '', categories: '' });
      await fetchDepts();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating department');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">🏛️ Government Departments</h1>
              <p className="text-slate-500 text-sm mt-1">
                Manage city administrative departments, assigned personnel, and service domains
              </p>
            </div>
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
              >
                <span>➕</span> Add Department
              </button>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Department Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mr-3"></div>
              Loading departments...
            </div>
          ) : departments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
              <span className="text-4xl block mb-2">🏛️</span>
              <p className="text-lg font-medium text-slate-700">No departments found</p>
              <p className="text-sm text-slate-400 mt-1">Departments added will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {departments.map((dept) => (
                <div
                  key={dept._id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 uppercase tracking-wider mb-1">
                          {dept.code}
                        </span>
                        <h3 className="text-lg font-bold text-slate-800">{dept.name}</h3>
                      </div>
                      <span className="text-2xl">
                        {dept.code === 'WATER' ? '💧' :
                         dept.code === 'ROADS' ? '🛣️' :
                         dept.code === 'HEALTH' ? '🏥' :
                         dept.code === 'ELEC' ? '⚡' : '🏢'}
                      </span>
                    </div>

                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                      {dept.description || 'No description provided.'}
                    </p>

                    <div className="space-y-2 text-sm border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400">Head of Department:</span>
                        <span className="font-medium text-slate-700">
                          {dept.head?.name || 'Unassigned'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400">Officers Assigned:</span>
                        <span className="font-medium text-slate-700">
                          {dept.officers?.length || 0} active
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400">Contact Email:</span>
                        <span className="text-blue-600 text-xs truncate max-w-[200px]">
                          {dept.contactEmail || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {dept.categories && dept.categories.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <span className="text-xs text-slate-400 block mb-1.5 font-medium">Service Categories</span>
                        <div className="flex flex-wrap gap-1.5">
                          {dept.categories.map((cat, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 capitalize"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>Status: <strong className="text-green-600">Operational</strong></span>
                    <span>Zone Coverage: All City Zones</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Department Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Add New Department</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Department Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sanitation & Waste Management"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Department Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SWM"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Brief overview of responsibilities..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      placeholder="contact@dept.gov.in"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Categories (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="waste, garbage, recycling"
                      value={formData.categories}
                      onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {submitting ? 'Creating...' : 'Save Department'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
