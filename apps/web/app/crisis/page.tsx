"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  Activity,
  AlertCircle, 
  Clock3,
  MapPin, 
  Navigation, 
  Users, 
  Heart, 
  Shield,
  Bot,
  Radio,
  CheckCircle2,
  LifeBuoy,
  LocateFixed,
  RefreshCcw,
  Signal,
  BadgeInfo
} from "lucide-react";
import toast from "react-hot-toast";
import { BrandLogo } from "../components/BrandLogo";

// Dynamic import for Leaflet (client-side only)
const MapView = dynamic(() => import("../components/MapView"), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
    <p className="text-gray-500">Loading map...</p>
  </div>
});

interface SafeHaven {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  address: string;
  services: string[];
  capacity_status: string;
  verification_tier: string;
  distance_km?: number;
}

interface RouteOption {
  type: string;
  distance_km: number;
  estimated_minutes: number;
  risk_score: number;
  risk_reasons: string[];
  instructions: string[];
}

interface RuntimeInfo {
  configured_mode: "mock" | "live" | "auto";
  active_mode: "mock" | "live";
}

type ActivityTone = "info" | "success" | "warning";

interface ActivityEvent {
  id: string;
  timestamp: number;
  title: string;
  detail?: string;
  tone: ActivityTone;
}

export default function CrisisPage() {
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [havens, setHavens] = useState<SafeHaven[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedHaven, setSelectedHaven] = useState<SafeHaven | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"havens" | "routes" | "reunite" | "help" | "copilot">("havens");
  const [runtime, setRuntime] = useState<RuntimeInfo | null>(null);

  const [beaconFamilyHint, setBeaconFamilyHint] = useState("");
  const [beaconMessage, setBeaconMessage] = useState("");
  const [beaconCode, setBeaconCode] = useState("");
  const [beaconResult, setBeaconResult] = useState<any>(null);
  const [beaconLookupCode, setBeaconLookupCode] = useState("");
  const [beaconLookupResult, setBeaconLookupResult] = useState<any>(null);

  const [helpCategory, setHelpCategory] = useState("transport");
  const [helpDetails, setHelpDetails] = useState("");
  const [helpUrgency, setHelpUrgency] = useState("medium");
  const [offerCategory, setOfferCategory] = useState("transport");
  const [offerDetails, setOfferDetails] = useState("");
  const [offerRadius, setOfferRadius] = useState(10);
  const [nearbyRequests, setNearbyRequests] = useState<any[]>([]);
  const [nearbyOffers, setNearbyOffers] = useState<any[]>([]);

  const [copilotPrompt, setCopilotPrompt] = useState("");
  const [copilotResponse, setCopilotResponse] = useState("");
  const [copilotTraceId, setCopilotTraceId] = useState("");
  const [copilotToolCalls, setCopilotToolCalls] = useState<any[]>([]);
  const [copilotMode, setCopilotMode] = useState<string>("");
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [clockNow, setClockNow] = useState<number>(Date.now());

  const pushActivity = (title: string, detail?: string, tone: ActivityTone = "info") => {
    const event: ActivityEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      title,
      detail,
      tone,
    };
    setActivityFeed((previous) => [event, ...previous].slice(0, 12));
  };

  const markSynced = (title: string, detail?: string, tone: ActivityTone = "info") => {
    setLastSyncAt(Date.now());
    pushActivity(title, detail, tone);
  };

  useEffect(() => {
    pushActivity("Console initialized", "Preparing runtime and geolocation...", "info");
    fetchRuntime();
    const runtimeInterval = window.setInterval(() => {
      void fetchRuntime();
    }, 45000);
    const clockInterval = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);
    // Get user's location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          setUserLocation(loc);
          markSynced("Location locked", `${loc.lat.toFixed(3)}, ${loc.lon.toFixed(3)}`, "success");
          searchNearbyHavens(loc.lat, loc.lon);
          loadHelpNearby(loc.lat, loc.lon);
        },
        () => {
          // Use default location (e.g., crisis region)
          const defaultLoc = { lat: 35.0, lon: 36.0 };
          setUserLocation(defaultLoc);
          pushActivity("Location fallback active", "Using default coordinates for continuity", "warning");
          searchNearbyHavens(defaultLoc.lat, defaultLoc.lon);
          loadHelpNearby(defaultLoc.lat, defaultLoc.lon);
        }
      );
    }
    return () => {
      window.clearInterval(runtimeInterval);
      window.clearInterval(clockInterval);
    };
  }, []);

  const fetchRuntime = async () => {
    try {
      const response = await fetch("/api/crisis/runtime");
      const data = await response.json();
      setRuntime(data);
      markSynced(
        "Runtime heartbeat",
        `Mode: ${(data?.active_mode || "unknown").toUpperCase()}`,
        data?.active_mode === "live" ? "success" : "warning"
      );
    } catch {
      pushActivity("Runtime check failed", "Could not refresh live runtime status", "warning");
    }
  };

  const searchNearbyHavens = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/crisis/havens/search?lat=${lat}&lon=${lon}&radius_km=20`
      );
      const data = await response.json();
      setHavens(data);
      markSynced(
        "Safe havens refreshed",
        `${Array.isArray(data) ? data.length : 0} results in 20 km`,
        Array.isArray(data) && data.length > 0 ? "success" : "warning"
      );
      if (Array.isArray(data) && data.length === 0) {
        toast("No havens found nearby. Seed demo data to populate map.");
      }
    } catch {
      toast.error("Failed to load nearby havens");
      pushActivity("Haven refresh failed", "Could not fetch nearby havens", "warning");
    } finally {
      setLoading(false);
    }
  };

  const generateRoutes = async (haven: SafeHaven) => {
    if (!userLocation) return;
    
    setLoading(true);
    setSelectedHaven(haven);
    
    try {
      const response = await fetch("/api/crisis/routes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_lat: userLocation.lat,
          start_lon: userLocation.lon,
          end_lat: haven.lat,
          end_lon: haven.lon,
          mode: "walking",
          time_of_day: "day",
          user_constraints: []
        })
      });
      
      const data = await response.json();
      setRoutes(data.routes);
      setActiveTab("routes");
      markSynced(
        "Routes generated",
        `${Array.isArray(data.routes) ? data.routes.length : 0} options to ${haven.name}`,
        "success"
      );
      await runCopilot(
        `Recommend safest navigation to ${haven.name}. Include why each route is safer or riskier.`,
        {
          start_lat: userLocation.lat,
          start_lon: userLocation.lon,
          end_lat: haven.lat,
          end_lon: haven.lon,
          mode: "walking",
          user_constraints: [],
        }
      );
    } catch {
      toast.error("Failed to generate route options");
      pushActivity("Route generation failed", "Navigation options are unavailable", "warning");
    } finally {
      setLoading(false);
    }
  };

  const createCheckin = async () => {
    if (!userLocation) return;
    
    try {
      const response = await fetch("/api/crisis/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_code: `user_${Math.random().toString(36).substring(7)}`,
          lat: userLocation.lat,
          lon: userLocation.lon,
          status: "safe",
          battery_level: 80,
          message: "I am safe"
        })
      });
      if (!response.ok) {
        throw new Error("Check-in failed");
      }
      toast.success("Check-in successful. Status logged.");
      markSynced("Safety check-in sent", "Status marked safe and broadcast-ready", "success");
    } catch {
      toast.error("Check-in failed");
      pushActivity("Check-in failed", "Could not submit safety status", "warning");
    }
  };

  const createBeacon = async () => {
    if (!userLocation || !beaconFamilyHint.trim()) {
      toast.error("Provide family hint and location");
      return;
    }
    const generatedCode = beaconCode || `BEACON-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    try {
      const response = await fetch("/api/crisis/beacons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beacon_code: generatedCode,
          family_name_hint: beaconFamilyHint.slice(0, 2).toUpperCase(),
          lat: userLocation.lat,
          lon: userLocation.lon,
          status: "safe",
          message: beaconMessage,
        }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.detail || "Failed to create beacon");
      }
      const data = await response.json();
      setBeaconResult(data);
      setBeaconCode(generatedCode);
      toast.success("Beacon created");
      markSynced("Family beacon created", generatedCode, "success");
    } catch (error: any) {
      toast.error(error.message || "Beacon creation failed");
      pushActivity("Beacon creation failed", error?.message || "Try a different code", "warning");
    }
  };

  const lookupBeacon = async () => {
    if (!beaconLookupCode.trim()) return;
    try {
      const response = await fetch(`/api/crisis/beacons/${encodeURIComponent(beaconLookupCode.trim())}`);
      if (!response.ok) {
        throw new Error("Beacon not found");
      }
      const data = await response.json();
      setBeaconLookupResult(data);
      toast.success("Beacon found");
      markSynced("Beacon located", beaconLookupCode.trim().toUpperCase(), "success");
    } catch (error: any) {
      setBeaconLookupResult(null);
      toast.error(error.message || "Beacon lookup failed");
      pushActivity("Beacon lookup failed", error?.message || "Code not found", "warning");
    }
  };

  const loadHelpNearby = async (lat: number, lon: number) => {
    try {
      const [requestResponse, offerResponse] = await Promise.all([
        fetch(`/api/crisis/help/requests/nearby?lat=${lat}&lon=${lon}&radius_km=20`),
        fetch(`/api/crisis/help/offers/nearby?lat=${lat}&lon=${lon}&radius_km=20`),
      ]);
      if (requestResponse.ok) {
        const requestData = await requestResponse.json();
        setNearbyRequests(requestData);
        pushActivity(
          "Nearby requests refreshed",
          `${Array.isArray(requestData) ? requestData.length : 0} request(s)`,
          "info"
        );
      }
      if (offerResponse.ok) {
        const offerData = await offerResponse.json();
        setNearbyOffers(offerData);
        pushActivity(
          "Nearby offers refreshed",
          `${Array.isArray(offerData) ? offerData.length : 0} offer(s)`,
          "info"
        );
      }
    } catch {
      pushActivity("Help feed refresh failed", "Could not load nearby requests/offers", "warning");
    }
  };

  const submitHelpRequest = async () => {
    if (!userLocation || !helpDetails.trim()) {
      toast.error("Provide request details");
      return;
    }
    try {
      const response = await fetch("/api/crisis/help/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requester_code: `req_${Math.random().toString(36).slice(2, 8)}`,
          category: helpCategory,
          details: helpDetails,
          lat: userLocation.lat,
          lon: userLocation.lon,
          urgency: helpUrgency,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to submit help request");
      }
      setHelpDetails("");
      toast.success("Help request submitted");
      markSynced("Help request submitted", `${helpCategory} • ${helpUrgency}`, "success");
      await loadHelpNearby(userLocation.lat, userLocation.lon);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit help request");
      pushActivity("Help request failed", error?.message || "Please retry", "warning");
    }
  };

  const submitHelpOffer = async () => {
    if (!userLocation || !offerDetails.trim()) {
      toast.error("Provide offer details");
      return;
    }
    try {
      const response = await fetch("/api/crisis/help/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerer_code: `off_${Math.random().toString(36).slice(2, 8)}`,
          category: offerCategory,
          details: offerDetails,
          seats: offerCategory === "transport" ? 2 : null,
          radius_km: offerRadius,
          lat: userLocation.lat,
          lon: userLocation.lon,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to submit help offer");
      }
      setOfferDetails("");
      toast.success("Help offer submitted");
      markSynced("Help offer submitted", `${offerCategory} • ${offerRadius} km radius`, "success");
      await loadHelpNearby(userLocation.lat, userLocation.lon);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit help offer");
      pushActivity("Help offer failed", error?.message || "Please retry", "warning");
    }
  };

  const runCopilot = async (prompt: string, context: Record<string, any> = {}) => {
    if (!prompt.trim()) return;
    try {
      const response = await fetch("/api/crisis/agent/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: prompt,
          context: {
            ...(userLocation ? { lat: userLocation.lat, lon: userLocation.lon } : {}),
            append_operational_plan: true,
            include_local_agents: true,
            ...context,
          },
        }),
      });
      if (!response.ok) {
        throw new Error("Copilot request failed");
      }
      const data = await response.json();
      setCopilotResponse(data.response || "");
      setCopilotTraceId(data.trace_id || "");
      setCopilotToolCalls(data.tool_calls || []);
      setCopilotMode(data.mode || "");
      markSynced(
        "Copilot response received",
        data.trace_id ? `Trace ${String(data.trace_id).slice(0, 8)}` : "Trace unavailable",
        "success"
      );
      return data;
    } catch {
      toast.error("Copilot is unavailable");
      pushActivity("Copilot unavailable", "Could not complete the request", "warning");
      return null;
    }
  };

  const getVerificationBadge = (tier: string) => {
    const badges = {
      official: { color: "bg-green-100 text-green-800", label: "✓ Official" },
      verified: { color: "bg-blue-100 text-blue-800", label: "✓ Verified" },
      community: { color: "bg-gray-100 text-gray-800", label: "Community" }
    };
    const badge = badges[tier as keyof typeof badges] || badges.community;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const getCapacityBadge = (status: string) => {
    const badges = {
      available: { color: "bg-green-100 text-green-800", label: "Available" },
      limited: { color: "bg-yellow-100 text-yellow-800", label: "Limited" },
      full: { color: "bg-red-100 text-red-800", label: "Full" },
      unknown: { color: "bg-gray-100 text-gray-800", label: "Unknown" }
    };
    const badge = badges[status as keyof typeof badges] || badges.unknown;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return "text-green-600";
    if (score < 60) return "text-yellow-600";
    return "text-red-600";
  };

  const syncAgeLabel = (() => {
    if (!lastSyncAt) return "Waiting for first sync";
    const elapsedSeconds = Math.max(Math.floor((clockNow - lastSyncAt) / 1000), 0);
    if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    return `${minutes}m ${seconds}s ago`;
  })();

  const toneStyles: Record<ActivityTone, string> = {
    info: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-slate-50 to-indigo-50">
      {/* Crisis Header */}
      <div className="bg-gradient-to-r from-red-800 via-red-700 to-rose-700 text-white py-4 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <BrandLogo variant="light" iconSize={44} />
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold">
              <span className={runtime?.active_mode === "live" ? "live-dot bg-emerald-300" : "h-2.5 w-2.5 rounded-full bg-amber-300"} />
              {runtime?.active_mode === "live" ? "Live Runtime" : "Fallback Runtime"}
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold">
              <Clock3 className="h-3.5 w-3.5" />
              <span suppressHydrationWarning>{new Date(clockNow).toLocaleTimeString()}</span>
            </div>
            <button 
              onClick={createCheckin}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-medium text-red-700 shadow-sm transition hover:bg-red-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              I'm Safe
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-5 animate-enter">
        {runtime?.active_mode === "mock" && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-center gap-2">
            <BadgeInfo className="w-4 h-4" />
            Running in deterministic local fallback mode. Add Gradient credentials to enable live runtime.
          </div>
        )}

        <div className="surface-card shimmer-border border border-red-100 bg-white/90 p-4 backdrop-blur animate-enter stagger-1">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Runtime</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Signal className="h-4 w-4 text-emerald-600" />
                {(runtime?.active_mode || "unknown").toUpperCase()}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Last Sync</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <RefreshCcw className="h-4 w-4 text-blue-600" />
                {syncAgeLabel}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Position</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <LocateFixed className="h-4 w-4 text-violet-600" />
                {userLocation ? `${userLocation.lat.toFixed(2)}, ${userLocation.lon.toFixed(2)}` : "Resolving..."}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Live Counters</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {havens.length} havens • {routes.length} routes • {nearbyRequests.length + nearbyOffers.length} matches
              </p>
            </div>
          </div>
        </div>

        {/* Map View */}
        <div className="surface-card p-4 animate-enter stagger-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              Live Crisis Map
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Radio className="w-4 h-4" />
              {havens.length} havens nearby
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr),minmax(320px,1fr)]">
            <div>
              {userLocation && (
                <MapView 
                  userLocation={userLocation}
                  havens={havens}
                  selectedHaven={selectedHaven}
                  onHavenClick={(haven) => {
                    setSelectedHaven(haven);
                    void generateRoutes(haven);
                  }}
                />
              )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Activity className="h-4 w-4 text-rose-600" />
                  Live Activity Feed
                </h3>
                <span className="text-[11px] text-slate-500">{syncAgeLabel}</span>
              </div>
              {activityFeed.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500">
                  Waiting for first event...
                </p>
              ) : (
                <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
                  {activityFeed.map((item) => (
                    <li key={item.id} className="rounded-md border border-slate-200 bg-white p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-slate-800">{item.title}</p>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${toneStyles[item.tone]}`}>
                          {item.tone}
                        </span>
                      </div>
                      {item.detail ? <p className="mt-1 text-[11px] text-slate-600">{item.detail}</p> : null}
                      <p className="mt-1 text-[10px] text-slate-400">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="surface-card overflow-hidden animate-enter stagger-3">
          <div className="flex border-b bg-slate-50">
            <button
              onClick={() => setActiveTab("havens")}
              className={`flex-1 px-4 py-3 font-medium flex items-center justify-center gap-2 transition ${
                activeTab === "havens" ? "bg-white text-red-700 border-b-2 border-red-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Shield className="w-4 h-4" />
              Safe Havens
            </button>
            <button
              onClick={() => setActiveTab("routes")}
              className={`flex-1 px-4 py-3 font-medium flex items-center justify-center gap-2 transition ${
                activeTab === "routes" ? "bg-white text-red-700 border-b-2 border-red-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Navigation className="w-4 h-4" />
              Routes
            </button>
            <button
              onClick={() => setActiveTab("reunite")}
              className={`flex-1 px-4 py-3 font-medium flex items-center justify-center gap-2 transition ${
                activeTab === "reunite" ? "bg-white text-red-700 border-b-2 border-red-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-4 h-4" />
              Reunite
            </button>
            <button
              onClick={() => setActiveTab("help")}
              className={`flex-1 px-4 py-3 font-medium flex items-center justify-center gap-2 transition ${
                activeTab === "help" ? "bg-white text-red-700 border-b-2 border-red-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LifeBuoy className="w-4 h-4" />
              Help
            </button>
            <button
              onClick={() => setActiveTab("copilot")}
              className={`flex-1 px-4 py-3 font-medium flex items-center justify-center gap-2 transition ${
                activeTab === "copilot" ? "bg-white text-red-700 border-b-2 border-red-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Bot className="w-4 h-4" />
              Copilot
            </button>
          </div>

          <div className="p-4">
            {/* Safe Havens Tab */}
            {activeTab === "havens" && (
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading havens...</div>
                ) : havens.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No havens found nearby. Try expanding your search radius.
                  </div>
                ) : (
                  havens.map((haven) => (
                    <div 
                      key={haven.id}
                      className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                      onClick={() => generateRoutes(haven)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg">{haven.name}</h3>
                          <p className="text-sm text-gray-600">{haven.type.replace("_", " ")}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getVerificationBadge(haven.verification_tier)}
                          {getCapacityBadge(haven.capacity_status)}
                        </div>
                      </div>
                      
                      {haven.services && haven.services.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {haven.services.map((service, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-xs rounded">
                              {service}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{haven.address || "Address not available"}</span>
                        <button className="text-red-600 font-medium hover:underline">
                          Get Directions →
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Routes Tab */}
            {activeTab === "routes" && (
              <div className="space-y-3">
                {routes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Select a safe haven to view route options
                  </div>
                ) : (
                  <>
                    {selectedHaven && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-800">
                          Routes to <strong>{selectedHaven.name}</strong>
                        </p>
                      </div>
                    )}
                    
                    {routes.map((route, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-lg capitalize">{route.type} Route</h3>
                            <p className="text-sm text-gray-600">
                              {route.distance_km.toFixed(1)} km • {route.estimated_minutes} min
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getRiskColor(route.risk_score)}`}>
                              {route.risk_score.toFixed(0)}
                            </div>
                            <div className="text-xs text-gray-500">Risk Score</div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded p-3 mb-3">
                          <p className="text-sm font-medium mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            Risk Factors:
                          </p>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {route.risk_reasons.map((reason, idx) => (
                              <li key={idx}>• {reason}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Instructions:</p>
                          {route.instructions.map((instruction, idx) => (
                            <p key={idx} className="text-sm text-gray-700">
                              {idx + 1}. {instruction}
                            </p>
                          ))}
                        </div>
                        
                        <button className="w-full mt-3 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition">
                          Start Navigation
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Reunite Tab */}
            {activeTab === "reunite" && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-bold mb-1">Family Reunification</h3>
                      <p className="text-sm text-gray-700">
                        Create a beacon to share your location with family members.
                        They can find you using a secure code.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-bold mb-3">Create Your Beacon</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Family name (first 2 letters only)"
                      className="w-full px-3 py-2 border rounded-lg"
                      maxLength={2}
                      value={beaconFamilyHint}
                      onChange={(e) => setBeaconFamilyHint(e.target.value)}
                    />
                    <textarea
                      placeholder="Optional message for your family..."
                      className="w-full px-3 py-2 border rounded-lg h-24 resize-none"
                      value={beaconMessage}
                      onChange={(e) => setBeaconMessage(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Optional custom beacon code"
                      className="w-full px-3 py-2 border rounded-lg"
                      value={beaconCode}
                      onChange={(e) => setBeaconCode(e.target.value)}
                    />
                    <button
                      onClick={createBeacon}
                      className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition"
                    >
                      Create Beacon & Get Code
                    </button>
                    {beaconResult && (
                      <div className="rounded bg-green-50 border border-green-200 p-3 text-sm text-green-900">
                        Beacon created: <strong>{beaconResult.beacon_code}</strong>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-bold mb-3">Find Family Member</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Enter reunion code..."
                      className="w-full px-3 py-2 border rounded-lg"
                      value={beaconLookupCode}
                      onChange={(e) => setBeaconLookupCode(e.target.value)}
                    />
                    <button
                      onClick={lookupBeacon}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      Search for Beacon
                    </button>
                    {beaconLookupResult && (
                      <div className="rounded bg-blue-50 border border-blue-200 p-3 text-sm text-blue-900 space-y-1">
                        <p><strong>Status:</strong> {beaconLookupResult.status}</p>
                        <p><strong>Location:</strong> {beaconLookupResult.lat}, {beaconLookupResult.lon}</p>
                        <p><strong>Message:</strong> {beaconLookupResult.message || "No message"}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "help" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-bold">Request Help</h3>
                  <select value={helpCategory} onChange={(e) => setHelpCategory(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                    <option value="transport">Transport</option>
                    <option value="medical">Medical</option>
                    <option value="food">Food</option>
                    <option value="water">Water</option>
                    <option value="shelter">Shelter</option>
                    <option value="charging">Charging</option>
                  </select>
                  <select value={helpUrgency} onChange={(e) => setHelpUrgency(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <textarea value={helpDetails} onChange={(e) => setHelpDetails(e.target.value)} className="w-full px-3 py-2 border rounded-lg h-24 resize-none" placeholder="Describe your need..." />
                  <button onClick={submitHelpRequest} className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition">Submit Request</button>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-bold">Offer Help</h3>
                  <select value={offerCategory} onChange={(e) => setOfferCategory(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                    <option value="transport">Transport</option>
                    <option value="medical">Medical</option>
                    <option value="food">Food</option>
                    <option value="water">Water</option>
                    <option value="shelter">Shelter</option>
                    <option value="charging">Charging</option>
                    <option value="translation">Translation</option>
                    <option value="escort">Escort</option>
                  </select>
                  <input type="number" value={offerRadius} onChange={(e) => setOfferRadius(Number(e.target.value) || 1)} className="w-full px-3 py-2 border rounded-lg" min={1} max={100} />
                  <textarea value={offerDetails} onChange={(e) => setOfferDetails(e.target.value)} className="w-full px-3 py-2 border rounded-lg h-24 resize-none" placeholder="What can you offer?" />
                  <button onClick={submitHelpOffer} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition">Submit Offer</button>
                </div>

                <div className="md:col-span-2 border rounded-lg p-4">
                  <h3 className="font-bold mb-2">Nearby Requests and Offers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-semibold mb-1">Requests</p>
                      {nearbyRequests.length === 0 ? <p className="text-gray-500">No nearby requests</p> : (
                        <ul className="space-y-1">
                          {nearbyRequests.map((item) => (
                            <li key={item.id} className="bg-gray-50 rounded px-2 py-1">
                              {item.category} ({item.urgency}) - {item.distance_km} km
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Offers</p>
                      {nearbyOffers.length === 0 ? <p className="text-gray-500">No nearby offers</p> : (
                        <ul className="space-y-1">
                          {nearbyOffers.map((item) => (
                            <li key={item.id} className="bg-gray-50 rounded px-2 py-1">
                              {item.category} - {item.distance_km} km
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "copilot" && (
              <div className="space-y-3">
                <h3 className="font-bold">RescueOps Copilot</h3>
                <textarea
                  value={copilotPrompt}
                  onChange={(e) => setCopilotPrompt(e.target.value)}
                  placeholder="Ask for route rationale, haven recommendations, or reunification strategy..."
                  className="w-full px-3 py-2 border rounded-lg h-28 resize-none"
                />
                <button
                  onClick={async () => {
                    const data = await runCopilot(copilotPrompt);
                    if (data) {
                      toast.success("Copilot response ready");
                    }
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition"
                >
                  Run Copilot
                </button>

                {copilotResponse && (
                  <div className="space-y-3">
                    <div className="rounded border p-3 bg-gray-50 text-sm whitespace-pre-wrap">{copilotResponse}</div>
                    <div className="text-xs text-gray-600">
                      Mode: <strong>{copilotMode || runtime?.active_mode || "unknown"}</strong>
                      {copilotTraceId ? <> | Trace: <code>{copilotTraceId}</code></> : null}
                    </div>
                    {copilotToolCalls.length > 0 && (
                      <div className="rounded border p-3">
                        <p className="font-semibold text-sm mb-2">Tool Calls</p>
                        <ul className="space-y-1 text-xs text-gray-700">
                          {copilotToolCalls.map((call, idx) => (
                            <li key={idx} className="bg-gray-50 rounded px-2 py-1">
                              {call.agent} → {call.tool}: {call.output_summary}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-900 mb-1">Emergency</h3>
              <p className="text-sm text-red-800">
                For immediate life-threatening situations, call local emergency services first.
                Then update your status in the app to alert your network.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
