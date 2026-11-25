import React, { useState } from 'react';
import { UploadCloud, Loader2, CheckCircle, AlertTriangle, MapPin, ShieldCheck } from 'lucide-react';
import { analyzeThreatImage } from '../services/api';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [category, setCategory] = useState('Auto-Detect');
  const [location, setLocation] = useState('Chennai, Sector 12');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) return alert('Please select an image first.');
    setLoading(true);
    try {
      const data = await analyzeThreatImage(file, category, location);
      setResult(data);
    } catch (err) {
      console.error('Backend Error:', err);
      alert(
        err.response?.data?.detail ||
        'Backend server (port 8000) connect avvaledu! Terminal lo uvicorn run avutundo ledo check cheyyi.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isClean = result?.category === 'Clean / No Threat' || result?.severity === 'None';

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Upload Environmental Hazard Image</h1>
      <p className="text-sm text-slate-500 mb-8">Powered by Gemini Vision API for instant hazard classification and severity scoring</p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Upload Form */}
        <form onSubmit={handleAnalyze} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5">
          <label className="border-2 border-dashed border-slate-300 hover:border-[#2E7D32] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50">
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-48 rounded-lg object-cover" />
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-[#2E7D32] mb-2" />
                <span className="text-sm font-semibold text-slate-700">Click to select hazard photo</span>
                <span className="text-xs text-slate-400 mt-1">JPG, PNG, or WEBP up to 10MB</span>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Threat Category Hint</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
            >
              <option>Auto-Detect</option>
              <option>Plastic Waste</option>
              <option>Garbage Dump</option>
              <option>Smoke Pollution</option>
              <option>Water Pollution</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Incident Location</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2E7D32] hover:bg-emerald-800 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing with AI...</> : 'Analyze Threat Image'}
          </button>
        </form>

        {/* AI Result Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          {!result ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
              <AlertTriangle className="w-10 h-10 mb-3 text-slate-300" />
              <p className="text-sm font-medium">Upload an image and click Analyze to view the AI diagnostic report.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2E7D32] flex items-center gap-1">
                  {isClean ? <ShieldCheck className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  AI Audit Complete
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isClean
                    ? 'bg-emerald-100 text-emerald-800'
                    : result.severity === 'High'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {isClean ? 'Clean / Safe' : `${result.severity} Severity`}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">{result.issue_type}</h2>
                <p className="text-sm text-slate-500">Confidence Score: <strong className="text-slate-800">{result.confidence}%</strong></p>
              </div>

              <div className={`p-4 rounded-xl text-sm ${isClean ? 'bg-emerald-50/70 text-emerald-900' : 'bg-slate-50 text-slate-700'}`}>
                <strong className="block mb-1">{isClean ? 'Environment Status:' : 'Environmental Impact:'}</strong>
                {result.impact}
              </div>

              <div>
                <strong className="block text-sm text-slate-900 mb-2">Recommended Action:</strong>
                <ul className="space-y-1.5 text-sm text-slate-600 list-disc pl-5">
                  {result.action_steps?.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}