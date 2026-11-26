import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import CitizenDashboard from './pages/CitizenDashboard';
import UploadPage from './pages/UploadPage';
import NgoDashboard from './pages/NgoDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ecoscan_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const getDefaultRoute = (u) => {
    if (!u) return '/login';
    if (u.role === 'citizen') return '/dashboard';
    if (u.role === 'ngo') return '/ngo';
    return '/admin';
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
        <Navbar user={user} onLogout={setUser} />
        <Routes>
          <Route path="/" element={<LandingPage />} />

          {/* Already logged in -> redirect straight to their role dashboard */}
          <Route
            path="/login"
            element={user ? <Navigate to={getDefaultRoute(user)} replace /> : <LoginPage onLogin={setUser} />}
          />

          <Route
            path="/dashboard"
            element={user?.role === 'citizen' ? <CitizenDashboard user={user} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/upload"
            element={user?.role === 'citizen' ? <UploadPage user={user} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/ngo"
            element={user?.role === 'ngo' || user?.role === 'admin' ? <NgoDashboard user={user} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/admin"
            element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}