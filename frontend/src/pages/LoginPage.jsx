import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, HeartHandshake, Lock, ArrowRight, KeyRound } from 'lucide-react';

const TEST_ACCOUNTS = [
  { role: 'citizen', userId: 'CIT-101', name: 'Chandini (Citizen)', label: 'Citizen #1 (CIT-101)' },
  { role: 'citizen', userId: 'CIT-102', name: 'Rahul Verma (Citizen)', label: 'Citizen #2 (CIT-102)' },
  { role: 'ngo', userId: 'NGO-201', name: 'GreenEarth Response Squad', label: 'NGO Squad (NGO-201)' },
  { role: 'admin', userId: 'ADM-001', name: 'Municipal Commissioner', label: 'Admin Console (ADM-001)' },
];

export default function LoginPage({ onLogin }) {
  const [role, setRole] = useState('citizen');
  const [name, setName] = useState('Chandini');
  const [userId, setUserId] = useState('CIT-101');
  const navigate = useNavigate();

  const loginWithAccount = (acc) => {
    localStorage.setItem('ecoscan_user', JSON.stringify(acc));
    onLogin(acc);
    if (acc.role === 'citizen') navigate('/dashboard');
    else if (acc.role === 'ngo') navigate('/ngo');
    else navigate('/admin');
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const generatedId =
      role === 'citizen'
        ? userId.trim() || `CIT-${Math.floor(100 + Math.random() * 900)}`
        : role === 'ngo'
        ? 'NGO-201'
        : 'ADM-001';

    loginWithAccount({
      role,
      userId: generatedId,
      name: name.trim() || 'Citizen User',
    });
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">EcoScan AI Role-Based Login</h1>
          <p className="text-sm text-slate-500">Sign in with a verified test account or custom profile</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-[#2E7D32]" /> Quick Demo Test Accounts (1-Click Login)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {TEST_ACCOUNTS.map((acc) => (
              <button
                key={acc.userId}
                type="button"
                onClick={() => loginWithAccount(acc)}
                className="text-left p-2.5 rounded-lg bg-white border border-slate-200 hover:border-[#2E7D32] hover:bg-emerald-50/40 transition cursor-pointer"
              >
                <span className="block text-xs font-bold text-slate-800">{acc.label}</span>
                <span className="block text-[11px] text-slate-500 truncate">{acc.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl">
          <button
            type="button"
            onClick={() => { setRole('citizen'); setUserId('CIT-101'); setName('Chandini'); }}
            className={`py-2 px-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 cursor-pointer ${
              role === 'citizen' ? 'bg-white text-[#2E7D32] shadow-xs' : 'text-slate-600'
            }`}
          >
            <User className="w-4 h-4" /> Citizen
          </button>
          <button
            type="button"
            onClick={() => { setRole('ngo'); setUserId('NGO-201'); setName('GreenEarth Response Squad'); }}
            className={`py-2 px-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 cursor-pointer ${
              role === 'ngo' ? 'bg-white text-[#2E7D32] shadow-xs' : 'text-slate-600'
            }`}
          >
            <HeartHandshake className="w-4 h-4" /> NGO Squad
          </button>
          <button
            type="button"
            onClick={() => { setRole('admin'); setUserId('ADM-001'); setName('Municipal Admin'); }}
            className={`py-2 px-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 cursor-pointer ${
              role === 'admin' ? 'bg-white text-[#2E7D32] shadow-xs' : 'text-slate-600'
            }`}
          >
            <Lock className="w-4 h-4" /> Admin
          </button>
        </div>

        <form onSubmit={handleCustomSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">User ID</label>
              <input
                type="text"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-mono"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#2E7D32] hover:bg-emerald-800 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            Sign In as {role.toUpperCase()} <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}