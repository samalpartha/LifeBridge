"use client";

import {
  Activity,
  BookOpen,
  CheckCircle2,
  Compass,
  Map,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LiveRuntimeCard } from "../components/LiveRuntimeCard";

type GuideItem = {
  icon: typeof Compass;
  title: string;
  description: string;
  color: string;
  bg: string;
  link: string;
};

export default function HelpPage() {
  const [now, setNow] = useState<number>(Date.now());
  const repoUrl =
    process.env.NEXT_PUBLIC_REPO_URL ||
    "https://github.com/samalpartha/LifeBridge";

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const guides: GuideItem[] = [
    {
      icon: Compass,
      title: "Checklist is your route map",
      description:
        "Start with a clear sequence of steps so you always know what to do next.",
      color: "text-blue-500",
      bg: "bg-blue-50",
      link: "/knowledge/checklist",
    },
    {
      icon: ShieldCheck,
      title: "Vault is your secure locker",
      description:
        "Store passports, visas, and supporting evidence safely in one place.",
      color: "text-purple-500",
      bg: "bg-purple-50",
      link: "/vault",
    },
    {
      icon: CheckCircle2,
      title: "Tracker is your execution board",
      description:
        "Track deadlines and tasks so your filing timeline stays under control.",
      color: "text-green-500",
      bg: "bg-green-50",
      link: "/tracker",
    },
    {
      icon: BookOpen,
      title: "Knowledge Base is your guidebook",
      description:
        "Find trusted explanations and legal context before making decisions.",
      color: "text-orange-500",
      bg: "bg-orange-50",
      link: "/knowledge",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="glass-panel shimmer-border animate-enter border-indigo-100 bg-gradient-to-br from-white via-indigo-50/35 to-cyan-50/25 p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
          <span className="relative inline-flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <Activity className="h-3.5 w-3.5" />
          Support Hub Live
        </div>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">
              Welcome to LifeBridge
            </h1>
            <p className="mt-2 max-w-3xl text-lg text-gray-600">
              Immigration processes can be complex. This page turns confusion
              into an action plan in minutes.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              Live workspace clock:{" "}
              <span suppressHydrationWarning>
                {new Date(now).toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/crisis"
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              <Map className="h-4 w-4" />
              Emergency Mode
            </Link>
            <Link
              href="/knowledge/checklist"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Compass className="h-4 w-4" />
              Start with Checklist
            </Link>
          </div>
        </div>
      </section>

      <LiveRuntimeCard />

      <section className="surface-card animate-enter border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-cyan-50/60 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900">
              DigitalOcean Gradient Hackathon Focus
            </h2>
            <p className="mt-2 text-sm text-gray-700">
              LifeBridge is optimized as a hackathon-grade crisis workflow: live
              Gradient runtime, source-backed guidance, and traceable operations
              from alert to reunification.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>
                • Verify live mode at <code>/crisis/runtime/live-check</code> in
                API docs.
              </li>
              <li>
                • Use <code>/crisis</code> for end-to-end haven, route, beacon,
                and help operations.
              </li>
              <li>
                • Review source-backed outputs and traces for judge-ready
                transparency.
              </li>
            </ul>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <Link
              href="/crisis-home"
              className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Open Crisis Corridor
            </Link>
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View GitHub Repository
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {guides.map((guide) => (
          <Link key={guide.title} href={guide.link} className="group h-full">
            <article className="surface-card animate-enter stagger-1 flex h-full items-start gap-4 border border-gray-200 p-6 hover:border-blue-200">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${guide.bg}`}
              >
                <guide.icon size={28} className={guide.color} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 transition group-hover:text-blue-700">
                  {guide.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  {guide.description}
                </p>
              </div>
            </article>
          </Link>
        ))}
      </section>

      <section className="surface-card animate-enter stagger-2 p-6">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          Who is LifeBridge for?
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-blue-50 p-5">
            <span className="mb-3 block text-2xl">🎓</span>
            <h3 className="font-bold text-gray-900">Students</h3>
            <p className="mt-1 text-sm text-gray-600">
              Navigate F-1 visa planning, OPT timing, and education transitions
              with less stress.
            </p>
          </div>
          <div className="rounded-xl bg-purple-50 p-5">
            <span className="mb-3 block text-2xl">💼</span>
            <h3 className="font-bold text-gray-900">Professionals</h3>
            <p className="mt-1 text-sm text-gray-600">
              Manage H-1B, O-1, and green-card milestones while balancing work
              and life commitments.
            </p>
          </div>
          <div className="rounded-xl bg-green-50 p-5">
            <span className="mb-3 block text-2xl">🌍</span>
            <h3 className="font-bold text-gray-900">Global families</h3>
            <p className="mt-1 text-sm text-gray-600">
              Keep cross-border documentation and timelines organized during
              travel and relocation.
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card animate-enter stagger-3 p-6">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">How it works</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Step 1
            </p>
            <p className="mt-1 font-semibold text-gray-900">Choose a goal</p>
            <p className="mt-1 text-sm text-gray-600">
              Pick your path in Checklist and set priorities.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Step 2
            </p>
            <p className="mt-1 font-semibold text-gray-900">Create tasks</p>
            <p className="mt-1 text-sm text-gray-600">
              Convert each step into actionable items in Tracker.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Step 3
            </p>
            <p className="mt-1 font-semibold text-gray-900">Secure documents</p>
            <p className="mt-1 text-sm text-gray-600">
              Upload and organize proofs in Vault with labels.
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Step 4
            </p>
            <p className="mt-1 font-semibold text-gray-900">
              Execute with confidence
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Track progress, exports, and legal readiness.
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card animate-enter stagger-4 border border-slate-200 bg-slate-50 p-8 text-center">
        <div className="mx-auto mb-5 inline-flex items-center justify-center rounded-xl bg-white p-3 shadow-sm">
          <MessageCircle size={24} className="text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Need 1:1 support?</h2>
        <p className="mx-auto mt-2 max-w-xl text-gray-600">
          If your situation is urgent or legally complex, connect with an
          attorney and use the workspace to stay organized.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/attorneys"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-medium text-white transition hover:bg-blue-700"
          >
            Find an Attorney
          </Link>
          <Link
            href="/knowledge"
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Open Knowledge Base
          </Link>
        </div>
      </section>
    </div>
  );
}
