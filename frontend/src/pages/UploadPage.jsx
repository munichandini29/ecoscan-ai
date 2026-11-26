import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Upload,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Navigation,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { analyzeThreatImage } from '../services/api';

export default function UploadPage({ user }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [category, setCategory] = useState('Auto-Detect');
  const [landmark, setLandmark] = useState('');
  const [lockedCoords, setLockedCoords] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDuplicateError, setIsDuplicateError] = useState(false);

  const handleLockGps = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setErrorMsg('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        setLockedCoords(`${lat}, ${lng}`);
        setGpsLoading(false);
      },
      () => {
        setErrorMsg('GPS permission denied. Allow browser location access to lock verified coordinates.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Auto-lock GPS when Citizen opens scan page
  useEffect(() => {
    handleLockGps();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setResult(null);
    setErrorMsg('');
    setIsDuplicateError(false);

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (!lockedCoords) {
      setErrorMsg('Live GPS coordinates must be locked before submitting a report.');
      return;
    }

    setAnalyzing(true);
    setResult(null);
    setErrorMsg('');
    setIsDuplicateError(false);

    const finalLocation = landmark.trim()
      ? `${landmark.trim()} (${lockedCoords})`
      : `Live GPS (${lockedCoords})`;

    try {
      const data = await analyzeThreatImage(selectedFile, category, finalLocation, user);
      setResult(data);
    } catch (err) {
      const status = err.response?.status;
      const backendDetail = err.response?.data?.detail;
      setIsDuplicateError(status === 409);
      setErrorMsg(
        backendDetail || 'Could not reach FastAPI backend on port 8000. Please ensure it is running.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#2E7D32] mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Citizen Portal
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">AI Environmental Hazard Scan</h1>
        <p className="text-sm text-slate-500">
          Live camera capture with tamper-proof GPS lock, EXIF check, and scene-aware deduplication.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs"
        >
          {/* 1. Live Camera Capture */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-slate-500">
              1. Site Photo (Live Camera Capture)
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              required
              onChange={handleFileChange}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-[#2E7D32] hover:file:bg-emerald-100"
            />
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Selected site"
                className="w-full h-52 object-cover rounded-xl border border-slate-200 mt-2"
              />
            ) : (
              <div className="w-full h-44 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-xs text-slate-400">
                <Camera className="w-6 h-6 mb-1.5 text-slate-400" />
                Capture live site photo to run AI audit
              </div>
            )}
          </div>

          {/* 2. Category Hint */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase text-slate-500">
              2. Hazard Category Hint
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800"
            >
              <option value="Auto-Detect">Auto-Detect (Recommended)</option>
              <option value="Garbage Dump">Garbage Dump</option>
              <option value="Plastic Waste">Plastic Waste</option>
              <option value="Smoke Pollution">Smoke Pollution</option>
              <option value="Water Pollution">Water Pollution</option>
            </select>
          </div>

          {/* 3. Tamper-Proof Read-Only GPS Coordinates */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#2E7D32]" /> 3. Verified Live GPS (Read-Only)
              </label>
              <button
                type="button"
                disabled={gpsLoading}
                onClick={handleLockGps}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E7D32] hover:underline cursor-pointer"
              >
                <Navigation className="w-3 h-3" />
                {gpsLoading ? 'Locking GPS...' : 'Refresh GPS'}
              </button>
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#2E7D32] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                readOnly
                value={lockedCoords ? `${lockedCoords} (Hardware Locked)` : ''}
                placeholder="Acquiring hardware GPS coordinates..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-100 text-xs font-mono text-slate-700 cursor-not-allowed select-none"
              />
            </div>
          </div>

          {/* Optional Landmark Note (Does not alter locked coordinates) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase text-slate-500">
              4. Landmark / Street Note (Optional)
            </label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g., Near North Gate Bus Stop"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={!selectedFile || !lockedCoords || analyzing}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2E7D32] hover:bg-emerald-800 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            {analyzing ? 'Running Local CLIP Vision Audit...' : 'Analyze & Submit Report'}
          </button>
        </form>

        {/* Result / Guardrail Feedback Panel */}
        <div className="space-y-4">
          {errorMsg && (
            <div
              className={`p-5 rounded-2xl border flex items-start gap-3 ${
                isDuplicateError
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {isDuplicateError ? (
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <h3 className="text-sm font-bold">
                  {isDuplicateError ? 'Anti-Spam Guardrail Triggered' : 'Submission Rejected'}
                </h3>
                <p className="text-xs leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {result ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    result.ticket_created
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {result.ticket_created
                    ? `Ticket Created: #ECO-${100 + result.id}`
                    : 'Clean Scene — No Ticket Created'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  {result.confidence}% AI conf.
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">{result.category}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {result.issue_type} • Severity: <strong>{result.severity}</strong>
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 text-xs text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">Assessment Summary</p>
                <p>{result.impact}</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase text-slate-400">Recommended Action</p>
                <ul className="space-y-1 text-xs text-slate-700 list-disc pl-4">
                  {(result.action_steps || []).map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>

              {result.ticket_created ? (
                <Link
                  to="/dashboard"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> View Ticket in Citizen Portal
                </Link>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  Environment verified clean — NGO dispatch queue remains clean.
                </div>
              )}
            </div>
          ) : (
            !errorMsg && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 text-slate-500">
                <Sparkles className="w-7 h-7 text-[#2E7D32] mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">Ready for AI Audit</h3>
                <p className="text-xs">
                  GPS coordinates are hardware-locked. Distinct hazards nearby are allowed, while exact duplicate spots are blocked.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}