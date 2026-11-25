import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Camera, MapPin, BarChart3, ArrowRight, Leaf } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
          <Leaf className="w-4 h-4 text-[#2E7D32]" />
          AI-Powered Civic Environmental Intelligence
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6">
          Detect Environmental Threats with <span className="text-[#2E7D32]">EcoScan AI</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
          Snap a photo of plastic waste, illegal garbage dumps, smoke emissions, or water pollution. 
          Our Gemini Vision pipeline diagnoses severity and dispatches verified NGO response teams in seconds.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate('/upload')}
            className="bg-[#2E7D32] hover:bg-emerald-800 text-white px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Camera className="w-5 h-5" /> Scan Threat Now
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-[#1976D2] hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            Explore Citizen Portal <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#2E7D32] flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-2">Multi-Threat Vision AI</h3>
          <p className="text-sm text-slate-600">
            Classifies Plastic Waste, Solid Garbage, Smoke Pollution, and Water Contamination with confidence & severity scoring.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#1976D2] flex items-center justify-center mb-4">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-2">NGO Geospatial Triage</h3>
          <p className="text-sm text-slate-600">
            Routes high-severity incidents directly to regional environmental NGOs and volunteer cleanup squads.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-2">Audit-Ready Reports</h3>
          <p className="text-sm text-slate-600">
            Generates structured impact assessments and step-by-step mitigation actions for municipal compliance.
          </p>
        </div>
      </section>
    </div>
  );
}