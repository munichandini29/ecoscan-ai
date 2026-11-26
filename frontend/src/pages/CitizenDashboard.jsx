import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Trash2,
  X,
  ArrowRight,
  RefreshCw,
  Search,
  WifiOff,
} from 'lucide-react';
import { fetchReports, deleteReport } from '../services/api';

export default function DashboardPage({ user }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const loadMyReports = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchReports({ user_id: user?.userId || 'CIT-101' });
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setReports([]);
      setError('Backend unreachable on port 8000. Start FastAPI (`uvicorn main:app --reload --port 8000`) and click Refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyReports();
  }, [user?.userId]);

  const handleDeleteFalseReport = async (e, report) => {
    e.stopPropagation();
    const ticketCode = `#ECO-${100 + report.id}`;
    const confirmed = window.confirm(
      `Withdraw & delete false report ${ticketCode} (${report.category})? It will be removed before NGO dispatch.`
    );
    if (!confirmed) return;

    setDeletingId(report.id);
    try {
      await deleteReport(report.id, user?.userId);
      setReports((prev) => prev.filter((item) => item.id !== report.id));
      if (selectedReport?.id === report.id) {
        setSelectedReport(null);
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete this report.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      const ticketCode = `#eco-${100 + r.id}`;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        ticketCode.includes(q) ||
        (r.category || '').toLowerCase().includes(q) ||
        (r.location || '').toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [reports, searchQuery, statusFilter]);

  const pendingCount = reports.filter((r) => r.status === 'Pending').length;
  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;
  const resolutionRate =
    reports.length > 0 ? `${Math.round((resolvedCount / reports.length) * 100)}%` : '0%';

  // Show '--' when disconnected or loading instead of misleading 0 / 0%
  const isUnavailable = loading || Boolean(error);
  const controlsDisabled = loading || Boolean(error) || reports.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header with Single Refresh Control */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2E7D32]">
            Citizen Portal • {user?.userId || 'CIT-101'}
          </span>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {user?.name || 'Citizen User'}
          </h1>
          <p className="text-sm text-slate-500">
            Track submitted hazards, withdraw false reports before NGO dispatch, and view cleanup proof.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={loadMyReports}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Syncing...' : 'Refresh'}
          </button>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-emerald-800 text-white text-sm font-semibold"
          >
            <Camera className="w-4 h-4" /> New AI Scan <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Summary Cards ('--' on connection error/loading to avoid false 0 state) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold uppercase text-slate-400">Active Tickets</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {isUnavailable ? '--' : reports.length}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold uppercase text-amber-600">Pending NGO Action</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">
            {isUnavailable ? '--' : pendingCount}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold uppercase text-emerald-700">Resolved</p>
          <p className="text-3xl font-bold text-emerald-700 mt-1">
            {isUnavailable ? '--' : resolvedCount}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold uppercase text-slate-500">Resolution Rate</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">
            {isUnavailable ? '--' : resolutionRate}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar (Disabled when offline or empty) */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            disabled={controlsDisabled}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              controlsDisabled
                ? 'Search disabled (no active records loaded)'
                : 'Search tickets by ID, category, or location...'
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
          />
        </div>
        <select
          disabled={controlsDisabled}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>

      {/* Connection Error State */}
      {error && (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3.5">
          <WifiOff className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-red-800">FastAPI Backend Disconnected</h2>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton / Empty / Reports Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse"
            >
              <div className="h-40 bg-slate-200 rounded-xl" />
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-5 bg-slate-200 rounded w-2/3" />
              <div className="h-3 bg-slate-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : !error && reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-[#2E7D32] mx-auto" />
          <h2 className="text-lg font-semibold text-slate-800">No Hazard Tickets in Your Queue</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Clean scenes do not generate tickets, and deleted false reports are removed immediately.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 mt-2 px-4 py-2.5 rounded-xl bg-[#2E7D32] text-white text-sm font-semibold"
          >
            <Camera className="w-4 h-4" /> Scan an Image
          </Link>
        </div>
      ) : !error && filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          No reports match your current search or filter.
        </div>
      ) : (
        !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReports.map((report) => {
              const isResolved = report.status === 'Resolved';
              const canDelete = report.status === 'Pending';

              return (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-[#2E7D32] transition overflow-hidden shadow-xs flex flex-col cursor-pointer"
                >
                  <div className="relative h-44 bg-slate-100">
                    {report.image_data ? (
                      <img
                        src={report.image_data}
                        alt={report.category}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        No Preview Image
                      </div>
                    )}

                    <span
                      className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {report.status}
                    </span>

                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900/80 text-white">
                      {report.severity}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>#ECO-{100 + report.id}</span>
                        <span>{report.confidence}% conf.</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">{report.category}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2">{report.issue_type}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                        <span className="truncate">{report.location}</span>
                      </p>
                      {report.created_at && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" /> {report.created_at}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      {canDelete ? (
                        <button
                          type="button"
                          disabled={deletingId === report.id}
                          onClick={(e) => handleDeleteFalseReport(e, report)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 disabled:opacity-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {deletingId === report.id ? 'Deleting...' : 'Delete False Report'}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" /> Verified Clean
                        </span>
                      )}

                      <span className="text-xs font-semibold text-[#2E7D32]">Details →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Detail / Before-After Modal */}
      {selectedReport && (
        <div
          onClick={() => setSelectedReport(null)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-mono text-slate-400">
                  #ECO-{100 + selectedReport.id} • {selectedReport.status}
                </span>
                <h2 className="text-xl font-bold text-slate-900">{selectedReport.category}</h2>
                <p className="text-xs text-slate-500">{selectedReport.location}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Before (Reported)</p>
                {selectedReport.image_data && (
                  <img
                    src={selectedReport.image_data}
                    alt="Before cleanup"
                    className="w-full h-44 object-cover rounded-xl border border-slate-200"
                  />
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-400 mb-1">After (Cleanup Proof)</p>
                {selectedReport.after_image_data ? (
                  <img
                    src={selectedReport.after_image_data}
                    alt="After cleanup"
                    className="w-full h-44 object-cover rounded-xl border border-emerald-200"
                  />
                ) : (
                  <div className="w-full h-44 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400 p-3 text-center">
                    Awaiting NGO cleanup verification
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 space-y-1 text-xs text-slate-700">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Impact Assessment
              </p>
              <p>{selectedReport.impact}</p>
              {selectedReport.verification_note && (
                <p className="text-emerald-700 font-medium pt-1">{selectedReport.verification_note}</p>
              )}
            </div>

            {selectedReport.status === 'Pending' && (
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={(e) => handleDeleteFalseReport(e, selectedReport)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Delete False Report
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}