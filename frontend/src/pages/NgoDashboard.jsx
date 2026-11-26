import React, { useEffect, useState, useMemo } from 'react';
import {
  HeartHandshake,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  WifiOff,
  Upload,
  PlayCircle,
  ShieldCheck,
  Camera,
  Navigation,
  X,
} from 'lucide-react';
import { fetchReports, updateReportStatus, verifyCleanupProof } from '../services/api';

export default function NgoDashboard({ user }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Proof-of-Work Verification Modal State
  const [verifyModalReport, setVerifyModalReport] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [ngoCoords, setNgoCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('');

  const squadName = user?.name || 'GreenEarth Response Squad';
  const squadId = user?.userId || 'NGO-201';
  const squadSector = user?.sector || 'All Assigned Zones';

  const loadQueue = async () => {
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
    loadQueue();
  }, []);

  const handleAcceptTicket = async (report) => {
    setActionLoadingId(report.id);
    try {
      await updateReportStatus(report.id, 'In Progress', squadName);
      setReports((prev) =>
        prev.map((item) =>
          item.id === report.id
            ? { ...item, status: 'In Progress', assigned_ngo: squadName }
            : item
        )
      );
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not update ticket status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const captureCurrentGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation not supported by browser');
      return;
    }
    setGpsStatus('Acquiring live GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        };
        setNgoCoords(coords);
        setGpsStatus(`GPS Locked: ${coords.lat}, ${coords.lng}`);
      },
      () => {
        setNgoCoords(null);
        setGpsStatus('GPS permission denied — proceeding with visual scene similarity audit');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const openVerifyModal = (report) => {
    setVerifyModalReport(report);
    setProofFile(null);
    setProofPreview('');
    setVerifyError('');
    setNgoCoords(null);
    captureCurrentGps();
  };

  const handleProofFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setVerifyError('');
    const reader = new FileReader();
    reader.onloadend = () => setProofPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!proofFile || !verifyModalReport) return;

    setVerifying(true);
    setVerifyError('');
    try {
      const updated = await verifyCleanupProof(
        verifyModalReport.id,
        proofFile,
        squadName,
        ngoCoords
      );
      setReports((prev) =>
        prev.map((item) =>
          item.id === verifyModalReport.id
            ? {
                ...item,
                status: updated.status,
                assigned_ngo: updated.assigned_ngo,
                after_image_data: updated.after_image_data,
                verification_note: updated.verification_note,
              }
            : item
        )
      );
      setVerifyModalReport(null);
    } catch (err) {
      setVerifyError(
        err.response?.data?.detail ||
          'Verification rejected: Photo must match the same site background and show clean surroundings.'
      );
    } finally {
      setVerifying(false);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      const matchesUrgency = urgencyFilter === 'All' || r.severity === urgencyFilter;
      const ticketCode = `#eco-${100 + r.id}`;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        ticketCode.includes(q) ||
        (r.category || '').toLowerCase().includes(q) ||
        (r.location || '').toLowerCase().includes(q) ||
        (r.submitted_by || '').toLowerCase().includes(q);
      return matchesStatus && matchesUrgency && matchesQuery;
    });
  }, [reports, searchQuery, statusFilter, urgencyFilter]);

  const activeQueueCount = reports.filter((r) => r.status !== 'Resolved').length;
  const inProgressCount = reports.filter((r) => r.status === 'In Progress').length;
  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;

  const isUnavailable = loading || Boolean(error);
  const controlsDisabled = loading || Boolean(error) || reports.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Dynamic NGO Header + Single Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2E7D32] flex items-center gap-1.5">
            <HeartHandshake className="w-3.5 h-3.5" /> {squadId} • {squadSector}
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{squadName}</h1>
          <p className="text-sm text-slate-500">
            Field triage queue with scene-similarity matching, geo-fencing, and AI cleanliness verification.
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={loadQueue}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Syncing Queue...' : 'Refresh'}
        </button>
      </div>

      {/* Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold uppercase text-amber-600">Active Queue (Unresolved)</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {isUnavailable ? '--' : activeQueueCount}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold uppercase text-blue-600">In Progress</p>
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

      {/* Search, Status & Urgency Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            disabled={controlsDisabled}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              controlsDisabled
                ? 'Search disabled (queue unavailable or empty)'
                : 'Search by ticket ID, location, hazard, or citizen...'
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
          />
        </div>

        <select
          disabled={controlsDisabled}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>

        <select
          disabled={controlsDisabled}
          value={urgencyFilter}
          onChange={(e) => setUrgencyFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          <option value="All">All Urgency Levels</option>
          <option value="High">High Severity</option>
          <option value="Medium">Medium Severity</option>
          <option value="Low">Low Severity</option>
        </select>
      </div>

      {/* Connection Outage Banner */}
      {error && (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3.5">
          <WifiOff className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-red-800">FastAPI Dispatch Server Disconnected</h2>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Loading / Empty / Ticket Grid */}
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
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
          <ShieldCheck className="w-8 h-8 text-[#2E7D32] mx-auto" />
          <h2 className="text-lg font-semibold text-slate-800">Dispatch Queue Clear</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            No verified environmental hazards are currently waiting for NGO cleanup action.
          </p>
        </div>
      ) : !error && filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-1">
          <h2 className="text-base font-semibold text-slate-800">No Matching Tickets</h2>
          <p className="text-xs text-slate-500">
            Adjust your search text, status, or urgency filter to view active tickets.
          </p>
        </div>
      ) : (
        !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReports.map((report) => {
              const isResolved = report.status === 'Resolved';
              const isInProgress = report.status === 'In Progress';

              return (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col"
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
                        No Evidence Image
                      </div>
                    )}

                    <span
                      className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isInProgress
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {report.status}
                    </span>

                    <span
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold ${
                        report.severity === 'High'
                          ? 'bg-red-600 text-white'
                          : report.severity === 'Medium'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-800 text-white'
                      }`}
                    >
                      {report.severity}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>#ECO-{100 + report.id}</span>
                        <span>{report.confidence}% AI conf.</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">{report.category}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2">{report.issue_type}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                        <span className="truncate">{report.location}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>By: {report.submitted_by} ({report.user_id})</span>
                        {report.created_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {report.created_at}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                      {isResolved ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl">
                            <span className="inline-flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" /> AI-Verified Clean
                            </span>
                            <span className="truncate max-w-[130px] text-[11px] text-emerald-800">
                              {report.assigned_ngo}
                            </span>
                          </div>
                          {report.verification_note && (
                            <p className="text-[11px] text-slate-500 px-1">
                              {report.verification_note}
                            </p>
                          )}
                        </div>
                      ) : (
                        <>
                          {report.status === 'Pending' && (
                            <button
                              type="button"
                              disabled={actionLoadingId === report.id}
                              onClick={() => handleAcceptTicket(report)}
                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50 cursor-pointer"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                              {actionLoadingId === report.id
                                ? 'Assigning Squad...'
                                : 'Accept & Mark In Progress'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openVerifyModal(report)}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#2E7D32] hover:bg-emerald-800 text-white cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" /> Capture Live Cleanup Proof
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Strict Proof-of-Work Verification Modal */}
      {verifyModalReport && (
        <div
          onClick={() => !verifying && setVerifyModalReport(null)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-mono text-slate-400">
                  #ECO-{100 + verifyModalReport.id} • Strict Proof-of-Work Audit
                </span>
                <h2 className="text-lg font-bold text-slate-900">Verify Same-Site Cleanup</h2>
                <p className="text-xs text-slate-500">{verifyModalReport.location}</p>
              </div>
              <button
                type="button"
                disabled={verifying}
                onClick={() => setVerifyModalReport(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* GPS Verification Status Bar */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Navigation className="w-3.5 h-3.5 text-[#2E7D32]" />
                {gpsStatus || 'Checking location...'}
              </span>
              <button
                type="button"
                onClick={captureCurrentGps}
                className="text-[11px] font-bold text-[#2E7D32] hover:underline cursor-pointer"
              >
                Refresh GPS
              </button>
            </div>

            {/* Side-by-Side Before Reference vs Live After Capture */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Original Site (Must Match Background)
                </p>
                {verifyModalReport.image_data && (
                  <img
                    src={verifyModalReport.image_data}
                    alt="Original reported hazard"
                    className="w-full h-40 object-cover rounded-xl border border-slate-200"
                  />
                )}
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase text-slate-400 mb-1">
                  After Cleanup (Live Capture)
                </p>
                {proofPreview ? (
                  <img
                    src={proofPreview}
                    alt="After cleanup capture"
                    className="w-full h-40 object-cover rounded-xl border border-emerald-200"
                  />
                ) : (
                  <div className="w-full h-40 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-center p-3 text-xs text-slate-400">
                    <Camera className="w-5 h-5 mb-1 text-slate-400" />
                    Capture same spot after cleanup
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-slate-500">
                  Live Camera Proof (Environment Capture)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  required
                  onChange={handleProofFileChange}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-[#2E7D32] hover:file:bg-emerald-100"
                />
                <p className="text-[11px] text-slate-400">
                  Rejects random/unrelated scenes (&lt;72% CLIP visual match), distant GPS (&gt;100m), or uncleaned waste.
                </p>
              </div>

              {verifyError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{verifyError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={verifying}
                  onClick={() => setVerifyModalReport(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!proofFile || verifying}
                  className="px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-emerald-800 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {verifying ? 'Auditing Scene & Cleanliness...' : 'Verify & Resolve Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}