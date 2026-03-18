import Link from "next/link";
import {
  ShieldAlert,
  FolderOpen,
  Users,
  MapPin,
  Route,
  HeartHandshake,
  FileText,
  Scale,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { LiveRuntimeCard } from "./components/LiveRuntimeCard";

const workstreams = [
  {
    title: "Crisis Corridor",
    description:
      "Emergency navigation for displaced civilians: safe havens, risk-aware routes, reunification beacons, and help matching.",
    href: "/crisis-home",
    icon: ShieldAlert,
    cta: "Open Crisis Experience",
    tone: "from-red-500/10 to-red-500/5 border-red-200",
  },
  {
    title: "Case Workspace",
    description:
      "Immigration timeline, tasks, and report exports so people and legal teams can keep documentation organized.",
    href: "/tracker",
    icon: FolderOpen,
    cta: "Open Case Workspace",
    tone: "from-blue-500/10 to-blue-500/5 border-blue-200",
  },
  {
    title: "Knowledge + Legal",
    description:
      "Knowledge base, attorneys directory, and embassy map to move from uncertainty to an actionable plan.",
    href: "/knowledge",
    icon: Scale,
    cta: "Open Guidance Hub",
    tone: "from-indigo-500/10 to-indigo-500/5 border-indigo-200",
  },
];

const moduleLinks = [
  { name: "Crisis Console", href: "/crisis", icon: Route },
  { name: "Safe Havens Map", href: "/map", icon: MapPin },
  { name: "Reunification", href: "/crisis", icon: Users },
  { name: "Help Requests", href: "/help", icon: HeartHandshake },
  { name: "Document Vault", href: "/vault", icon: FileText },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="glass-panel shimmer-border animate-enter border-indigo-100 bg-gradient-to-br from-white via-indigo-50/30 to-rose-50/30 p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
          <span className="relative inline-flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <Sparkles className="h-4 w-4" />
          LifeBridge Command Center
        </div>
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          One app for crisis response and immigration continuity
        </h1>
        <p className="mt-3 max-w-3xl text-base text-gray-600">
          LifeBridge helps people during emergencies and the long recovery after
          displacement. Use Crisis Corridor for immediate safety, and Case
          Workspace to keep legal and life records in order.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/crisis"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Enter Crisis Console
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/tracker"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Open Case Workspace
          </Link>
        </div>
      </section>

      <LiveRuntimeCard />

      <section className="grid gap-4 md:grid-cols-3">
        {workstreams.map((stream) => {
          const Icon = stream.icon;
          return (
            <Link
              key={stream.title}
              href={stream.href}
              className={`group surface-card animate-enter stagger-1 border bg-gradient-to-b p-6 ${stream.tone}`}
            >
              <div className="mb-4 inline-flex rounded-lg bg-white p-2 text-gray-700 shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {stream.title}
              </h2>
              <p className="mt-2 text-sm text-gray-600">{stream.description}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gray-900">
                {stream.cta}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </section>

      <section className="surface-card animate-enter stagger-2 p-6">
        <h3 className="text-lg font-semibold text-gray-900">Quick access</h3>
        <p className="mt-1 text-sm text-gray-600">
          Jump directly into high-usage modules.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {moduleLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-white"
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
