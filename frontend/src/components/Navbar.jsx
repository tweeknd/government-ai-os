import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getComplaints } from '../api/complaints';

const navLinks = [
  { path: '/dashboard',    label: 'Dashboard',   icon: '🏠', roles: ['officer', 'department_head', 'admin'] },
  { path: '/citizen',      label: 'My Portal',   icon: '👤', roles: ['citizen'] },
  { path: '/complaints',   label: 'Complaints',  icon: '📋', roles: ['officer', 'department_head', 'admin'] },
  { path: '/map',          label: 'Map View',    icon: '🗺️', roles: ['officer', 'department_head', 'admin'] },
  { path: '/analytics',    label: 'Analytics',   icon: '📊', roles: ['officer', 'department_head', 'admin'] },
  { path: '/iot',          label: 'IoT Sensors', icon: '📡', roles: ['officer', 'department_head', 'admin'] },
  { path: '/ai-assistant', label: 'AI Assistant',icon: '🤖', roles: ['officer', 'department_head', 'admin'] },
  { path: '/departments',  label: 'Departments', icon: '🏛️', roles: ['admin', 'department_head'] },
];

const statusConfig = {
  pending:     { icon: '⏳', label: 'Pending',     color: 'text-yellow-600' },
  assigned:    { icon: '👮', label: 'Assigned',    color: 'text-blue-600' },
  in_progress: { icon: '🔧', label: 'In Progress', color: 'text-purple-600' },
  resolved:    { icon: '✅', label: 'Resolved',    color: 'text-green-600' },
  closed:      { icon: '🔒', label: 'Closed',      color: 'text-gray-500' },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen]         = useState(false);
  const [notifOpen, setNotifOpen]       = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unseenCount, setUnseenCount]   = useState(0);
  const notifRef = useRef();
  const SEEN_KEY = `gov_seen_${user?._id || user?.id}`;

  // Fetch complaints for citizen notifications
  useEffect(() => {
    if (user?.role !== 'citizen') return;
    const fetchNotifs = async () => {
      try {
        const res = await getComplaints({ limit: 50 });
        const list = res.data?.data || res.data?.complaints || res.data || [];
        const arr = Array.isArray(list) ? list : [];
        // Build notification events from status history
        const events = [];
        arr.forEach(c => {
          (c.statusHistory || []).forEach(h => {
            if (h.status !== 'pending') {
              events.push({
                id: `${c._id}-${h.status}-${h.changedAt}`,
                complaintId: c._id,
                title: c.title,
                status: h.status,
                note: h.note,
                changedAt: h.changedAt || c.updatedAt,
              });
            }
          });
        });
        // Sort newest first
        events.sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));
        setNotifications(events.slice(0, 10));
        // Compute unseen
        const seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
        const unseen = events.filter(e => !seen.includes(e.id));
        setUnseenCount(unseen.length);
      } catch { /* ignore */ }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  // Close notif panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openNotif = () => {
    setNotifOpen(v => !v);
    // Mark all as seen
    const ids = notifications.map(n => n.id);
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
    setUnseenCount(0);
  };

  const visibleLinks = navLinks.filter(l => !l.roles || l.roles.includes(user?.role));

  return (
    <nav className="bg-[#1e3a5f] text-white shadow-lg z-50 relative">
      <div className="max-w-full px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏛️</span>
          <div>
            <div className="font-bold text-sm leading-tight">Government AI OS</div>
            <div className="text-xs text-blue-300 leading-tight">Smart City Platform</div>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {visibleLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.path
                  ? 'bg-teal-600 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Right side: notif bell + user + logout */}
        <div className="flex items-center gap-3">

          {/* 🔔 Notification Bell — only for citizens */}
          {user?.role === 'citizen' && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={openNotif}
                className="relative p-2 rounded-lg text-blue-200 hover:bg-blue-800 hover:text-white transition"
                title="Complaint Updates"
              >
                <span className="text-xl">🔔</span>
                {unseenCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                    {unseenCount > 9 ? '9+' : unseenCount}
                  </span>
                )}
              </button>

              {/* Notification Panel */}
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  <div className="bg-[#1e3a5f] text-white px-4 py-3 flex items-center justify-between">
                    <div className="font-semibold text-sm">🔔 Complaint Updates</div>
                    <Link to="/citizen" onClick={() => setNotifOpen(false)} className="text-xs text-blue-300 hover:text-white">View All →</Link>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm">
                        <div className="text-3xl mb-2">📭</div>
                        No updates yet
                      </div>
                    ) : (
                      notifications.map(n => {
                        const cfg = statusConfig[n.status] || statusConfig.pending;
                        return (
                          <Link
                            key={n.id}
                            to="/citizen"
                            onClick={() => setNotifOpen(false)}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-100 transition"
                          >
                            <span className="text-xl mt-0.5 flex-shrink-0">{cfg.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-slate-700 truncate">{n.title}</div>
                              <div className={`text-xs font-medium ${cfg.color}`}>
                                Status: {cfg.label}
                              </div>
                              {n.note && <div className="text-xs text-slate-400 mt-0.5 truncate">{n.note}</div>}
                              <div className="text-xs text-slate-300 mt-0.5">
                                {n.changedAt ? new Date(n.changedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 bg-slate-50 text-xs text-slate-400 text-center border-t">
                      Updates refresh every 30 seconds automatically
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User info */}
          <div className="hidden sm:block text-right">
            <div className="text-sm font-medium">{user?.name}</div>
            <div className="text-xs text-blue-300 capitalize">{user?.role?.replace('_', ' ')}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-sm font-bold">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            Logout
          </button>
          {/* Mobile toggle */}
          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="md:hidden bg-blue-900 px-4 pb-4">
          {visibleLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium mb-1 ${
                location.pathname === link.path
                  ? 'bg-teal-600 text-white'
                  : 'text-blue-200 hover:bg-blue-800'
              }`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
