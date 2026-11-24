import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '🏠', roles: ['officer', 'department_head', 'admin'] },
  { path: '/citizen', label: 'My Portal', icon: '👤', roles: ['citizen'] },
  { path: '/complaints', label: 'Complaints', icon: '📋', roles: ['officer', 'department_head', 'admin'] },
  { path: '/map', label: 'Map View', icon: '🗺️', roles: ['officer', 'department_head', 'admin'] },
  { path: '/analytics', label: 'Analytics', icon: '📊', roles: ['officer', 'department_head', 'admin'] },
  { path: '/iot', label: 'IoT Sensors', icon: '📡', roles: ['officer', 'department_head', 'admin'] },
  { path: '/ai-assistant', label: 'AI Assistant', icon: '🤖', roles: ['officer', 'department_head', 'admin'] },
  { path: '/departments', label: 'Departments', icon: '🏛️', roles: ['admin', 'department_head'] },
];

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const visible = navItems.filter((i) => !i.roles || i.roles.includes(user?.role));

  return (
    <aside className="w-56 min-h-screen bg-[#1e3a5f] text-white flex flex-col pt-4 pb-8 shadow-xl">
      <div className="px-4 mb-6">
        <div className="text-xs text-blue-300 uppercase font-semibold tracking-wider">Navigation</div>
      </div>
      <nav className="flex-1 px-2 space-y-1">
        {visible.map((item) => {
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 mt-4 border-t border-blue-800 pt-4">
        <div className="text-xs text-blue-400">Logged in as</div>
        <div className="text-sm font-medium text-white mt-0.5">{user?.name}</div>
        <div className="text-xs text-teal-400 capitalize mt-0.5">{user?.role?.replace('_', ' ')}</div>
        {user?.department && (
          <div className="text-xs text-blue-300 mt-0.5">{user.department?.name || user.department}</div>
        )}
      </div>
    </aside>
  );
}
