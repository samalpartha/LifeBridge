"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Heart,
  Search,
  Send,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

type RetrievalSource = {
  title: string;
  confidence?: number;
  type?: string;
  provider?: string;
  observed_at?: string;
};

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
  sources?: RetrievalSource[];
  traceId?: string;
  retrievalProvider?: string;
  model?: string;
};

type RuntimeState = "checking" | "live" | "offline";

type LocationContext = {
  lat: number;
  lon: number;
  accuracyMeters?: number;
};

type HavenSnapshot = {
  name: string;
  type: string;
  distance_km?: number;
  verification_tier?: string;
  capacity_status?: string;
};

type ChatResponse = {
  response?: string;
  sources?: RetrievalSource[];
  trace_id?: string;
  mode?: string;
  retrieval_provider?: string;
  model?: string;
  detail?: string;
};

function isRealtimeSource(source: RetrievalSource): boolean {
  const provider = source.provider?.toLowerCase() || "";
  const sourceType = source.type?.toLowerCase() || "";
  return (
    provider.startsWith("openstreetmap") ||
    provider === "lifebridge_operational_db" ||
    sourceType.startsWith("openstreetmap_") ||
    sourceType === "lifebridge_havens_snapshot"
  );
}

function providerLabelFor(source: RetrievalSource): string {
  if (
    source.provider === "digitalocean_gradient" ||
    source.type?.startsWith("gradient_")
  ) {
    return "DigitalOcean Gradient";
  }
  if (
    source.provider?.startsWith("openstreetmap") ||
    source.type?.startsWith("openstreetmap_")
  ) {
    return "OpenStreetMap";
  }
  if (
    source.provider === "lifebridge_operational_db" ||
    source.type === "lifebridge_havens_snapshot"
  ) {
    return "Live Ops DB";
  }
  return "Local Knowledge";
}

function prioritizeSources(sources: RetrievalSource[]): RetrievalSource[] {
  const score = (source: RetrievalSource) => {
    let total = 0;
    if (isRealtimeSource(source)) total += 100;
    if (
      source.provider === "digitalocean_gradient" ||
      source.type?.startsWith("gradient_")
    )
      total += 40;
    if (typeof source.confidence === "number")
      total += Math.round(source.confidence * 10);
    return total;
  };
  return [...sources].sort((a, b) => score(b) - score(a));
}

export default function SamaritanChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      text: "Hi, I am Samaritan. I use DigitalOcean Gradient retrieval to answer case and crisis questions with source-backed guidance.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [runtimeState, setRuntimeState] = useState<RuntimeState>("checking");
  const [runtimeHint, setRuntimeHint] = useState(
    "Checking DigitalOcean live retrieval...",
  );
  const [locationContext, setLocationContext] =
    useState<LocationContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Context Awareness (Triggered on page change)
  useEffect(() => {
    if (pathname === "/attorneys") {
      addAssistantMessage(
        "I see you're looking for an attorney. Would you like me to help you find a pro-bono lawyer in your area?",
      );
    } else if (pathname === "/vault") {
      addAssistantMessage(
        "This is your secure Vault. You can upload essential documents like your Passport or Birth Certificate here.",
      );
    }
  }, [pathname]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationContext({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        });
      },
      () => {
        setLocationContext(null);
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 120000 },
    );
  }, []);

  useEffect(() => {
    let isActive = true;

    const checkRuntime = async () => {
      try {
        const response = await fetch("/api/crisis/runtime");
        const data = await response.json();
        if (!isActive) return;
        if (response.ok && data.active_mode === "live") {
          setRuntimeState("live");
          setRuntimeHint("Live DigitalOcean Gradient retrieval is active.");
        } else {
          setRuntimeState("offline");
          setRuntimeHint(
            "Live retrieval is unavailable. Check Gradient credentials.",
          );
        }
      } catch {
        if (!isActive) return;
        setRuntimeState("offline");
        setRuntimeHint("Unable to verify DigitalOcean runtime.");
      }
    };

    void checkRuntime();
    const timer = window.setInterval(() => {
      void checkRuntime();
    }, 45000);

    return () => {
      isActive = false;
      window.clearInterval(timer);
    };
  }, []);

  const addAssistantMessage = (text: string) => {
    // Prevent duplicate adjacent messages
    setMessages((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].text === text) return prev;
      return [...prev, { id: Date.now().toString(), role: "assistant", text }];
    });
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: inputValue,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Real AI call (strictly via backend DigitalOcean Gradient path).
    try {
      const chatContext: Record<string, unknown> = {
        route: pathname,
      };
      if (locationContext) {
        chatContext.lat = locationContext.lat;
        chatContext.lon = locationContext.lon;
        chatContext.location_accuracy_m = Math.round(
          locationContext.accuracyMeters || 0,
        );

        try {
          const havensRes = await fetch(
            `/api/crisis/havens/search?lat=${locationContext.lat}&lon=${locationContext.lon}&radius_km=25`,
          );
          if (havensRes.ok) {
            const havenData = (await havensRes.json()) as HavenSnapshot[];
            if (Array.isArray(havenData)) {
              chatContext.nearby_havens_snapshot = havenData
                .slice(0, 4)
                .map((haven) => ({
                  name: haven.name,
                  type: haven.type,
                  distance_km: haven.distance_km,
                  verification_tier: haven.verification_tier,
                  capacity_status: haven.capacity_status,
                }));
            }
          }
        } catch {
          // Non-blocking; chat should still work if haven snapshot fails.
        }
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          context: chatContext,
        }),
      });

      const data: ChatResponse = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = data.detail || "Chat service is unavailable right now.";
        throw new Error(detail);
      }

      const responseText =
        data.response?.trim() ||
        "I could not generate a response. Please try again.";
      const sources = Array.isArray(data.sources) ? data.sources : [];
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          text: responseText,
          sources,
          traceId: data.trace_id,
          retrievalProvider: data.retrieval_provider || "digitalocean_gradient",
          model: data.model,
        },
      ]);

      // Smart Navigation (Client-side trigger based on AI response content)
      const lowerResp = responseText.toLowerCase();
      if (lowerResp.includes("attorney") || lowerResp.includes("network")) {
        setTimeout(() => router.push("/attorneys"), 3000);
      }
      if (
        lowerResp.includes("resource") ||
        lowerResp.includes("guide") ||
        lowerResp.includes("vault")
      ) {
        if (lowerResp.includes("vault"))
          setTimeout(() => router.push("/vault"), 3000);
        else setTimeout(() => router.push("/resources"), 3000);
      }
    } catch (e) {
      const errorText =
        e instanceof Error ? e.message : "Connection error. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          text: `I could not complete that request. ${errorText}`,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  const sendDisabled =
    !inputValue.trim() || isTyping || runtimeState === "offline";
  const runtimeBadgeClass =
    runtimeState === "live"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : runtimeState === "offline"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="mb-4 w-[26rem] bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl overflow-hidden pointer-events-auto ring-1 ring-black/5"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-800 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <div className="relative">
                    <Heart className="w-5 h-5 text-pink-200 fill-pink-200" />
                    <Shield className="w-4 h-4 text-white absolute -bottom-1 -right-1" />
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Samaritan</h3>
                  <div className="flex items-center space-x-1">
                    <Database className="w-3 h-3 text-blue-100" />
                    <span className="text-blue-100 text-xs">
                      DigitalOcean Retrieval Assistant
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Close Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 py-2 border-b border-slate-200 bg-white">
              <div
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${runtimeBadgeClass}`}
              >
                {runtimeState === "live" ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                {runtimeHint}
              </div>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50/80">
              {messages.map((msg) => {
                const sortedSources = prioritizeSources(
                  Array.isArray(msg.sources) ? msg.sources : [],
                );
                const displaySources = sortedSources.slice(0, 5);
                const realtimeCount =
                  sortedSources.filter(isRealtimeSource).length;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
                        msg.role === "assistant"
                          ? "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                          : "bg-blue-600 text-white rounded-tr-none"
                      }`}
                    >
                      {msg.text}
                      {msg.role === "assistant" &&
                        displaySources.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-[10px] uppercase tracking-wide text-gray-400">
                              Sources
                              {realtimeCount > 0
                                ? ` · ${realtimeCount} live`
                                : ""}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {displaySources.map((source, idx) => {
                                const providerLabel = providerLabelFor(source);
                                const live = isRealtimeSource(source);
                                return (
                                  <span
                                    key={`${msg.id}-source-${idx}`}
                                    className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700"
                                    title={`${providerLabel} • ${source.type || "source"}`}
                                  >
                                    {providerLabel} · {source.title}
                                    {live && (
                                      <span className="text-emerald-600">
                                        live
                                      </span>
                                    )}
                                    {typeof source.confidence === "number" && (
                                      <span className="text-blue-500">
                                        ({Math.round(source.confidence * 100)}%)
                                      </span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      {msg.role === "assistant" && msg.traceId && (
                        <p className="mt-2 text-[10px] text-gray-400">
                          Trace:{" "}
                          <span className="font-mono">
                            {msg.traceId.slice(0, 8)}
                          </span>
                        </p>
                      )}
                      {msg.role === "assistant" && msg.retrievalProvider && (
                        <p className="mt-1 text-[10px] text-gray-400">
                          Provider:{" "}
                          {msg.retrievalProvider === "digitalocean_gradient"
                            ? "DigitalOcean Gradient"
                            : msg.retrievalProvider.startsWith("openstreetmap")
                              ? "OpenStreetMap"
                              : msg.retrievalProvider}
                        </p>
                      )}
                      {msg.role === "assistant" && msg.model && (
                        <p className="mt-1 text-[10px] text-gray-400">
                          Model: {msg.model}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-gray-100 flex items-center space-x-2">
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                    <span className="ml-2 text-xs text-gray-400 font-medium flex items-center">
                      <Search className="w-3 h-3 mr-1" />
                      Retrieving DigitalOcean sources...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    runtimeState === "offline"
                      ? "Live retrieval unavailable"
                      : "Ask Samaritan..."
                  }
                  className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={sendDisabled}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 text-center">
                <p className="text-[10px] text-gray-500 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 mr-1 text-blue-500" />
                  Powered by DigitalOcean Gradient retrieval (no Gemini)
                </p>
                <p className="mt-1 text-[10px] text-gray-400">
                  {locationContext
                    ? "Location context attached for more realistic nearby guidance."
                    : "Enable location permissions for more realistic nearby guidance."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="pointer-events-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all ring-2 ring-white/50 relative group"
        aria-label="Toggle Samaritan Chat"
      >
        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
        {isOpen ? (
          <X className="w-7 h-7" />
        ) : (
          <div className="relative">
            <Heart className="w-7 h-7 fill-current" />
            <div className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full border-2 border-white" />
          </div>
        )}
      </motion.button>
    </div>
  );
}
