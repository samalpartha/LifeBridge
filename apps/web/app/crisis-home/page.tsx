"use client";

import Link from "next/link";
import {
  Shield,
  MapPin,
  Navigation,
  Users,
  Heart,
  AlertCircle,
  CheckCircle2,
  Radio,
  Zap,
} from "lucide-react";
import { LiveRuntimeCard } from "../components/LiveRuntimeCard";

export default function CrisisHomePage() {
  const repoUrl =
    process.env.NEXT_PUBLIC_REPO_URL ||
    "https://github.com/samalpartha/LifeBridge";

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 opacity-90"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-24">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Shield className="w-16 h-16" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold mb-6">
              LifeBridge Crisis Corridor
            </h1>
            <p className="text-2xl sm:text-3xl mb-8 text-red-100 max-w-3xl mx-auto">
              Get stranded civilians to verified safe havens with risk-aware
              routes, offline support, and family reunification.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/crisis"
                className="inline-flex items-center gap-2 bg-white text-red-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-50 transition shadow-lg"
              >
                <Radio className="w-6 h-6" />
                Launch Crisis Mode
              </Link>
              <Link
                href="/tracker"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition shadow-lg"
              >
                Open Full App Suite
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 bg-red-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-800 transition"
              >
                Learn How It Works
              </a>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-red-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Powered by DigitalOcean Gradient AI</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                <span>Open Source</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 -mt-8">
        <div className="surface-card animate-enter p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-red-600 mb-2">3</div>
              <div className="text-gray-600">Route Options</div>
              <div className="text-sm text-gray-500 mt-1">
                Fastest, Safest, Accessible
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                Real-time
              </div>
              <div className="text-gray-600">Haven Verification</div>
              <div className="text-sm text-gray-500 mt-1">
                Official, Verified, Community
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">
                Offline
              </div>
              <div className="text-gray-600">Survival Mode</div>
              <div className="text-sm text-gray-500 mt-1">
                Works without connectivity
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">
                Family
              </div>
              <div className="text-gray-600">Reunification</div>
              <div className="text-sm text-gray-500 mt-1">
                Secure beacon codes
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6">
        <LiveRuntimeCard />
      </div>

      {/* Features Section */}
      <div id="features" className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Core Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Designed for humanitarian crises and mass displacement scenarios
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="surface-card animate-enter stagger-1 p-6 border-2 border-transparent hover:border-red-300">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <MapPin className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Safe Haven Finder</h3>
            <p className="text-gray-600 mb-4">
              Discover verified shelters, hospitals, embassies, and aid stations
              nearby. See services, capacity, and last verification time.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ 3-tier verification system</li>
              <li>✓ Real-time capacity status</li>
              <li>✓ Service availability</li>
            </ul>
          </div>

          {/* Feature 2 */}
          <div className="surface-card animate-enter stagger-2 p-6 border-2 border-transparent hover:border-blue-300">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Navigation className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Risk-Aware Routing</h3>
            <p className="text-gray-600 mb-4">
              Get 3 route options with clear risk assessments and safety
              recommendations.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Fastest route option</li>
              <li>✓ Safest route (avoids hazards)</li>
              <li>✓ Accessible route (wheelchair)</li>
            </ul>
          </div>

          {/* Feature 3 */}
          <div className="surface-card animate-enter stagger-3 p-6 border-2 border-transparent hover:border-green-300">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Radio className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Offline Survival Mode</h3>
            <p className="text-gray-600 mb-4">
              Download area packs and use the app without internet connectivity.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Local haven database</li>
              <li>✓ Offline map tiles</li>
              <li>✓ Low-power check-ins</li>
            </ul>
          </div>

          {/* Feature 4 */}
          <div className="surface-card animate-enter stagger-1 p-6 border-2 border-transparent hover:border-purple-300">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Family Reunification</h3>
            <p className="text-gray-600 mb-4">
              Create secure beacons to help separated families find each other.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Unique reunion codes</li>
              <li>✓ Privacy-first design</li>
              <li>✓ "I am safe" status</li>
            </ul>
          </div>

          {/* Feature 5 */}
          <div className="surface-card animate-enter stagger-2 p-6 border-2 border-transparent hover:border-yellow-300">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <Heart className="w-7 h-7 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Help Request Matching</h3>
            <p className="text-gray-600 mb-4">
              Request or offer help. Get matched with nearby assistance
              automatically.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Transport, medical, supplies</li>
              <li>✓ Proximity-based matching</li>
              <li>✓ Abuse controls</li>
            </ul>
          </div>

          {/* Feature 6 */}
          <div className="surface-card animate-enter stagger-3 p-6 border-2 border-transparent hover:border-indigo-300">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">AI-Powered Copilot</h3>
            <p className="text-gray-600 mb-4">
              RescueOps Copilot provides personalized safety guidance using
              Gradient AI.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Context-aware recommendations</li>
              <li>✓ Multi-language support</li>
              <li>✓ Full trace transparency</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Technology Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Powered by DigitalOcean Gradient AI
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built for the DigitalOcean Gradient AI Hackathon, showcasing
              full-stack AI features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-3">
                🤖 RescueOps Copilot Agent
              </h3>
              <p className="text-gray-300 mb-4">
                AI agent with humanitarian mission and strict safety rules.
                Orchestrates haven search, route scoring, and check-ins.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-700 rounded text-sm">
                  Agent Orchestration
                </span>
                <span className="px-3 py-1 bg-gray-700 rounded text-sm">
                  Tool Calling
                </span>
                <span className="px-3 py-1 bg-gray-700 rounded text-sm">
                  Context Awareness
                </span>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-3">
                📚 Crisis Knowledge Base
              </h3>
              <p className="text-gray-300 mb-4">
                Ingested FAQs, haven verification playbook, and safety protocols
                for real-time retrieval and recommendations.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-700 rounded text-sm">
                  Vector Search
                </span>
                <span className="px-3 py-1 bg-gray-700 rounded text-sm">
                  RAG Pipeline
                </span>
                <span className="px-3 py-1 bg-gray-700 rounded text-sm">
                  Source Attribution
                </span>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-3">✅ Evaluation Suite</h3>
              <p className="text-gray-300 mb-4">
                Automated testing with crisis scenarios: children, wheelchair
                access, night travel. Quality scores tracked.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-700 rounded text-sm">
                  Test Scenarios
                </span>
                <span className="px-3 py-1 bg-gray-700 rounded text-sm">
                  Quality Metrics
                </span>
                <span className="px-3 py-1 bg-gray-700 rounded text-sm">
                  Continuous Eval
                </span>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-3">🔍 Trace Logging</h3>
              <p className="text-gray-300 mb-4">
                Full transparency on agent decisions. View sources, tool calls,
                and confidence scores for every recommendation.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-700 rounded text-sm">
                  Audit Trail
                </span>
                <span className="px-3 py-1 bg-gray-700 rounded text-sm">
                  Explainability
                </span>
                <span className="px-3 py-1 bg-gray-700 rounded text-sm">
                  Trust & Safety
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Navigate to Safety?
          </h2>
          <p className="text-xl mb-8 text-red-100 max-w-2xl mx-auto">
            Start using LifeBridge Crisis Corridor to find safe havens, reunite
            with family, and navigate crises with confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/crisis"
              className="inline-flex items-center gap-2 bg-white text-red-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-50 transition shadow-lg"
            >
              <Shield className="w-6 h-6" />
              Launch Crisis Mode
            </Link>
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-red-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-800 transition"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p className="mb-2">
            Built for the <strong>DigitalOcean Gradient AI Hackathon</strong>
          </p>
          <p className="text-sm">
            Competing for: Best Program for the People • Best AI Agent Persona •
            Grand Prize
          </p>
        </div>
      </div>
    </div>
  );
}
