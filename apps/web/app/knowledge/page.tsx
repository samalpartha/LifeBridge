"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Clock3,
  ExternalLink,
  Gavel,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import {
  knowledgeApi,
  KnowledgeTopic,
} from "../../features/knowledge/api/client";
import { LiveRuntimeCard } from "../components/LiveRuntimeCard";

export default function KnowledgeIndexPage() {
  const [topics, setTopics] = useState<KnowledgeTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    let active = true;

    const loadTopics = async () => {
      try {
        const data = await knowledgeApi.getTopics();
        if (!active) return;
        setTopics(data);
        setLastUpdatedAt(Date.now());
      } catch {
        if (!active) return;
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadTopics();
    const topicsInterval = window.setInterval(() => {
      void loadTopics();
    }, 90000);
    const clockInterval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      active = false;
      window.clearInterval(topicsInterval);
      window.clearInterval(clockInterval);
    };
  }, []);

  const syncLabel = (() => {
    if (!lastUpdatedAt) return "Waiting for first sync";
    const seconds = Math.max(Math.floor((now - lastUpdatedAt) / 1000), 0);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s ago`;
  })();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="glass-panel shimmer-border animate-enter border-indigo-100 bg-gradient-to-br from-white via-indigo-50/40 to-sky-50/20 p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
          <span className="relative inline-flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <Activity className="h-3.5 w-3.5" />
          Knowledge Live
        </div>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
              <BookOpen className="text-blue-600" />
              Immigration Knowledge Base
            </h1>
            <p className="mt-2 max-w-3xl text-gray-600">
              Actionable guides and legal navigation resources for real-world
              case decisions. Built to move from confusion to confident next
              steps.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700">
                <RefreshCcw className="h-3 w-3" />
                Last sync: {syncLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700">
                <Clock3 className="h-3 w-3" />
                <span suppressHydrationWarning>
                  {new Date(now).toLocaleTimeString()}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                {topics.length} live topic{topics.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <LiveRuntimeCard />

      <div className="surface-card animate-enter stagger-1 border border-blue-100 bg-blue-50/80 p-5 text-sm text-blue-900">
        <strong>Important:</strong> This content helps with orientation and
        planning. It does not replace licensed legal advice for your specific
        case.
      </div>

      {loading ? (
        <div className="surface-card animate-enter p-10">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-3 text-center text-sm text-slate-500">
            Loading live knowledge topics...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <Link href="/knowledge/laws">
            <div className="group shimmer-border animate-enter stagger-1 cursor-pointer rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-8 text-white shadow-lg transition hover:shadow-xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <h2 className="mb-2 flex items-center gap-2 text-2xl font-bold">
                    Search US Immigration Laws
                    <ArrowRight
                      size={24}
                      className="opacity-0 -translate-x-2 transition group-hover:translate-x-0 group-hover:opacity-100"
                    />
                  </h2>
                  <p className="text-blue-100">
                    Search official legal contexts, Q&A, and topic-linked
                    references in one place for faster preparation.
                  </p>
                </div>
                <div className="inline-flex rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                  <Gavel size={44} />
                </div>
              </div>
            </div>
          </Link>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/knowledge/${topic.id}`}
                className="group"
              >
                <article className="surface-card animate-enter stagger-2 flex h-full flex-col p-6">
                  <div className="mb-3 inline-flex w-fit rounded-lg bg-indigo-50 p-2 text-indigo-700">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900 transition group-hover:text-blue-700">
                    {topic.title}
                  </h3>
                  <p className="mb-4 flex-grow text-gray-600">
                    {topic.description}
                  </p>
                  <div className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                    Read guide
                    <ArrowRight
                      size={16}
                      className="transition group-hover:translate-x-0.5"
                    />
                  </div>
                </article>
              </Link>
            ))}
          </div>

          <div className="surface-card animate-enter stagger-3 p-6">
            <h3 className="mb-2 text-lg font-semibold text-slate-900">
              Need case-specific help?
            </h3>
            <p className="text-sm text-slate-600">
              Use these guides for preparation, then validate your strategy with
              an attorney for legal certainty.
            </p>
            <div className="mt-4">
              <Link
                href="/attorneys"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
              >
                Find legal support
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
