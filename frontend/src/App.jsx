import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CitizenPortal from './pages/CitizenPortal';
import Dashboard from './pages/Dashboard';
import ComplaintsPage from './pages/ComplaintsPage';
import ComplaintDetail from './pages/ComplaintDetail';
import MapPage from './pages/MapPage';
import AnalyticsPage from './pages/AnalyticsPage';
import IoTPage from './pages/IoTPage';
import AIAssistant from './pages/AIAssistant';
import DepartmentsPage from './pages/DepartmentsPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Citizen route */}
        <Route
          path="/citizen"
          element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <CitizenPortal />
            </ProtectedRoute>
          }
        />

        {/* Officer / Admin routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['officer', 'department_head', 'admin']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/complaints"
          element={
            <ProtectedRoute>
              <ComplaintsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/complaints/:id"
          element={
            <ProtectedRoute>
              <ComplaintDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <MapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/iot"
          element={
            <ProtectedRoute>
              <IoTPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-assistant"
          element={
            <ProtectedRoute>
              <AIAssistant />
            </ProtectedRoute>
          }
        />
        <Route
          path="/departments"
          element={
            <ProtectedRoute allowedRoles={['admin', 'department_head']}>
              <DepartmentsPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
