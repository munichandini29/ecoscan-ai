import React, { useEffect, useState, useMemo } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Search,
  WifiOff,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Eye,
  RotateCcw,
  Ban,
  X,
} from 'lucide-react';
import { fetchReports, updateReportStatus } from '../services/api';

export default function AdminDashboard({ user }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [inspectReport, setInspectReport] = useState(null);
  const [overrideLoading, setOverrideLoading] = useState(false);

  const loadAllReports = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchReports();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setReports([]);
      setError('Backend unreachable on port 8000. Start FastAPI (`uvicorn main:app --reload --port 8000`) and click Refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllReports();
  }, []);

  const handleAdminOverride = async (report, newStatus) => {
    const ticketCode = `#ECO-${100 + report.id}`;
    const isReopen = newStatus === 'Pending';
    const promptMsg = isReopen
      ? `Re-open ${ticketCode} and send back to NGO queue? (Clears current cleanup proof)`
      : `Dismiss ${ticketCode} (${report.confidence}% AI conf.) as borderline/invalid report?`;

    if (!window.confirm(promptMsg)) return;

    const note = isReopen
      ? `Re-opened by ${user?.name || 'Municipal Admin'} — Cleanup proof rejected upon audit.`
      : `Dismissed by ${user?.name || 'Municipal Admin'} — Borderline confidence (${report.confidence}%) rejected.`;

    setOverrideLoading(true);
    try {
      const updated = await updateReportStatus(report.id, newStatus, report.assigned_ngo, note);
      setReports((prev) =>
        prev.map((item) =>
          item.id === report.id
            ? {
                ...item,
                status: updated.status,
                after_image_data: isReopen ? null : item.after_image_data,
                verification_note: updated.verification_note,
              }
            : item
        )
      );
      if (inspectReport?.id === report.id) {
        setInspectReport((prev) =>
          prev
            ? {
                ...prev,
                status: updated.status,
                after_image_data: isReopen ? null : prev.after_image_data,
                verification_note: updated.verification_note,
              }
            : null
        );
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Admin override failed.');
    } finally {
      setOverrideLoading(false);
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
        (r.location || '').toLowerCase().includes(q) ||
        (r.assigned_ngo || '').toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [reports, searchQuery, statusFilter]);

  const totalCount = reports.length;
  const pendingCount = reports.filter((r) => r.status === 'Pending').length;
  const inProgressCount = reports.filter((r) => r.status === 'In Progress').length;
  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;

  const isUnavailable = loading || Boolean(error);
  const controlsDisabled = loading || Boolean(error) || reports.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2E7D32] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> {user?.userId || 'ADM-001'} • Municipal Oversight
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            {user?.name || 'Municipal Admin Console'}
          </h1>
          <p className="text-sm text-slate-500">
            Visual proof-of-work inspection, SLA turnaround tracking, and admin override controls.
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={loadAllReports}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Syncing...' : 'Refresh'}
        </button>
      </div>

      {/* System KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold uppercase text-slate-400">Total Logged Tickets</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {isUnavailable ? '--' : totalCount}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold uppercase text-amber-600">Pending Triage</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">
            {isUnavailable ? '--' : pendingCount}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold uppercase text-blue-600">Active Cleanup</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            {isUnavailable ? '--' : inProgressCount}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold uppercase text-emerald-700">AI-Verified Resolved</p>
          <p className="text-3xl font-bold text-emerald-700 mt-1">
            {isUnavailable ? '--' : resolvedCount}
          </p>
        </div>
      </div>

      {/* Filters */}
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
                ? 'Search disabled (no records loaded)'
                : 'Search audit log by ticket ID, hazard, location, or NGO squad...'
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
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Offline Banner */}
      {error && (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3.5">
          <WifiOff className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-red-800">FastAPI Telemetry Server Disconnected</h2>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Audit Log Table with SLA & Inspect Controls */}
      {!loading && !error && filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
          No audit records available for the current filter.
        </div>
      ) : (
        !loading &&
        !error && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="px-4 py-3">Ticket</th>
                    <th className="px-4 py-3">Hazard & AI Conf.</th>
                    <th className="px-4 py-3">Location & Squad</th>
                    <th className="px-4 py-3">SLA & Timestamps</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Audit Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setInspectReport(r)}
                      className="hover:bg-slate-50/80 cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        #ECO-{100 + r.id}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{r.category}</p>
                        <p
                          className={`text-[11px] ${
                            r.confidence < 65 ? 'text-amber-600 font-semibold' : 'text-slate-500'
                          }`}
                        >
                          {r.severity} • {r.confidence}% conf.
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[200px]">
                        <p className="truncate flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                          <span className="truncate">{r.location}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          Squad: {r.assigned_ngo}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            (r.sla_status || '').includes('Breached') ||
                            (r.sla_status || '').includes('Overdue')
                              ? 'bg-red-50 text-red-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {r.elapsed_text || 'N/A'} • {r.sla_status || 'Within 24h SLA'}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Created: {r.created_at}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold ${
                            r.status === 'Resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'In Progress'
                              ? 'bg-blue-100 text-blue-800'
                              : r.status === 'Rejected'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status === 'Resolved' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : r.status === 'In Progress' ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          {r.status}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setInspectReport(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
                        </button>

                        {r.status === 'Resolved' && (
                          <button
                            type="button"
                            disabled={overrideLoading}
                            onClick={() => handleAdminOverride(r, 'Pending')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-semibold cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Re-open
                          </button>
                        )}

                        {r.status === 'Pending' && (
                          <button
                            type="button"
                            disabled={overrideLoading}
                            onClick={() => handleAdminOverride(r, 'Rejected')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" /> Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Before vs After Visual Inspection & Admin Override Modal */}
      {inspectReport && (
        <div
          onClick={() => setInspectReport(null)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-mono text-slate-400">
                  #ECO-{100 + inspectReport.id} • {inspectReport.status} • {inspectReport.confidence}% AI Conf.
                </span>
                <h2 className="text-xl font-bold text-slate-900">{inspectReport.category}</h2>
                <p className="text-xs text-slate-500">{inspectReport.location}</p>
              </div>
              <button
                type="button"
                onClick={() => setInspectReport(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Side-by-Side Before & After Photos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Before (Citizen Reported)
                </p>
                {inspectReport.image_data ? (
                  <img
                    src={inspectReport.image_data}
                    alt="Before cleanup"
                    className="w-full h-48 object-cover rounded-xl border border-slate-200"
                  />
                ) : (
                  <div className="w-full h-48 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                    No Before Image
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-400 mb-1.5">
                  After (NGO Cleanup Proof)
                </p>
                {inspectReport.after_image_data ? (
                  <img
                    src={inspectReport.after_image_data}
                    alt="After cleanup"
                    className="w-full h-48 object-cover rounded-xl border border-emerald-200"
                  />
                ) : (
                  <div className="w-full h-48 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400 p-4 text-center">
                    No after-cleanup proof uploaded yet
                  </div>
                )}
              </div>
            </div>

            {/* SLA & Verification Audit Summary */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs text-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-2 font-semibold text-slate-900">
                <span>Created: {inspectReport.created_at}</span>
                <span>
                  Turnaround: {inspectReport.elapsed_text || 'N/A'} ({inspectReport.sla_status || 'Within 24h SLA'})
                </span>
              </div>
              <p>
                <strong>Assigned Squad:</strong> {inspectReport.assigned_ngo}
              </p>
              <p>
                <strong>Verification Audit:</strong>{' '}
                {(inspectReport.verification_note || 'Pending field verification').replace('))', ')')}
              </p>
            </div>

            {/* Admin Override Buttons inside Modal */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {inspectReport.status === 'Resolved' && (
                <button
                  type="button"
                  disabled={overrideLoading}
                  onClick={() => handleAdminOverride(inspectReport, 'Pending')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> Override: Re-open Ticket
                </button>
              )}

              {inspectReport.status === 'Pending' && (
                <button
                  type="button"
                  disabled={overrideLoading}
                  onClick={() => handleAdminOverride(inspectReport, 'Rejected')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold cursor-pointer"
                >
                  <Ban className="w-4 h-4" /> Reject Borderline / Invalid Ticket
                </button>
              )}

              <button
                type="button"
                onClick={() => setInspectReport(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}