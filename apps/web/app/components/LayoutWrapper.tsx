"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, Clock3, RefreshCcw, Sparkles } from "lucide-react";
import { Sidebar } from "./Sidebar";
import SamaritanChat from "./SamaritanChat";

type RuntimeStatus = {
  active_mode?: "live" | "mock";
  configured_mode?: "live" | "mock" | "auto";
};

function pageMeta(pathname: string | null) {
  if (!pathname || pathname === "/") {
    return {
      title: "LifeBridge Command Center",
      subtitle:
        "Choose the right workflow: crisis response, case continuity, or guidance.",
    };
  }
  if (pathname.startsWith("/tracker")) {
    return {
      title: "Case Workspace",
      subtitle:
        "Track timeline evidence, tasks, and filing readiness in one place.",
    };
  }
  if (pathname.startsWith("/knowledge")) {
    return {
      title: "Knowledge Base",
      subtitle:
        "Find practical legal and migration guidance with searchable resources.",
    };
  }
  if (pathname.startsWith("/attorneys")) {
    return {
      title: "Attorney Network",
      subtitle: "Discover legal support options, including pro-bono pathways.",
    };
  }
  if (pathname.startsWith("/vault")) {
    return {
      title: "Document Vault",
      subtitle:
        "Store and retrieve critical identity and case documents securely.",
    };
  }
  if (pathname.startsWith("/help")) {
    return {
      title: "Help Center",
      subtitle:
        "Get actionable support guidance and emergency resources quickly.",
    };
  }
  return {
    title: "LifeBridge Workspace",
    subtitle:
      "Complete actions with clear context and source-backed assistance.",
  };
}

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [runtime, setRuntime] = useState<RuntimeStatus | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [clockNow, setClockNow] = useState<number>(Date.now());
  const isAuthPage =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/forgot-password");
  const isCrisisExperiencePage =
    pathname === "/crisis" ||
    pathname?.startsWith("/crisis/") ||
    pathname?.startsWith("/reunion");
  const showSidebar = !isAuthPage && !isCrisisExperiencePage;
  const meta = pageMeta(pathname);

  useEffect(() => {
    if (!showSidebar) return;
    let active = true;

    const fetchRuntime = async () => {
      try {
        const response = await fetch("/api/crisis/runtime");
        const data = await response.json();
        if (!active) return;
        setRuntime(data);
        setLastSyncedAt(Date.now());
      } catch {
        if (!active) return;
        setRuntime(null);
      }
    };

    void fetchRuntime();
    const runtimeInterval = window.setInterval(() => {
      void fetchRuntime();
    }, 45000);
    const clockInterval = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);

    return () => {
      active = false;
      window.clearInterval(runtimeInterval);
      window.clearInterval(clockInterval);
    };
  }, [showSidebar]);

  const syncLabel = (() => {
    if (!lastSyncedAt) return "Waiting for sync";
    const seconds = Math.max(Math.floor((clockNow - lastSyncedAt) / 1000), 0);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s ago`;
  })();

  return (
    <div className="flex min-h-screen bg-slate-100">
      {showSidebar && <Sidebar />}

      <main
        className={`flex-1 min-h-screen flex flex-col relative ${showSidebar ? "ml-64" : "w-full"}`}
      >
        {showSidebar && (
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
              <div className="animate-enter">
                <div className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  UX Pro Workspace
                </div>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">
                  {meta.title}
                </h2>
                <p className="text-sm text-slate-600">{meta.subtitle}</p>
              </div>
              <div className="animate-enter stagger-1 flex flex-wrap items-center justify-end gap-2">
                <div
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${runtime?.active_mode === "live" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}
                >
                  <span
                    className={
                      runtime?.active_mode === "live"
                        ? "live-dot"
                        : "h-2 w-2 rounded-full bg-amber-500"
                    }
                  />
                  {(runtime?.active_mode || "unknown").toUpperCase()}
                </div>
                <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  <RefreshCcw className="h-3 w-3 text-slate-500" />
                  {syncLabel}
                </div>
                <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  <Clock3 className="h-3 w-3 text-slate-500" />
                  <span suppressHydrationWarning>
                    {new Date(clockNow).toLocaleTimeString()}
                  </span>
                </div>
                <Link
                  href="/crisis"
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 hover:-translate-y-0.5"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Emergency Mode
                </Link>
              </div>
            </div>
          </header>
        )}

        <div className="flex-1 overflow-y-auto">
          {showSidebar ? (
            <div className="mx-auto w-full max-w-7xl p-6 lg:p-8 animate-enter-slow">
              {children}
            </div>
          ) : (
            children
          )}
        </div>

        {showSidebar && <SamaritanChat />}
      </main>
    </div>
  );
}
