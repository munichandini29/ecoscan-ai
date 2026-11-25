import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CitizenDashboard from './pages/CitizenDashboard';
import UploadPage from './pages/UploadPage';
import NgoDashboard from './pages/NgoDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <nav className="bg-slate-900 text-white px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <Link to="/" className="font-bold text-lg text-emerald-400 tracking-tight">
          EcoScan AI
        </Link>
        <div className="flex flex-wrap gap-5 text-sm font-medium">
          <Link to="/" className="hover:text-emerald-300">Home</Link>
          <Link to="/dashboard" className="hover:text-emerald-300">Citizen Portal</Link>
          <Link to="/upload" className="hover:text-emerald-300">AI Image Scan</Link>
          <Link to="/ngo" className="hover:text-emerald-300">NGO Triage</Link>
          <Link to="/admin" className="hover:text-emerald-300">Admin Console</Link>
        </div>
      </nav>

      <div className="min-h-screen bg-slate-50/60">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<CitizenDashboard />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/ngo" element={<NgoDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}