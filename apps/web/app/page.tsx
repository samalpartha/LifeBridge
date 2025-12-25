"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "./contexts/LanguageContext";
import { useAuth } from "./contexts/auth-context";
import { trackerApi, CaseEntry } from "@/features/tracker/api/client";

import toast from "react-hot-toast";
import ConfirmationModal from "./components/ConfirmationModal";

function MyCasesList() {
  const [cases, setCases] = useState<CaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadCases();
  }, []);

  async function loadCases() {
    try {
      const data = await trackerApi.getCases();
      // Sort: User cases first, then newest
      const sorted = data.sort((a, b) => {
        const isDemoA = a.title.startsWith("Demo:");
        const isDemoB = b.title.startsWith("Demo:");
        if (isDemoA && !isDemoB) return 1;
        if (!isDemoA && isDemoB) return -1;
        // If both same type, sort by ID descending (newest first)
        return (b.id || 0) - (a.id || 0);
      });
      setCases(sorted.slice(0, 3));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load cases");
    } finally {
      setLoading(false);
    }
  }

  function onDeleteClick(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    setCaseToDelete(id);
    setDeleteModalOpen(true);
  }

  async function handleConfirmDelete() {
    if (caseToDelete === null) return;
    try {
      setDeleteModalOpen(false); // Close immediately for better UX
      setCases(cases.filter(c => c.id !== caseToDelete)); // Optimistic UI
      // Note: trackerApi might not have deleteCase exposed yet or it might be missing from the interface
      // Checking trackerApi definition: it has deleteCase? No, I saw addCase, getCases...
      // Let's assume we can't delete yet or add it later. Wait, previous view showed deleteCase was NOT in trackerApi list for Cases. 
      // It had deleteTask but not deleteCase. 
      // I will disable data deletion for now or skip the API call to avoid crash
      toast.error("Delete not implemented in API yet");
      // await trackerApi.deleteCase(caseToDelete); 
      loadCases(); // Revert
    } catch (e) {
      toast.error("Failed to delete case");
      loadCases(); // Revert on failure
    } finally {
      setCaseToDelete(null);
    }
  }

  const getScenarioIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('family') || lower.includes('130')) return '👨‍👩‍👧‍👦';
    if (lower.includes('work') || lower.includes('job') || lower.includes('140')) return '💼';
    return '✈️';
  };

  const getScenarioColor = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('family') || lower.includes('130')) return 'bg-pink-100 text-pink-600';
    if (lower.includes('work') || lower.includes('job') || lower.includes('140')) return 'bg-blue-100 text-blue-600';
    return 'bg-purple-100 text-purple-600';
  };

  if (loading) return <div className="animate-pulse h-24 bg-gray-100 rounded-xl"></div>;
  if (cases.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Active Cases</h2>
        <button onClick={() => router.push('/tracker/cases')} className="text-sm text-blue-600 hover:underline">View All</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cases.map((c) => (
          <div
            key={c.id}
            onClick={() => router.push(`/tracker/cases/${c.id}`)}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md cursor-pointer transition-all group relative flex flex-col"
          >
            <div className="flex justify-between items-start mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getScenarioColor(c.case_type)}`}>
                {getScenarioIcon(c.case_type)}
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                {c.status}
              </span>
            </div>

            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors truncate">
              {c.title || "Untitled Case"}
            </h3>
            <p className="text-xs text-gray-500 mb-3 flex-grow">
              {c.case_type} • {c.receipt_number || "No Receipt #"}
            </p>

            {/* Next Action Placeholder */}
            <div className="mb-4 bg-blue-50 border border-blue-100 rounded px-3 py-2 text-xs">
              <span className="font-semibold text-blue-800 uppercase tracking-wider block mb-0.5" style={{ fontSize: '0.65rem' }}>Next Step:</span>
              <span className="text-gray-700">Complete checklist</span>
            </div>
            <div className="flex justify-between items-center text-xs pt-3 border-t border-gray-100 mt-auto">
              <span className="text-gray-400">Updated today</span>
              {/* Delete disabled until API supported */}
              {/* <button
                onClick={(e) => onDeleteClick(c.id!, e)}
                className="text-gray-400 hover:text-red-600 p-1"
                title="Delete Case"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button> */}
            </div>
          </div>
        ))}
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Case"
        message="Are you sure you want to delete this case? This action cannot be undone."
        isDangerous={true}
        confirmText="Delete Case"
      />
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [title, setTitle] = useState("My LifeBridge Case");
  const [scenario, setScenario] = useState("family_reunion");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  async function onCreate() {
    setError(null);
    setBusy(true);
    try {
      // Map scenario to case_type
      let caseType = "I-130 (Petition for Alien Relative)";
      if (scenario === 'job_onboarding') caseType = "I-140 (Immigrant Petition for Alien Worker)";
      if (scenario === 'travel_support') caseType = "B-2 (Visitor Visa)";

      const newCase: CaseEntry = {
        title: title,
        case_type: caseType,
        status: "Open"
      };

      const c = await trackerApi.addCase(newCase);
      router.push(`/tracker/cases/${c.id}`);
    } catch (e: any) {
      setError(e.message || "Failed to create case");
    } finally {
      setBusy(false);
    }
  }

  // Demo disabled for now as trackerApi doesn't support specific demo preset endpoint yet
  // We could implement it by manually creating a case and items sequence
  async function onDemo() {
    setBusy(true);
    const toastId = toast.loading("Setting up demo case...");
    try {
      const res = await trackerApi.seedDemoData();
      toast.dismiss(toastId);
      toast.success("Demo case ready!");
      router.push(`/tracker/cases/${res.case_id}`);
    } catch (e) {
      toast.dismiss(toastId);
      toast.error("Failed to setup demo case");
      console.error(e);
      setBusy(false);
    }
  }

  const scenarios = [
    {
      value: "family_reunion",
      label: "Family Reunion",
      icon: "👨‍👩‍👧‍👦",
      description: "Visa support for family visits",
    },
    {
      value: "job_onboarding",
      label: "Work Visa",
      icon: "💼",
      description: "Employment documentation",
    },
    {
      value: "travel_support",
      label: "Travel Support",
      icon: "✈️",
      description: "First-time traveler assistance",
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-12">

      {/* 1. Hero / Primary CTA */}
      {/* 1. Hero / Primary CTA */}
      <section className="text-center py-12 animate-fade-in bg-white rounded-2xl shadow-sm border border-gray-100 p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
          Welcome to your Action Center
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
          Track your progress, manage evidence, and move your immigration journey forward.
        </p>

        <div className="flex flex-col items-center gap-4">
          <a href="#create" className="btn btn-primary text-lg px-8 py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all w-full sm:w-auto">
            👉 Start a New Immigration Case
          </a>
          <button onClick={onDemo} className="text-sm text-gray-400 hover:text-blue-600 font-medium transition-colors hover:underline">
            or try a demo case to explore features
          </button>
        </div>
      </section>

      {/* 2. Active Cases List */}
      <MyCasesList />

      {/* 3. Create Case Section (Hidden mostly, approachable via ID) */}
      <section id="create" className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-gray-200">
        <div className="lg:col-span-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Case</h2>
          <p className="text-gray-500 text-sm mb-6">Select a scenario to get a tailored checklist.</p>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Case Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {scenarios.map((s) => (
                <label
                  key={s.value}
                  className={`flex flex-col items-center p-4 border rounded-xl cursor-pointer transition-all text-center ${scenario === s.value
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <input type="radio" name="scenario" value={s.value} checked={scenario === s.value} onChange={(e) => setScenario(e.target.value)} className="sr-only" />
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="font-semibold text-gray-900 text-sm">{s.label}</div>
                </label>
              ))}
            </div>

            <button
              onClick={onCreate}
              disabled={busy || !title.trim()}
              className="w-full btn btn-primary py-3 flex justify-center items-center"
            >
              {busy ? "Creating Case..." : "Create Case & Start Checklist"}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
        </div>
      </section>

      {/* Legal Footer */}
      <div className="border-t border-gray-100 pt-8 text-center">
        <p className="text-xs text-gray-400 max-w-2xl mx-auto leading-relaxed">
          <span className="font-semibold text-gray-500">Legal Disclaimer:</span> LifeBridge is an AI-powered document assistant, not a law firm.
          Determinations and checklists provided herein are for informational purposes only and do not constitute legal advice.
          Always consult with a qualified immigration attorney for your specific case.
          <br className="mb-2" />
          <span className="block mt-2">Data stored locally on US servers. SOC2 Compliant (Pending).</span>
        </p>
      </div>

    </div>
  );
}
