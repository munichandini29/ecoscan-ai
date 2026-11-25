import React, { useEffect, useState } from 'react';
import { fetchReports, updateReportStatus } from '../services/api';

export default function NgoDashboard() {
  const [reports, setReports] = useState([
    { id: 101, category: 'Plastic Waste', location: 'Adyar River Bank', severity: 'High', status: 'Pending', assigned_ngo: 'Unassigned' },
    { id: 102, category: 'Water Pollution', location: 'Velachery Lake Canal', severity: 'High', status: 'Dispatched', assigned_ngo: 'GreenEarth Squad' },
  ]);

  useEffect(() => {
    fetchReports()
      .then((data) => { if (data && data.length > 0) setReports(data); })
      .catch(() => {});
  }, []);

  const handleDispatch = async (id) => {
    try {
      await updateReportStatus(id, 'Dispatched', 'EcoAction Response Team');
    } catch {}
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Dispatched', assigned_ngo: 'EcoAction Response Team' } : r))
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">NGO Incident Triage & Dispatch Portal</h1>
      <p className="text-sm text-slate-500 mb-6">Assign cleanup squads to verified citizen threat alerts</p>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-3">Report ID</th>
              <th className="px-6 py-3">Threat</th>
              <th className="px-6 py-3">Location</th>
              <th className="px-6 py-3">Severity</th>
              <th className="px-6 py-3">Assigned Squad</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map((r) => (
              <tr key={r.id}>
                <td className="px-6 py-4 font-mono text-xs">#{r.id}</td>
                <td className="px-6 py-4 font-semibold">{r.category}</td>
                <td className="px-6 py-4 text-slate-600">{r.location}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">{r.severity}</span>
                </td>
                <td className="px-6 py-4 text-slate-700">{r.assigned_ngo || 'Unassigned'}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleDispatch(r.id)}
                    className="bg-[#1976D2] hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    {r.status === 'Dispatched' ? 'Re-Assign Squad' : 'Dispatch Team'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}