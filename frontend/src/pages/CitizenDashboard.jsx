import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle, Search, Download, ShieldCheck, AlertTriangle,
  MapPin, Award, Eye, X, CheckCircle2, Clock, Sparkles
} from 'lucide-react';
import { fetchReports } from '../services/api';

const CATEGORIES = [
  'All',
  'Plastic Waste',
  'Garbage Dump',
  'Smoke Pollution',
  'Water Pollution',
  'Clean / No Threat',
];

export default function CitizenDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeReport, setActiveReport] = useState(null);

  useEffect(() => {
    fetchReports()
      .then((data) => setReports(data))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  // Filtered list
  const filteredReports = reports.filter((r) => {
    const matchesCat = selectedCategory === 'All' || r.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      r.location?.toLowerCase().includes(q) ||
      r.issue_type?.toLowerCase().includes(q) ||
      `#eco-${100 + r.id}`.includes(q);
    return matchesCat && matchesSearch;
  });

  // Live Civic Metrics
  const totalScans = reports.length;
  const activeHazards = reports.filter((r) => r.category !== 'Clean / No Threat' && r.status !== 'Resolved').length;
  const cleanZones = reports.filter((r) => r.category === 'Clean / No Threat' || r.status === 'Resolved').length;
  const ecoPoints = totalScans * 50 + cleanZones * 25;

  // CSV Export for Municipal Audit
  const handleExportCSV = () => {
    const headers = ['Ticket_ID', 'Category', 'Issue_Type', 'Location', 'Severity', 'Confidence', 'Status', 'Assigned_NGO', 'Timestamp'];
    const rows = filteredReports.map((r) => [
      `ECO-${100 + r.id}`,
      `"${r.category}"`,
      `"${r.issue_type}"`,
      `"${r.location}"`,
      r.severity,
      `${r.confidence}%`,
      r.status,
      `"${r.assigned_ngo}"`,
      r.created_at,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'ecoscan_citizen_audit_log.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2E7D32] mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Civic Environmental Watchdog
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Citizen Incident & Audit Portal</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track geo-tagged AI field audits, municipal dispatch progress, and verified clean zones.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={filteredReports.length === 0}
            className="inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-40"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 bg-[#2E7D32] hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-xs"
          >
            <PlusCircle className="w-4 h-4" /> New Field Scan
          </Link>
        </div>
      </div>

      {/* Live Civic KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <p className="text-xs font-semibold uppercase text-slate-400">Total Field Audits</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalScans}</p>
          <p className="text-xs text-slate-500 mt-1">Synced with SQLite/Cloud DB</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <p className="text-xs font-semibold uppercase text-slate-400">Active Hazards</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{activeHazards}</p>
          <p className="text-xs text-slate-500 mt-1">Awaiting or in NGO cleanup</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <p className="text-xs font-semibold uppercase text-slate-400">Verified Clean / Resolved</p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{cleanZones}</p>
          <p className="text-xs text-slate-500 mt-1">Safe zones confirmed by AI</p>
        </div>
        <div className="bg-gradient-to-br from-[#2E7D32] to-emerald-800 p-5 rounded-2xl text-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase text-emerald-100">Citizen Eco-Score</p>
            <Award className="w-5 h-5 text-emerald-200" />
          </div>
          <p className="text-2xl font-extrabold mt-1">{ecoPoints} pts</p>
          <p className="text-xs text-emerald-100 mt-1">Civic Guardian Tier</p>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#2E7D32] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search location or #ECO-101..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-sm focus:outline-none focus:border-[#2E7D32]"
          />
        </div>
      </div>

      {/* Evidence Cards Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
          Loading live citizen field reports...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <p className="text-slate-600 font-medium">No matching field reports found.</p>
          <Link to="/upload" className="inline-block text-sm font-semibold text-[#2E7D32] hover:underline">
            + Upload your first environmental scan
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((r) => {
            const isClean = r.category === 'Clean / No Threat' || r.severity === 'None';
            return (
              <div
                key={r.id}
                onClick={() => setActiveReport(r)}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-emerald-300 transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Evidence Thumbnail */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    {r.image_data ? (
                      <img src={r.image_data} alt={r.issue_type} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                        No Thumbnail Stored
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-mono px-2.5 py-1 rounded-md">
                      #ECO-{100 + r.id}
                    </span>
                    <span
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold ${
                        isClean
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.severity === 'High'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isClean ? 'Verified Clean' : `${r.severity} Severity`}
                    </span>
                  </div>

                  {/* Report Content */}
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-[#2E7D32]">{r.category}</span>
                      <span>AI Confidence: <strong>{r.confidence}%</strong></span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base line-clamp-1">{r.issue_type}</h3>

                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{r.location}</span>
                    </p>

                    <p className="text-xs text-slate-600 line-clamp-2 pt-1">{r.impact}</p>
                  </div>
                </div>

                {/* Footer Status Bar */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                    {r.status === 'Resolved' || r.status === 'Verified Clean' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    {r.status}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#2E7D32] font-semibold">
                    <Eye className="w-3.5 h-3.5" /> Inspect Audit
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed AI Audit Modal */}
      {activeReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
                  #ECO-{100 + activeReport.id}
                </span>
                <span className="text-xs text-slate-400">{activeReport.created_at}</span>
              </div>
              <button
                onClick={() => setActiveReport(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {activeReport.image_data && (
                <img
                  src={activeReport.image_data}
                  alt={activeReport.issue_type}
                  className="w-full max-h-64 object-cover rounded-xl border border-slate-200"
                />
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold uppercase text-[#2E7D32]">{activeReport.category}</span>
                  <h2 className="text-xl font-bold text-slate-900">{activeReport.issue_type}</h2>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                  Confidence: {activeReport.confidence}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block">Incident Location</span>
                  <strong className="text-slate-800">{activeReport.location}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Response Unit / Status</span>
                  <strong className="text-slate-800">{activeReport.assigned_ngo} ({activeReport.status})</strong>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-1">Environmental Impact Assessment</h4>
                <p className="text-sm text-slate-700 leading-relaxed">{activeReport.impact}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Recommended Mitigation Protocol</h4>
                <ul className="space-y-1.5 text-sm text-slate-700 list-disc pl-5">
                  {activeReport.action_steps?.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}