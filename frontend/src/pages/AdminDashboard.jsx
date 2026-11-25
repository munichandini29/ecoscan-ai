import React from 'react';

export default function AdminDashboard() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">SuperAdmin System Console</h1>
      <p className="text-sm text-slate-500 mb-6">Monitor AI model accuracy, active threat classes, and platform health</p>

      <div className="grid md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <p className="text-xs font-semibold text-slate-400 uppercase">AI Model Engine</p>
          <p className="text-lg font-bold text-[#2E7D32] mt-1">Gemini 2.5 Flash</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <p className="text-xs font-semibold text-slate-400 uppercase">Mean Confidence</p>
          <p className="text-lg font-bold text-slate-900 mt-1">92.8%</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <p className="text-xs font-semibold text-slate-400 uppercase">Active NGOs</p>
          <p className="text-lg font-bold text-[#1976D2] mt-1">14 Verified</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <p className="text-xs font-semibold text-slate-400 uppercase">API Status</p>
          <p className="text-lg font-bold text-emerald-600 mt-1">Healthy (200 OK)</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h2 className="font-bold text-slate-800 mb-3">Configured Environmental Threat Classes</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {['Plastic Waste', 'Garbage Dump', 'Smoke Pollution', 'Water Pollution'].map((cls) => (
            <div key={cls} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-semibold text-slate-800">{cls}</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Active</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}