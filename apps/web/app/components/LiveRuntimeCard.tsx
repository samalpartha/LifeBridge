"use client";

import { useEffect, useState } from "react";
import { Activity, Clock3, Database, Radar } from "lucide-react";

type RuntimeStatus = {
  active_mode?: "live" | "mock";
  configured_mode?: "live" | "mock" | "auto";
  knowledge_base_id?: string | null;
};

export function LiveRuntimeCard() {
  const [runtime, setRuntime] = useState<RuntimeStatus | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    let isActive = true;

    const fetchRuntime = async () => {
      try {
        const response = await fetch("/api/crisis/runtime");
        const data = await response.json();
        if (!isActive) return;
        setRuntime(data);
        setLastUpdated(Date.now());
      } catch {
        if (!isActive) return;
        setRuntime(null);
      }
    };

    void fetchRuntime();
    const runtimeTimer = window.setInterval(() => {
      void fetchRuntime();
    }, 45000);
    const clockTimer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      isActive = false;
      window.clearInterval(runtimeTimer);
      window.clearInterval(clockTimer);
    };
  }, []);

  const syncLabel = (() => {
    if (!lastUpdated) return "Waiting for sync";
    const seconds = Math.max(Math.floor((now - lastUpdated) / 1000), 0);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s ago`;
  })();

  const live = runtime?.active_mode === "live";

  return (
    <div className="surface-card shimmer-border animate-enter border border-indigo-100 bg-white/90 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
          <Radar className="h-4 w-4 text-indigo-600" />
          Live System Pulse
        </h3>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${live ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}
        >
          <span
            className={live ? "live-dot" : "h-2 w-2 rounded-full bg-amber-500"}
          />
          {runtime?.active_mode?.toUpperCase() || "UNKNOWN"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Configured
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {runtime?.configured_mode?.toUpperCase() || "N/A"}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Last Sync
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-900">
            <Activity className="h-3.5 w-3.5 text-indigo-600" />
            {syncLabel}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Clock
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-900">
            <Clock3 className="h-3.5 w-3.5 text-indigo-600" />
            <span suppressHydrationWarning>
              {new Date(now).toLocaleTimeString()}
            </span>
          </p>
        </div>
      </div>
      {runtime?.knowledge_base_id ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <Database className="h-3.5 w-3.5 text-indigo-600" />
          Knowledge base connected: {runtime.knowledge_base_id.slice(0, 8)}...
        </p>
      ) : null}
    </div>
  );
}
