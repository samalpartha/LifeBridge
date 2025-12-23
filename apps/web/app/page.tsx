"use client";

import { useState } from "react";
import { createCase, createDemoPreset } from "./api-client/client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [title, setTitle] = useState("My LifeBridge Case");
  const [scenario, setScenario] = useState("family_reunion");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onCreate() {
    setError(null);
    setBusy(true);
    try {
      const c = await createCase(title, scenario);
      router.push(`/case/${c.id}`);
    } catch (e: any) {
      setError(e.message || "Failed to create case");
    } finally {
      setBusy(false);
    }
  }

  async function onDemo() {
    setError(null);
    setBusy(true);
    try {
      const r = await createDemoPreset();
      router.push(`/case/${r.case_id}`);
    } catch (e: any) {
      setError(e.message || "Failed to create demo preset");
    } finally {
      setBusy(false);
    }
  }

  const scenarios = [
    {
      value: "family_reunion",
      label: "Family Reunion",
      icon: "👨‍👩‍👧‍👦",
      description: "Visa and travel support for family visits",
      color: "from-pink-500 to-rose-500"
    },
    {
      value: "job_onboarding",
      label: "Job Onboarding",
      icon: "💼",
      description: "Cross-border employment documentation",
      color: "from-blue-500 to-cyan-500"
    },
    {
      value: "travel_support",
      label: "Travel Support",
      icon: "✈️",
      description: "First-time traveler assistance",
      color: "from-purple-500 to-indigo-500"
    }
  ];

  const features = [
    {
      icon: "📄",
      title: "Smart Document Processing",
      description: "Upload PDFs and images. Our OCR extracts text automatically."
    },
    {
      icon: "🧠",
      title: "AI-Powered Analysis",
      description: "Get actionable checklists, timelines, and risk assessments."
    },
    {
      icon: "🔗",
      title: "Evidence Linking",
      description: "Every insight links back to source documents for full transparency."
    },
    {
      icon: "⚡",
      title: "Lightning Fast",
      description: "Process documents in seconds. Get results instantly."
    }
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12 animate-fade-in">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
          Transform Documents into <span className="text-gradient">Action Plans</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Upload your cross-border mobility documents. Get AI-powered checklists, timelines, and risk assessments—all with evidence-backed insights.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={onDemo}
            disabled={busy}
            className="btn btn-primary text-lg px-8 py-4"
          >
            {busy ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <>
                ⚡ Try Demo Now
              </>
            )}
          </button>
          <a href="#create" className="btn btn-secondary text-lg px-8 py-4">
            Create New Case
          </a>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
        {features.map((feature, idx) => (
          <div key={idx} className="card hover:scale-105 transition-transform">
            <div className="text-2xl mb-3">{feature.icon}</div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-gray-600 text-sm">{feature.description}</p>
          </div>
        ))}
      </section>

      {/* Create Case Section */}
      <section id="create" className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-scale-in">
        {/* New Case Card */}
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Start New Case</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Case Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors outline-none"
                placeholder="e.g., Family Visit to Canada"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Scenario
              </label>
              <div className="grid grid-cols-1 gap-3">
                {scenarios.map((s) => (
                  <label
                    key={s.value}
                    className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      scenario === s.value
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="scenario"
                      value={s.value}
                      checked={scenario === s.value}
                      onChange={(e) => setScenario(e.target.value)}
                      className="sr-only"
                    />
                    <div className="text-2xl mr-3">{s.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{s.label}</div>
                      <div className="text-sm text-gray-600">{s.description}</div>
                    </div>
                    {scenario === s.value && (
                      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={onCreate}
              disabled={busy || !title.trim()}
              className="w-full btn btn-primary py-4 text-lg"
            >
              {busy ? "Creating..." : "Create Case →"}
            </button>
          </div>
        </div>

        {/* Demo Card */}
        <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Quick Demo</h2>
          </div>

          <div className="space-y-4">
            <p className="text-gray-700">
              Try LifeBridge instantly with a pre-populated case. Perfect for:
            </p>
            
            <ul className="space-y-3">
              {[
                "🎯 Quick demonstration",
                "🧪 Testing features",
                "👀 Seeing evidence linking in action",
                "⚡ Understanding the workflow"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center text-gray-700 text-sm">
                  <span className="mr-2">{item}</span>
                </li>
              ))}
            </ul>

            <div className="bg-purple-100 border border-purple-300 rounded-lg p-4">
              <p className="text-sm text-purple-900 font-medium mb-2">
                ✨ What you'll see:
              </p>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Checklist with action items</li>
                <li>• Timeline with deadlines</li>
                <li>• Risk register with assessments</li>
                <li>• Evidence links to source text</li>
              </ul>
            </div>

            <button
              onClick={onDemo}
              disabled={busy}
              className="w-full btn btn-primary py-4 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {busy ? "Loading Demo..." : "Run Demo Preset →"}
            </button>
          </div>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-slide-down">
          <div className="flex">
            <svg className="w-6 h-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-medium text-red-900">Error</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <section className="card bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">Why Choose LifeBridge?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: "Open Source", value: "100%", description: "MIT Licensed" },
            { label: "Processing Speed", value: "<10s", description: "Average time" },
            { label: "Evidence Links", value: "All", description: "Full transparency" }
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-4xl font-bold mb-2">{stat.value}</div>
              <div className="text-xl font-semibold mb-1">{stat.label}</div>
              <div className="text-blue-100">{stat.description}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
