import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Leaf, LogOut, Camera, LayoutDashboard, HeartHandshake, ShieldCheck } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    localStorage.removeItem('ecoscan_user');
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
      isActive
        ? 'bg-emerald-50 text-[#2E7D32]'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#2E7D32] text-white flex items-center justify-center shadow-xs">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base tracking-tight block leading-none">
              EcoScan AI
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              Cleanliness Audit
            </span>
          </div>
        </Link>

        {/* Role-Based Navigation Links */}
        {user && (
          <nav className="hidden md:flex items-center gap-1.5">
            {user.role === 'citizen' && (
              <>
                <NavLink to="/dashboard" className={navLinkClass}>
                  <LayoutDashboard className="w-3.5 h-3.5" /> Citizen Portal
                </NavLink>
                <NavLink to="/upload" className={navLinkClass}>
                  <Camera className="w-3.5 h-3.5" /> New AI Scan
                </NavLink>
              </>
            )}

            {user.role === 'ngo' && (
              <NavLink to="/ngo" className={navLinkClass}>
                <HeartHandshake className="w-3.5 h-3.5" /> NGO Triage Queue
              </NavLink>
            )}

            {user.role === 'admin' && (
              <NavLink to="/admin" className={navLinkClass}>
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Console
              </NavLink>
            )}
          </nav>
        )}

        {/* Dynamic User Profile & Logout (Replaces hardcoded demo@ecoscan.ai) */}
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
              <p className="text-[11px] font-mono text-slate-500 uppercase">
                {user.userId} • {user.role}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogoutClick}
              title="Logout"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 border border-slate-200 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-emerald-800 text-white text-xs font-semibold transition"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}