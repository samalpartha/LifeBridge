"""DigitalOcean Gradient AI + deterministic fallback orchestration service.

This service provides a hybrid runtime:
- live: always call DigitalOcean Gradient APIs (requires credentials)
- mock: deterministic local multi-agent orchestration
- auto: live if available, otherwise mock
"""
from __future__ import annotations

import datetime as dt
import json
import os
import re
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from dataclasses import dataclass
from typing import Any, Literal

from geopy.distance import geodesic
from sqlalchemy.orm import Session

from ..core.config import settings
from ..db.crisis_models import HelpOffer, HelpRequest, SafeHaven
from ..utils.logger import get_logger
from .crisis_routing import generate_route_options

try:
    from gradientai import Gradient
except Exception:  # pragma: no cover - import varies by environment
    Gradient = None  # type: ignore[assignment]

logger = get_logger(__name__)
LIVE_RAG_COLLECTION_NAME = "LifeBridge Crisis Knowledge Base"
LIVE_RAG_COLLECTION_SLUG = "lifebridge-crisis-kb"
LIVE_ENDPOINT_STYLE_INSTRUCTION = (
    "You are RescueOps Copilot for a crisis response product. "
    "Return only user-facing guidance and never include <think> tags or reasoning traces. "
    "Use this exact section order with short bullets: "
    "Situation summary; Recommended options (3); Immediate next steps (next 15-30 minutes); "
    "Family reunification/check-in suggestion (if relevant); "
    "Help request/offer suggestion (if relevant); Confidence + source basis (brief). "
    "If a section is not relevant, write: Not needed right now. "
    "Grounding rules: do not invent shelters, routes, distances, capacities, or legal facts. "
    "Only state specific facts present in retrieval context or explicit user-provided context. "
    "If local verified data is missing, say so clearly and request the minimum next input needed. "
    "If nearby_services_snapshot exists in context, include at least 2 named places and distances."
)
MULTI_INTENT_HINTS = (
    " and ",
    " compare ",
    " options",
    "versus",
    " vs ",
    "first",
    "then",
    "also",
)
STEP_BACK_HINTS = (
    "why",
    "background",
    "policy",
    "principle",
    "explain",
    "context",
    "tradeoff",
)
LOCATION_QUERY_PATTERNS = (
    re.compile(r"\b(?:in|near|around|at|from)\s+([A-Za-z][A-Za-z0-9\s,.'-]{1,90})", re.IGNORECASE),
    re.compile(r"\bhelp\s+me\s+([A-Za-z][A-Za-z0-9\s,.'-]{1,90})", re.IGNORECASE),
)
LOCATION_STOPWORDS = (
    " right now",
    " now",
    " please",
    " urgently",
    " tonight",
    " today",
    " asap",
    " with ",
    " for ",
)
OSM_USER_AGENT = "LifeBridgeCrisisApp/1.0 (+https://lifebridge.local)"
REALTIME_SOURCE_TYPES = {
    "openstreetmap_geocode",
    "openstreetmap_reverse_geocode",
    "openstreetmap_nearby_services",
    "lifebridge_havens_snapshot",
}
REALTIME_SOURCE_PROVIDER_PREFIXES = ("openstreetmap",)
REALTIME_SOURCE_PROVIDERS = {"lifebridge_operational_db"}


def _utc_now_iso() -> str:
    return dt.datetime.now(dt.UTC).isoformat().replace("+00:00", "Z")


def _parse_services(raw: object) -> list[str]:
    if raw is None:
        return []
    if isinstance(raw, list):
        return [str(item) for item in raw]
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return [str(item) for item in parsed]
        except json.JSONDecodeError:
            pass
        return [item.strip() for item in raw.split(",") if item.strip()]
    return []


def _distance_km(a: tuple[float, float], b: tuple[float, float]) -> float:
    return float(geodesic(a, b).kilometers)


@dataclass
class AgentExecution:
    response: str
    tool_calls: list[dict[str, Any]]
    sources: list[dict[str, Any]]
    trace_id: str
    duration_ms: int
    confidence_score: float
    mode: Literal["mock", "live"]
    agents: list[str]
    model: str | None = None


class GradientAIService:
    """Hybrid Gradient orchestration service with multi-agent mock fallback."""

    def __init__(self) -> None:
        self.runtime_mode = settings.GRADIENT_RUNTIME_MODE
        self._active_mode: Literal["mock", "live"] = "mock"
        self._client: Any | None = None
        self._agent_id: str | None = settings.GRADIENT_AGENT_ID
        self._agent_endpoint: str | None = settings.GRADIENT_AGENT_ENDPOINT
        self._agent_access_key: str | None = settings.GRADIENT_AGENT_ACCESS_KEY
        self._knowledge_base_id: str | None = settings.GRADIENT_KNOWLEDGE_BASE_ID
        self._last_bootstrap_error: str | None = None
        self._location_intel_cache: dict[str, tuple[float, dict[str, Any]]] = {}
        self._location_intel_cache_ttl_seconds: int = 300

    def _token_available(self) -> bool:
        token = settings.GRADIENT_ACCESS_TOKEN
        return bool(token and token.strip())

    def _workspace_available(self) -> bool:
        workspace_id = settings.GRADIENT_WORKSPACE_ID
        return bool(workspace_id and workspace_id.strip())

    def _agent_endpoint_available(self) -> bool:
        endpoint = self._agent_endpoint
        return bool(endpoint and endpoint.strip())

    def _agent_access_key_available(self) -> bool:
        key = self._agent_access_key
        return bool(key and key.strip())

    def _live_requested(self) -> bool:
        if self.runtime_mode not in {"live", "auto"}:
            return False
        if self._agent_endpoint_available() and self._agent_access_key_available():
            return True
        return self._token_available() and self._workspace_available()

    def get_runtime_status(self) -> dict[str, Any]:
        return {
            "configured_mode": self.runtime_mode,
            "active_mode": self._active_mode,
            "token_configured": self._token_available(),
            "workspace_configured": self._workspace_available(),
            "agent_endpoint_configured": self._agent_endpoint_available(),
            "agent_access_key_configured": self._agent_access_key_available(),
            "client_ready": self._client is not None,
            "agent_id": self._agent_id,
            "agent_endpoint": self._agent_endpoint,
            "knowledge_base_id": self._knowledge_base_id,
            "last_bootstrap_error": self._last_bootstrap_error,
        }

    async def bootstrap(self) -> None:
        """Initialize runtime and (best-effort) live resources."""
        self._active_mode = "mock"
        self._last_bootstrap_error = None

        if not self._live_requested():
            missing = []
            if self._agent_endpoint_available() and not self._agent_access_key_available():
                missing.append("GRADIENT_AGENT_ACCESS_KEY")
            elif self._agent_access_key_available() and not self._agent_endpoint_available():
                missing.append("GRADIENT_AGENT_ENDPOINT")
            else:
                if not self._token_available():
                    missing.append("GRADIENT_ACCESS_TOKEN")
                if not self._workspace_available():
                    missing.append("GRADIENT_WORKSPACE_ID")
                missing.append("or GRADIENT_AGENT_ENDPOINT + GRADIENT_AGENT_ACCESS_KEY")

            logger.info(
                "gradient_bootstrap_mock_mode",
                configured_mode=self.runtime_mode,
                missing_live_prerequisites=missing,
            )
            if self.runtime_mode == "live":
                raise RuntimeError(f"Gradient live mode prerequisites missing: {', '.join(missing)}")
            return

        # Preferred live path: call deployed DigitalOcean Agent endpoint directly.
        if self._agent_endpoint_available():
            if not self._agent_access_key_available():
                message = (
                    "GRADIENT_AGENT_ACCESS_KEY is required when GRADIENT_AGENT_ENDPOINT is configured"
                )
                self._last_bootstrap_error = message
                logger.error("gradient_agent_endpoint_bootstrap_failed", error=message)
                if self.runtime_mode == "live":
                    raise RuntimeError(message)
                return
            self._active_mode = "live"
            logger.info(
                "gradient_agent_endpoint_ready",
                agent_endpoint=self._agent_endpoint,
                agent_id=self._agent_id,
            )
            return

        if Gradient is None:
            message = "gradientai package not available"
            self._last_bootstrap_error = message
            logger.warning("gradient_bootstrap_live_unavailable", reason=message)
            if self.runtime_mode == "live":
                raise RuntimeError(message)
            return

        try:
            self._client = Gradient(
                access_token=settings.GRADIENT_ACCESS_TOKEN,
                workspace_id=settings.GRADIENT_WORKSPACE_ID,
            )
            self._active_mode = "live"
            logger.info("gradient_client_initialized")

            # Best-effort live bootstrap. If this fails in auto mode, we still allow
            # local multi-agent fallback at request time.
            await self._bootstrap_live_resources()
            if not self._knowledge_base_id:
                message = "Gradient RAG collection is unavailable after bootstrap"
                self._last_bootstrap_error = message
                if self.runtime_mode == "live":
                    raise RuntimeError(message)
                self._active_mode = "mock"
        except Exception as exc:  # pragma: no cover - depends on remote SDK/runtime
            self._last_bootstrap_error = str(exc)
            logger.error("gradient_bootstrap_failed", error=str(exc), exc_info=True)
            self._client = None
            self._active_mode = "mock"
            if self.runtime_mode == "live":
                raise

    async def _bootstrap_live_resources(self) -> None:
        if self._client is None:
            return

        collection = None
        if self._knowledge_base_id:
            try:
                collection = self._client.get_rag_collection(id_=self._knowledge_base_id)
                logger.info("gradient_rag_collection_loaded", collection_id=self._knowledge_base_id)
            except Exception as exc:  # pragma: no cover - remote SDK/runtime
                logger.warning(
                    "gradient_rag_collection_lookup_failed",
                    collection_id=self._knowledge_base_id,
                    error=str(exc),
                )
                collection = None

        if collection is None:
            try:
                collections = self._client.list_rag_collections()
                for item in collections:
                    if getattr(item, "name", "") == LIVE_RAG_COLLECTION_NAME:
                        collection = item
                        break
            except Exception as exc:  # pragma: no cover - remote SDK/runtime
                logger.warning("gradient_rag_collection_list_failed", error=str(exc))

        if collection is None:
            filepaths = _write_temp_kb_documents()
            try:
                collection = self._client.create_rag_collection(
                    name=LIVE_RAG_COLLECTION_NAME,
                    slug=LIVE_RAG_COLLECTION_SLUG,
                    filepaths=filepaths,
                )
                logger.info("gradient_rag_collection_created", name=LIVE_RAG_COLLECTION_NAME)
            except Exception as exc:  # pragma: no cover - remote SDK/runtime
                logger.warning("gradient_rag_collection_create_failed", error=str(exc))
                # Retry by listing collections in case slug already exists.
                collections = self._client.list_rag_collections()
                for item in collections:
                    if getattr(item, "name", "") == LIVE_RAG_COLLECTION_NAME:
                        collection = item
                        break
            finally:
                _cleanup_temp_files(filepaths)

        if collection is None:
            raise RuntimeError("Unable to resolve or create Gradient RAG collection")

        current_files = []
        try:
            current_files = list(getattr(collection, "files", []) or [])
        except Exception:  # pragma: no cover - remote SDK/runtime
            current_files = []

        if len(current_files) == 0:
            filepaths = _write_temp_kb_documents()
            try:
                collection.add_files(filepaths=filepaths)
                logger.info("gradient_rag_collection_seeded", files_added=len(filepaths))
            finally:
                _cleanup_temp_files(filepaths)

        self._knowledge_base_id = str(getattr(collection, "id_", None) or "")
        if not self._knowledge_base_id:
            raise RuntimeError("Gradient RAG collection ID is empty")

        # There is no separate "agent id" in the installed SDK. We keep this
        # marker for compatibility with existing runtime status payloads.
        self._agent_id = f"gradient-rag:{self._knowledge_base_id}"
        logger.info(
            "gradient_live_resources_ready",
            rag_collection_id=self._knowledge_base_id,
            agent_marker=self._agent_id,
        )

    def live_healthcheck(self) -> dict[str, Any]:
        """Verify live Gradient connectivity and return diagnostics."""
        if self._agent_endpoint_available():
            return self._agent_endpoint_healthcheck()

        if self._client is None:
            return {
                "ok": False,
                "active_mode": self._active_mode,
                "reason": "Gradient client not initialized",
            }
        try:
            models = self._client.list_models()
            return {
                "ok": True,
                "active_mode": self._active_mode,
                "model_count": len(models),
                "knowledge_base_id": self._knowledge_base_id,
            }
        except Exception as exc:  # pragma: no cover - remote SDK/runtime
            return {
                "ok": False,
                "active_mode": self._active_mode,
                "reason": str(exc),
            }

    async def refresh_live_knowledge_base(self) -> dict[str, Any]:
        """Append current crisis documents into the live RAG collection."""
        if self._client is None or self._active_mode != "live":
            raise RuntimeError("Live Gradient runtime is not active")
        if not self._knowledge_base_id:
            raise RuntimeError("Knowledge base id is unavailable")

        collection = self._client.get_rag_collection(id_=self._knowledge_base_id)
        filepaths = _write_temp_kb_documents()
        try:
            collection.add_files(filepaths=filepaths)
        finally:
            _cleanup_temp_files(filepaths)
        return {
            "knowledge_base_id": self._knowledge_base_id,
            "files_added": len(filepaths),
            "status": "ok",
        }

    async def run_query(
        self,
        *,
        query: str,
        context: dict[str, Any] | None,
        db: Session,
    ) -> dict[str, Any]:
        """Run orchestrated query with live-or-mock fallback semantics."""
        context = dict(context or {})
        context = self._augment_context_with_location_intel(query=query, context=context, db=db)
        has_endpoint_live = self._agent_endpoint_available() and self._agent_access_key_available()
        has_legacy_live = self._client is not None and self._knowledge_base_id is not None
        if self._active_mode == "live" and (has_endpoint_live or has_legacy_live):
            try:
                execution = await self._run_live(query=query, context=context, db=db)
                return execution.__dict__
            except Exception as exc:  # pragma: no cover - remote SDK/runtime
                logger.error("gradient_live_query_failed", error=str(exc), exc_info=True)
                if self.runtime_mode == "live":
                    raise
                self._active_mode = "mock"

        execution = await self._run_mock(query=query, context=context, db=db)
        return execution.__dict__

    async def _run_live(self, *, query: str, context: dict[str, Any], db: Session) -> AgentExecution:
        if self._agent_endpoint_available() and self._agent_access_key_available():
            return await self._run_live_via_agent_endpoint(query=query, context=context, db=db)

        if self._client is None or self._knowledge_base_id is None:
            raise RuntimeError("Live Gradient runtime is not initialized")

        strict_live_only = bool(context.get("strict_live_only", False))
        include_local_agents = bool(context.get("include_local_agents", True)) and not strict_live_only
        append_operational_plan = bool(context.get("append_operational_plan", False))
        require_retrieval_sources = bool(context.get("require_retrieval_sources", False))
        require_realtime_sources = bool(context.get("require_realtime_sources", False))

        start = time.time()
        live_query = self._compose_live_user_message(query=query, context=context)
        result = self._client.answer(
            question=live_query,
            source={"type": "rag", "collection_id": self._knowledge_base_id},
        )
        model_name = str(getattr(result, "model", "") or "").strip() or None
        self._enforce_model_policy(model_name=model_name or "", context=context)
        live_response = _sanitize_model_response(str(getattr(result, "answer", "") or ""))
        rag_context = getattr(result, "rag_context", None)
        retrieval_sources = _extract_sources_from_rag_context(rag_context)
        location_sources = _extract_location_intel_sources(context)
        sources = [*retrieval_sources, *location_sources]
        local_orchestration = (
            await self._run_local_multi_agent(query=query, context=context, db=db)
            if include_local_agents
            else {"response": "", "tool_calls": [], "sources": [], "agents": []}
        )
        duration_ms = int((time.time() - start) * 1000)

        if strict_live_only and not live_response:
            raise RuntimeError("Live Gradient response is empty")
        if require_retrieval_sources and not retrieval_sources:
            raise RuntimeError("Live Gradient response did not include retrieval sources")
        if require_realtime_sources and not any(_is_realtime_source(source) for source in sources):
            raise RuntimeError(
                "Live answer missing real-time sources. Share a city or enable location for live nearby data."
            )

        response = live_response if live_response else local_orchestration["response"]
        if append_operational_plan and live_response and local_orchestration["response"]:
            response = (
                f"{live_response}\n\n"
                "Operational plan from Crisis Corridor agents:\n"
                f"{local_orchestration['response']}"
            )

        tool_calls = [
            {
                "agent": "GradientLiveRAG",
                "tool": "answer",
                "input": {"collection_id": self._knowledge_base_id},
                "output_summary": "Generated live Gradient RAG response",
            },
        ]
        if include_local_agents:
            tool_calls.extend(local_orchestration["tool_calls"])

        combined_sources = sources if (strict_live_only or sources) else local_orchestration["sources"]
        combined_sources = _filter_sources_for_response(sources=combined_sources, context=context)
        agent_list = ["GradientLiveRAG", *local_orchestration["agents"]]
        return AgentExecution(
            response=response,
            tool_calls=tool_calls,
            sources=combined_sources,
            trace_id=str(uuid.uuid4()),
            duration_ms=duration_ms,
            confidence_score=0.89 if sources else 0.72,
            mode="live",
            agents=agent_list,
            model=model_name,
        )

    async def _run_live_via_agent_endpoint(
        self, *, query: str, context: dict[str, Any], db: Session
    ) -> AgentExecution:
        if not self._agent_endpoint or not self._agent_access_key:
            raise RuntimeError("Agent endpoint live mode is not fully configured")

        strict_live_only = bool(context.get("strict_live_only", False))
        include_local_agents = bool(context.get("include_local_agents", True)) and not strict_live_only
        append_operational_plan = bool(context.get("append_operational_plan", False))
        require_retrieval_sources = bool(context.get("require_retrieval_sources", False))
        require_realtime_sources = bool(context.get("require_realtime_sources", False))

        start = time.time()
        payload = self._build_live_endpoint_payload(query=query, context=context)
        response_obj = self._post_json(
            url=f"{self._agent_endpoint.rstrip('/')}/api/v1/chat/completions",
            access_key=self._agent_access_key,
            payload=payload,
        )
        model_name = str(response_obj.get("model") or "").strip() or None
        self._enforce_model_policy(model_name=model_name or "", context=context)
        live_response = _extract_endpoint_response_text(response_obj)
        retrieval_sources = _extract_sources_from_endpoint_response(response_obj)
        location_sources = _extract_location_intel_sources(context)
        sources = [*retrieval_sources, *location_sources]
        local_orchestration = (
            await self._run_local_multi_agent(query=query, context=context, db=db)
            if include_local_agents
            else {"response": "", "tool_calls": [], "sources": [], "agents": []}
        )
        duration_ms = int((time.time() - start) * 1000)

        if strict_live_only and not live_response:
            raise RuntimeError("Live DigitalOcean agent returned an empty response")
        if require_retrieval_sources and not retrieval_sources:
            raise RuntimeError("Live DigitalOcean response did not include retrieval sources")
        if require_realtime_sources and not any(_is_realtime_source(source) for source in sources):
            raise RuntimeError(
                "Live answer missing real-time sources. Share a city or enable location for live nearby data."
            )

        response = live_response if live_response else local_orchestration["response"]
        if append_operational_plan and live_response and local_orchestration["response"]:
            response = (
                f"{live_response}\n\n"
                "Operational plan from Crisis Corridor agents:\n"
                f"{local_orchestration['response']}"
            )

        tool_calls = [
            {
                "agent": "GradientLiveAgentEndpoint",
                "tool": "chat_completions",
                "input": {
                    "endpoint": self._agent_endpoint,
                    "agent_id": self._agent_id,
                    "knowledge_base_id": self._knowledge_base_id,
                    "retrieval_method": payload.get("retrieval_method"),
                    "k": payload.get("k"),
                    "model": model_name,
                },
                "output_summary": "Generated live agent endpoint response",
            }
        ]
        if include_local_agents:
            tool_calls.extend(local_orchestration["tool_calls"])

        combined_sources = sources if (strict_live_only or sources) else local_orchestration["sources"]
        combined_sources = _filter_sources_for_response(sources=combined_sources, context=context)
        return AgentExecution(
            response=response,
            tool_calls=tool_calls,
            sources=combined_sources,
            trace_id=str(uuid.uuid4()),
            duration_ms=duration_ms,
            confidence_score=0.9 if sources else 0.7,
            mode="live",
            agents=["GradientLiveAgentEndpoint", *local_orchestration["agents"]],
            model=model_name,
        )

    def _parse_required_model_patterns(self, context: dict[str, Any]) -> list[str]:
        value = context.get("required_model_patterns")
        if isinstance(value, list):
            return [str(item).strip().lower() for item in value if str(item).strip()]
        if isinstance(value, str) and value.strip():
            return [item.strip().lower() for item in value.split(",") if item.strip()]

        defaults = settings.GRADIENT_ALLOWED_MODEL_PATTERNS
        if defaults and defaults.strip():
            return [item.strip().lower() for item in defaults.split(",") if item.strip()]
        return []

    def _enforce_model_policy(self, *, model_name: str, context: dict[str, Any]) -> None:
        if not model_name:
            return
        model_lower = model_name.strip().lower()
        if not model_lower:
            return

        disallow_deepseek = bool(
            context.get("disallow_deepseek_model", settings.GRADIENT_DISALLOW_DEEPSEEK_MODEL)
        )
        if disallow_deepseek and "deepseek" in model_lower:
            raise RuntimeError(
                f"Blocked model '{model_name}' by policy (DeepSeek is disallowed). "
                "Switch the DigitalOcean agent model in Agent settings."
            )

        required_patterns = self._parse_required_model_patterns(context)
        if required_patterns and not any(pattern in model_lower for pattern in required_patterns):
            raise RuntimeError(
                f"Blocked model '{model_name}' by allowlist policy. "
                f"Required pattern(s): {', '.join(required_patterns)}."
            )

    def _choose_retrieval_method(self, *, query: str, context: dict[str, Any]) -> str:
        explicit = context.get("retrieval_method")
        if isinstance(explicit, str):
            normalized = explicit.strip().lower()
            if normalized in {"rewrite", "step_back", "sub_queries", "none"}:
                return normalized

        lower = query.lower()
        token_count = len(lower.split())
        if lower.count("?") >= 2 or token_count >= 28 or any(hint in lower for hint in MULTI_INTENT_HINTS):
            return "sub_queries"
        if any(hint in lower for hint in STEP_BACK_HINTS):
            return "step_back"
        return "rewrite"

    def _choose_retrieval_k(self, *, retrieval_method: str, context: dict[str, Any]) -> int:
        explicit = context.get("k")
        if isinstance(explicit, int):
            return max(1, min(explicit, 25))

        base_k = max(int(settings.GRADIENT_DEFAULT_RETRIEVAL_K), 1)
        sub_query_k = max(int(settings.GRADIENT_SUB_QUERY_RETRIEVAL_K), 1)
        if retrieval_method == "sub_queries":
            return min(max(sub_query_k, base_k), 25)
        if retrieval_method == "step_back":
            return min(max(base_k + 2, base_k), 25)
        return min(base_k, 25)

    def _location_cache_key(self, *, query: str, context: dict[str, Any]) -> str:
        lat = context.get("lat")
        lon = context.get("lon")
        radius = context.get("location_intel_radius_km", 8)
        if isinstance(lat, (int, float)) and isinstance(lon, (int, float)):
            radius_value = float(radius) if isinstance(radius, (int, float)) else 8.0
            return f"coords:{float(lat):.3f}:{float(lon):.3f}:{radius_value:.1f}"
        hint = str(context.get("location_name") or "").strip()
        if not hint:
            hint = _extract_location_query_text(query) or ""
        if hint:
            return f"hint:{hint.lower()}"
        return ""

    def _get_cached_location_context(self, key: str) -> dict[str, Any] | None:
        if not key:
            return None
        cached = self._location_intel_cache.get(key)
        if cached is None:
            return None
        cached_at, payload = cached
        if (time.time() - cached_at) > self._location_intel_cache_ttl_seconds:
            self._location_intel_cache.pop(key, None)
            return None
        return dict(payload)

    def _set_cached_location_context(self, *, key: str, payload: dict[str, Any]) -> None:
        if not key:
            return
        self._location_intel_cache[key] = (time.time(), payload)
        if len(self._location_intel_cache) <= 120:
            return
        # Keep cache bounded with a simple oldest-first eviction.
        oldest_key = min(self._location_intel_cache.items(), key=lambda item: item[1][0])[0]
        self._location_intel_cache.pop(oldest_key, None)

    def _augment_context_with_location_intel(
        self,
        *,
        query: str,
        context: dict[str, Any],
        db: Session,
    ) -> dict[str, Any]:
        """Resolve location and add nearby real-world services for any geography."""
        if not bool(context.get("augment_location_intel", True)):
            return context

        enriched = dict(context)
        cache_key = self._location_cache_key(query=query, context=enriched)
        cached_payload = self._get_cached_location_context(cache_key)
        if cached_payload:
            enriched.update(cached_payload)
            return enriched

        location_sources = _extract_location_intel_sources(enriched)
        observed_at = _utc_now_iso()

        lat_value = enriched.get("lat")
        lon_value = enriched.get("lon")
        has_coords = isinstance(lat_value, (int, float)) and isinstance(lon_value, (int, float))
        lat = float(lat_value) if has_coords else None
        lon = float(lon_value) if has_coords else None

        if not has_coords:
            hint = str(enriched.get("location_name") or "").strip()
            if not hint:
                hint = _extract_location_query_text(query) or ""
            if hint:
                geocoded = _geocode_location_name(hint)
                if geocoded:
                    lat = geocoded["lat"]
                    lon = geocoded["lon"]
                    enriched["lat"] = lat
                    enriched["lon"] = lon
                    enriched["resolved_location"] = geocoded["display_name"]
                    enriched["location_source"] = "query_geocode"
                    location_sources.append(
                        {
                            "title": f"OpenStreetMap Nominatim · {hint}",
                            "type": "openstreetmap_geocode",
                            "provider": "openstreetmap_nominatim",
                            "confidence": 0.82,
                            "preview": str(geocoded["display_name"])[:220],
                            "observed_at": observed_at,
                        }
                    )
        else:
            enriched.setdefault("location_source", "device_geolocation")

        if isinstance(lat, float) and isinstance(lon, float):
            if not isinstance(enriched.get("resolved_location"), str):
                label = _reverse_geocode_label(lat=lat, lon=lon)
                if label:
                    enriched["resolved_location"] = label
                    location_sources.append(
                        {
                            "title": "OpenStreetMap Reverse Geocode",
                            "type": "openstreetmap_reverse_geocode",
                            "provider": "openstreetmap_nominatim",
                            "confidence": 0.78,
                            "preview": label[:220],
                            "observed_at": observed_at,
                        }
                    )

            if "nearby_havens_snapshot" not in enriched:
                try:
                    local_havens = self._agent_haven_intel(
                        db=db,
                        lat=lat,
                        lon=lon,
                        radius_km=max(float(enriched.get("radius_km", 25)), 1.0),
                    )
                    if local_havens:
                        enriched["nearby_havens_snapshot"] = [
                            {
                                "name": haven["name"],
                                "type": haven["type"],
                                "distance_km": haven["distance_km"],
                                "verification_tier": haven["verification_tier"],
                                "capacity_status": haven["capacity_status"],
                            }
                            for haven in local_havens[:4]
                        ]
                        haven_preview = ", ".join(str(haven["name"]) for haven in local_havens[:3])
                        location_sources.append(
                            {
                                "title": "LifeBridge Nearby Havens (operational DB)",
                                "type": "lifebridge_havens_snapshot",
                                "provider": "lifebridge_operational_db",
                                "confidence": 0.86,
                                "preview": haven_preview[:220],
                                "observed_at": observed_at,
                            }
                        )
                except Exception as exc:
                    logger.warning("location_intel_local_haven_snapshot_failed", error=str(exc))

            if not isinstance(enriched.get("nearby_services_snapshot"), list):
                raw_radius = enriched.get("location_intel_radius_km", 8)
                radius_km = 8.0
                if isinstance(raw_radius, (int, float)):
                    radius_km = max(1.0, min(float(raw_radius), 30.0))
                services = _fetch_nearby_public_services(lat=lat, lon=lon, radius_km=radius_km)
                if services:
                    enriched["nearby_services_snapshot"] = services
                    preview = ", ".join(str(item.get("name", "service")) for item in services[:3])
                    location_sources.append(
                        {
                            "title": "OpenStreetMap Nearby Services",
                            "type": "openstreetmap_nearby_services",
                            "provider": "openstreetmap_overpass",
                            "confidence": 0.75,
                            "preview": preview[:220],
                            "observed_at": observed_at,
                        }
                    )

        if location_sources:
            enriched["location_intel_sources"] = location_sources[:6]

        cache_payload = {
            "lat": enriched.get("lat"),
            "lon": enriched.get("lon"),
            "resolved_location": enriched.get("resolved_location"),
            "location_source": enriched.get("location_source"),
            "nearby_havens_snapshot": enriched.get("nearby_havens_snapshot"),
            "nearby_services_snapshot": enriched.get("nearby_services_snapshot"),
            "location_intel_sources": enriched.get("location_intel_sources"),
        }
        self._set_cached_location_context(key=cache_key, payload=cache_payload)
        return enriched

    def _compose_live_user_message(self, *, query: str, context: dict[str, Any]) -> str:
        """Add concise runtime context to improve grounded live responses."""
        context_lines: list[str] = []

        lat = context.get("lat")
        lon = context.get("lon")
        if isinstance(lat, (int, float)) and isinstance(lon, (int, float)):
            context_lines.append(f"- user_location: lat={float(lat):.5f}, lon={float(lon):.5f}")
        resolved_location = context.get("resolved_location")
        if isinstance(resolved_location, str) and resolved_location.strip():
            source = context.get("location_source")
            if isinstance(source, str) and source.strip():
                context_lines.append(
                    f"- resolved_location: {resolved_location.strip()[:120]} (source: {source.strip()[:40]})"
                )
            else:
                context_lines.append(f"- resolved_location: {resolved_location.strip()[:120]}")

        route = context.get("route")
        if isinstance(route, str) and route.strip():
            context_lines.append(f"- app_route: {route.strip()[:80]}")

        constraints = context.get("user_constraints")
        if isinstance(constraints, list) and constraints:
            compact_constraints = [str(item)[:32] for item in constraints[:8]]
            context_lines.append(f"- user_constraints: {', '.join(compact_constraints)}")

        nearby_havens = context.get("nearby_havens_snapshot")
        if isinstance(nearby_havens, list):
            if len(nearby_havens) == 0:
                context_lines.append("- nearby_havens_snapshot: none found in current app dataset radius")
            else:
                formatted_havens: list[str] = []
                for haven in nearby_havens[:4]:
                    if not isinstance(haven, dict):
                        continue
                    name = str(haven.get("name") or "unknown")
                    haven_type = str(haven.get("type") or "haven")
                    distance = haven.get("distance_km")
                    if isinstance(distance, (int, float)):
                        formatted_havens.append(f"{name} ({haven_type}, {float(distance):.1f} km)")
                    else:
                        formatted_havens.append(f"{name} ({haven_type})")
                if formatted_havens:
                    context_lines.append(f"- nearby_havens_snapshot: {', '.join(formatted_havens)}")

        nearby_services = context.get("nearby_services_snapshot")
        if isinstance(nearby_services, list):
            if len(nearby_services) == 0:
                context_lines.append("- nearby_services_snapshot: none found in radius")
            else:
                formatted_services: list[str] = []
                for service in nearby_services[:6]:
                    if not isinstance(service, dict):
                        continue
                    name = str(service.get("name") or "service")
                    service_type = str(service.get("type") or "service")
                    distance = service.get("distance_km")
                    if isinstance(distance, (int, float)):
                        formatted_services.append(
                            f"{name[:48]} ({service_type[:24]}, {float(distance):.1f} km)"
                        )
                    else:
                        formatted_services.append(f"{name[:48]} ({service_type[:24]})")
                if formatted_services:
                    context_lines.append(f"- nearby_services_snapshot: {', '.join(formatted_services)}")

        if not context_lines:
            return query

        context_block = "\n".join(context_lines)
        return (
            f"{query}\n\n"
            "Live app context:\n"
            f"{context_block}\n"
            "Use this context only when relevant to the user's request."
        )

    def _build_live_endpoint_payload(self, *, query: str, context: dict[str, Any]) -> dict[str, Any]:
        retrieval_method = self._choose_retrieval_method(query=query, context=context)
        retrieval_k = self._choose_retrieval_k(retrieval_method=retrieval_method, context=context)
        user_message = self._compose_live_user_message(query=query, context=context)
        payload: dict[str, Any] = {
            "messages": [
                {"role": "system", "content": LIVE_ENDPOINT_STYLE_INSTRUCTION},
                {"role": "user", "content": user_message},
            ],
            "stream": False,
            "include_functions_info": True,
            "include_retrieval_info": True,
            "include_guardrails_info": True,
            "provide_citations": True,
            "retrieval_method": retrieval_method,
        }
        if retrieval_method != "none":
            payload["k"] = retrieval_k
        if self._knowledge_base_id:
            payload["kb_filters"] = [{"index": self._knowledge_base_id}]
        if context.get("max_tokens") is not None:
            payload["max_tokens"] = int(context["max_tokens"])
        return payload

    def _agent_endpoint_healthcheck(self) -> dict[str, Any]:
        if not self._agent_endpoint:
            return {"ok": False, "active_mode": self._active_mode, "reason": "Agent endpoint missing"}
        if not self._agent_access_key:
            return {
                "ok": False,
                "active_mode": self._active_mode,
                "reason": "GRADIENT_AGENT_ACCESS_KEY is not configured",
            }
        health_status = "unknown"
        health_warning: str | None = None
        try:
            health_url = f"{self._agent_endpoint.rstrip('/')}/health"
            with urllib.request.urlopen(health_url, timeout=10) as response:
                raw = response.read().decode("utf-8")
            health_payload = json.loads(raw) if raw else {}
            health_status = str(health_payload.get("status", "unknown"))
        except Exception as exc:
            # Some endpoints may throttle or not expose /health consistently.
            # We still validate live connectivity via a real chat completion probe.
            health_status = "unavailable"
            health_warning = str(exc)
        try:
            probe = self._post_json(
                url=f"{self._agent_endpoint.rstrip('/')}/api/v1/chat/completions",
                access_key=self._agent_access_key,
                payload={
                    "messages": [{"role": "user", "content": "Reply with exactly: OK"}],
                    "stream": False,
                    "max_tokens": 16,
                },
            )
            content = _extract_endpoint_response_text(probe)
            preview = content[:80] if content else "live_probe_ok"
            return {
                "ok": True,
                "active_mode": self._active_mode,
                "agent_id": self._agent_id,
                "agent_endpoint": self._agent_endpoint,
                "health_status": health_status,
                "probe_response_preview": preview,
                **({"health_warning": health_warning} if health_warning else {}),
            }
        except Exception as exc:
            reason = str(exc)
            if health_warning:
                reason = f"{reason} (health endpoint warning: {health_warning})"
            return {
                "ok": False,
                "active_mode": self._active_mode,
                "agent_id": self._agent_id,
                "agent_endpoint": self._agent_endpoint,
                "reason": reason,
            }

    def _post_json(self, *, url: str, access_key: str, payload: dict[str, Any]) -> dict[str, Any]:
        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url=url,
            data=body,
            headers={
                "Authorization": f"Bearer {access_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        timeout_seconds = max(int(settings.GRADIENT_ENDPOINT_TIMEOUT_SECONDS), 5)
        retry_count = max(int(settings.GRADIENT_ENDPOINT_TIMEOUT_RETRIES), 0)
        retry_backoff = max(float(settings.GRADIENT_ENDPOINT_TIMEOUT_RETRY_BACKOFF_SECONDS), 0.0)

        for attempt in range(retry_count + 1):
            try:
                with urllib.request.urlopen(req, timeout=timeout_seconds) as response:
                    raw = response.read().decode("utf-8")
                return json.loads(raw) if raw else {}
            except urllib.error.HTTPError as exc:
                detail = exc.read().decode("utf-8", errors="replace")
                raise RuntimeError(f"Endpoint HTTP {exc.code}: {detail}") from exc
            except TimeoutError as exc:
                if attempt < retry_count:
                    if retry_backoff:
                        time.sleep(retry_backoff * (attempt + 1))
                    continue
                raise RuntimeError("Endpoint request failed: timed out") from exc
            except urllib.error.URLError as exc:
                reason = getattr(exc, "reason", exc)
                reason_text = str(reason)
                timeout_like = (
                    isinstance(reason, TimeoutError)
                    or "timed out" in reason_text.lower()
                    or "timeout" in reason_text.lower()
                )
                if timeout_like and attempt < retry_count:
                    if retry_backoff:
                        time.sleep(retry_backoff * (attempt + 1))
                    continue
                raise RuntimeError(f"Endpoint request failed: {reason_text}") from exc

        raise RuntimeError("Endpoint request failed: timed out")

    async def _run_mock(self, *, query: str, context: dict[str, Any], db: Session) -> AgentExecution:
        start = time.time()
        local_orchestration = await self._run_local_multi_agent(query=query, context=context, db=db)
        duration_ms = int((time.time() - start) * 1000)
        return AgentExecution(
            response=local_orchestration["response"],
            tool_calls=local_orchestration["tool_calls"],
            sources=local_orchestration["sources"],
            trace_id=str(uuid.uuid4()),
            duration_ms=duration_ms,
            confidence_score=0.74,
            mode="mock",
            agents=local_orchestration["agents"],
        )

    async def _run_local_multi_agent(
        self,
        *,
        query: str,
        context: dict[str, Any],
        db: Session,
    ) -> dict[str, Any]:
        agents = [
            "SafetyGuardianAgent",
            "HavenIntelAgent",
            "RouteRiskAgent",
            "ReunificationAgent",
            "AidMatchingAgent",
        ]
        tool_calls: list[dict[str, Any]] = []

        lat, lon = _extract_location(context)
        radius_km = float(context.get("radius_km", 20))
        constraints = _extract_constraints(query=query, context=context)

        havens = self._agent_haven_intel(
            db=db,
            lat=lat,
            lon=lon,
            radius_km=radius_km,
            required_services=context.get("required_services"),
        )
        tool_calls.append(
            {
                "agent": "HavenIntelAgent",
                "tool": "search_havens",
                "input": {"lat": lat, "lon": lon, "radius_km": radius_km},
                "output_summary": f"found {len(havens)} haven(s)",
            }
        )

        route_payload = self._agent_route_risk(
            lat=lat,
            lon=lon,
            havens=havens,
            constraints=constraints,
            context=context,
        )
        tool_calls.append(
            {
                "agent": "RouteRiskAgent",
                "tool": "generate_routes",
                "input": {
                    "origin": {"lat": lat, "lon": lon},
                    "constraint_count": len(constraints),
                },
                "output_summary": f"{len(route_payload.get('routes', []))} route option(s)",
            }
        )

        reunion = self._agent_reunification(query=query, context=context)
        tool_calls.append(
            {
                "agent": "ReunificationAgent",
                "tool": "reunification_guidance",
                "input": {"query_has_reunion_signal": reunion["relevant"]},
                "output_summary": reunion["summary"],
            }
        )

        aid = self._agent_aid_matching(db=db, lat=lat, lon=lon, query=query)
        tool_calls.append(
            {
                "agent": "AidMatchingAgent",
                "tool": "help_matching",
                "input": {"lat": lat, "lon": lon, "radius_km": 15},
                "output_summary": aid["summary"],
            }
        )

        guarded = self._agent_safety_guardian(route_payload)
        tool_calls.append(
            {
                "agent": "SafetyGuardianAgent",
                "tool": "safety_guardrails",
                "input": {"route_count": len(route_payload.get("routes", []))},
                "output_summary": guarded["summary"],
            }
        )

        response = _compose_response(
            query=query,
            havens=havens,
            route_payload=route_payload,
            reunion=reunion,
            aid=aid,
            guard=guarded,
        )
        return {
            "response": response,
            "tool_calls": tool_calls,
            "sources": _knowledge_sources(),
            "agents": agents,
        }

    def _agent_haven_intel(
        self,
        *,
        db: Session,
        lat: float,
        lon: float,
        radius_km: float,
        required_services: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        required_services = [s.lower() for s in (required_services or [])]
        havens: list[dict[str, Any]] = []
        for haven in db.query(SafeHaven).all():
            distance = _distance_km((lat, lon), (haven.lat, haven.lon))
            if distance > radius_km:
                continue
            services = _parse_services(haven.services)
            if required_services and not all(
                req in {s.lower() for s in services} for req in required_services
            ):
                continue
            havens.append(
                {
                    "id": haven.id,
                    "name": haven.name,
                    "type": haven.type,
                    "lat": haven.lat,
                    "lon": haven.lon,
                    "distance_km": round(distance, 2),
                    "capacity_status": haven.capacity_status,
                    "verification_tier": haven.verification_tier,
                    "services": services,
                    "hours": haven.hours,
                }
            )
        havens.sort(key=lambda item: item["distance_km"])
        return havens[:10]

    def _agent_route_risk(
        self,
        *,
        lat: float,
        lon: float,
        havens: list[dict[str, Any]],
        constraints: list[str],
        context: dict[str, Any],
    ) -> dict[str, Any]:
        if not havens:
            return {"routes": [], "destination": None}
        destination = havens[0]
        mode = str(context.get("mode", "walking"))
        time_of_day = str(context.get("time_of_day", "day"))
        route_options = generate_route_options(
            start_lat=lat,
            start_lon=lon,
            end_lat=float(destination["lat"]),
            end_lon=float(destination["lon"]),
            mode=mode,
            time_of_day=time_of_day,
            user_constraints=constraints,
        )
        routes = [
            {
                "type": option.type,
                "distance_km": round(option.distance_km, 2),
                "estimated_minutes": option.estimated_minutes,
                "risk_score": round(option.risk_score, 1),
                "risk_reasons": option.risk_reasons,
                "instructions": option.instructions,
            }
            for option in route_options
        ]
        return {"routes": routes, "destination": destination}

    def _agent_reunification(self, *, query: str, context: dict[str, Any]) -> dict[str, Any]:
        lower = query.lower()
        relevant = any(word in lower for word in ["family", "reunite", "beacon", "safe"])
        if not relevant:
            return {
                "relevant": False,
                "summary": "reunification not requested",
                "next_step": "Create a beacon if family separation risk increases.",
            }
        return {
            "relevant": True,
            "summary": "reunification guidance generated",
            "next_step": (
                "Create an 'I am safe' beacon and share the reunion code "
                "only with trusted family contacts."
            ),
        }

    def _agent_aid_matching(self, *, db: Session, lat: float, lon: float, query: str) -> dict[str, Any]:
        lower = query.lower()
        needs_help = any(word in lower for word in ["help", "transport", "food", "water", "medical"])
        nearby_requests = []
        nearby_offers = []
        for req in db.query(HelpRequest).filter(HelpRequest.fulfilled_at.is_(None)).all():
            dist = _distance_km((lat, lon), (req.lat, req.lon))
            if dist <= 15:
                nearby_requests.append({"id": req.id, "category": req.category, "distance_km": round(dist, 2)})
        for offer in db.query(HelpOffer).all():
            dist = _distance_km((lat, lon), (offer.lat, offer.lon))
            if dist <= max(float(offer.radius_km), 1.0):
                nearby_offers.append({"id": offer.id, "category": offer.category, "distance_km": round(dist, 2)})

        summary = f"{len(nearby_requests)} request(s), {len(nearby_offers)} offer(s) nearby"
        recommendation = (
            "Submit a help request now for faster matching."
            if needs_help and not nearby_offers
            else "Use nearby offers and keep status updated."
        )
        return {
            "summary": summary,
            "recommendation": recommendation,
            "nearby_requests": nearby_requests[:5],
            "nearby_offers": nearby_offers[:5],
        }

    def _agent_safety_guardian(self, route_payload: dict[str, Any]) -> dict[str, Any]:
        routes = route_payload.get("routes", [])
        alerts: list[str] = []
        if len(routes) < 3:
            alerts.append("Route diversity below safety policy (expected 3 options).")
        if any(float(route.get("risk_score", 0)) >= 70 for route in routes):
            alerts.append("At least one route has high risk; prioritize safer options.")
        return {
            "summary": "safety checks applied",
            "alerts": alerts,
            "policy_ok": len(routes) >= 3,
        }


def _extract_location(context: dict[str, Any]) -> tuple[float, float]:
    candidates = [
        (context.get("lat"), context.get("lon")),
        (context.get("start_lat"), context.get("start_lon")),
        (
            (context.get("user_location") or {}).get("lat")
            if isinstance(context.get("user_location"), dict)
            else None,
            (context.get("user_location") or {}).get("lon")
            if isinstance(context.get("user_location"), dict)
            else None,
        ),
    ]
    for lat, lon in candidates:
        if isinstance(lat, (int, float)) and isinstance(lon, (int, float)):
            return float(lat), float(lon)
    return 35.0, 36.0


def _extract_location_query_text(query: str) -> str | None:
    compact_query = query.strip()
    if not compact_query:
        return None
    for pattern in LOCATION_QUERY_PATTERNS:
        match = pattern.search(compact_query)
        if not match:
            continue
        phrase = _clean_location_phrase(match.group(1))
        if phrase:
            return phrase
    return None


def _clean_location_phrase(value: str) -> str:
    cleaned = value.strip().strip(",.?!;:")
    if not cleaned:
        return ""
    lower = cleaned.lower()
    for marker in LOCATION_STOPWORDS:
        index = lower.find(marker)
        if index > 0:
            cleaned = cleaned[:index]
            lower = cleaned.lower()
    cleaned = re.sub(r"\s+", " ", cleaned).strip().strip(",.?!;:")
    return cleaned


def _extract_location_intel_sources(context: dict[str, Any]) -> list[dict[str, Any]]:
    raw = context.get("location_intel_sources")
    if not isinstance(raw, list):
        return []
    normalized: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "").strip()
        if not title:
            continue
        normalized.append(
            {
                "title": title,
                "type": str(item.get("type") or "location_intel"),
                "provider": str(item.get("provider") or "location_intel"),
                "confidence": item.get("confidence", 0.7),
                "preview": str(item.get("preview") or "")[:240],
                "observed_at": str(item.get("observed_at") or _utc_now_iso()),
            }
        )
    return normalized[:6]


def _is_realtime_source(source: dict[str, Any]) -> bool:
    source_type = str(source.get("type") or "").strip().lower()
    provider = str(source.get("provider") or "").strip().lower()
    if source_type in REALTIME_SOURCE_TYPES:
        return True
    if any(provider.startswith(prefix) for prefix in REALTIME_SOURCE_PROVIDER_PREFIXES):
        return True
    if provider in REALTIME_SOURCE_PROVIDERS:
        return True
    return False


def _prioritize_sources(sources: list[dict[str, Any]]) -> list[dict[str, Any]]:
    def sort_key(item: dict[str, Any]) -> tuple[int, int, float]:
        realtime_score = 1 if _is_realtime_source(item) else 0
        provider = str(item.get("provider") or "").strip().lower()
        gradient_score = 1 if provider == "digitalocean_gradient" else 0
        confidence_raw = item.get("confidence")
        confidence = float(confidence_raw) if isinstance(confidence_raw, (int, float)) else 0.0
        return (realtime_score, gradient_score, confidence)

    return sorted(sources, key=sort_key, reverse=True)


def _filter_sources_for_response(
    *,
    sources: list[dict[str, Any]],
    context: dict[str, Any],
) -> list[dict[str, Any]]:
    prioritized = _prioritize_sources(sources)
    if not bool(context.get("show_realtime_sources_only", False)):
        return prioritized
    realtime_only = [source for source in prioritized if _is_realtime_source(source)]
    if realtime_only:
        return realtime_only
    return prioritized


def _fetch_json_url(url: str, *, timeout_s: int = 5) -> Any | None:
    request = urllib.request.Request(
        url=url,
        headers={"User-Agent": OSM_USER_AGENT},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout_s) as response:
            raw = response.read().decode("utf-8")
        return json.loads(raw) if raw else None
    except Exception:
        return None


def _geocode_location_name(location_text: str) -> dict[str, Any] | None:
    cleaned = _clean_location_phrase(location_text)
    if not cleaned:
        return None
    params = urllib.parse.urlencode(
        {
            "format": "jsonv2",
            "limit": "1",
            "q": cleaned,
        }
    )
    payload = _fetch_json_url(
        f"https://nominatim.openstreetmap.org/search?{params}",
        timeout_s=4,
    )
    if not isinstance(payload, list) or not payload:
        return None
    first = payload[0]
    if not isinstance(first, dict):
        return None
    try:
        lat = float(first.get("lat"))
        lon = float(first.get("lon"))
    except (TypeError, ValueError):
        return None
    display_name = str(first.get("display_name") or cleaned).strip()
    if not display_name:
        display_name = cleaned
    return {"lat": lat, "lon": lon, "display_name": display_name}


def _reverse_geocode_label(*, lat: float, lon: float) -> str | None:
    params = urllib.parse.urlencode(
        {
            "format": "jsonv2",
            "lat": f"{lat:.6f}",
            "lon": f"{lon:.6f}",
            "zoom": "10",
        }
    )
    payload = _fetch_json_url(
        f"https://nominatim.openstreetmap.org/reverse?{params}",
        timeout_s=4,
    )
    if not isinstance(payload, dict):
        return None
    display_name = str(payload.get("display_name") or "").strip()
    if not display_name:
        return None
    return display_name


def _extract_element_coordinates(element: dict[str, Any]) -> tuple[float | None, float | None]:
    lat = element.get("lat")
    lon = element.get("lon")
    if isinstance(lat, (int, float)) and isinstance(lon, (int, float)):
        return float(lat), float(lon)
    center = element.get("center")
    if isinstance(center, dict):
        c_lat = center.get("lat")
        c_lon = center.get("lon")
        if isinstance(c_lat, (int, float)) and isinstance(c_lon, (int, float)):
            return float(c_lat), float(c_lon)
    return None, None


def _infer_service_type(tags: dict[str, Any]) -> str:
    amenity = str(tags.get("amenity") or "").strip().lower()
    if amenity:
        return amenity.replace("_", " ")
    social = str(tags.get("social_facility") or "").strip().lower()
    if social:
        return f"social {social.replace('_', ' ')}"
    emergency = str(tags.get("emergency") or "").strip().lower()
    if emergency == "yes":
        return "emergency service"
    if emergency:
        return emergency.replace("_", " ")
    return "service"


def _is_supported_service_type(service_type: str) -> bool:
    normalized = service_type.strip().lower()
    if not normalized:
        return False
    keywords = ("hospital", "clinic", "pharmacy", "police", "fire station", "shelter", "ambulance")
    return any(keyword in normalized for keyword in keywords)


def _fetch_nearby_public_services(*, lat: float, lon: float, radius_km: float) -> list[dict[str, Any]]:
    radius_m = int(max(min(radius_km * 1000.0, 30000.0), 1000.0))
    query = (
        "[out:json][timeout:8];"
        "("
        f"nwr(around:{radius_m},{lat:.5f},{lon:.5f})[amenity~\"hospital|clinic|pharmacy|police|fire_station|shelter\"];"
        f"nwr(around:{radius_m},{lat:.5f},{lon:.5f})[social_facility~\"shelter|food_bank|ambulatory_care\"];"
        f"nwr(around:{radius_m},{lat:.5f},{lon:.5f})[emergency=\"ambulance_station\"];"
        ");"
        "out center 80;"
    )
    body = urllib.parse.urlencode({"data": query}).encode("utf-8")
    request = urllib.request.Request(
        url="https://overpass-api.de/api/interpreter",
        data=body,
        headers={
            "User-Agent": OSM_USER_AGENT,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            raw = response.read().decode("utf-8")
        payload = json.loads(raw) if raw else {}
    except Exception:
        return _fetch_keyword_services_via_nominatim(lat=lat, lon=lon)

    elements = payload.get("elements")
    if not isinstance(elements, list):
        return []

    services: list[dict[str, Any]] = []
    seen: set[tuple[str, str, int, int]] = set()
    for element in elements:
        if not isinstance(element, dict):
            continue
        tags = element.get("tags")
        if not isinstance(tags, dict):
            tags = {}
        service_lat, service_lon = _extract_element_coordinates(element)
        if service_lat is None or service_lon is None:
            continue

        service_type = _infer_service_type(tags)
        if not _is_supported_service_type(service_type):
            continue
        name = str(tags.get("name") or tags.get("operator") or f"{service_type.title()} service").strip()
        if not name:
            name = f"{service_type.title()} service"

        distance_km = _distance_km((lat, lon), (service_lat, service_lon))
        dedupe_key = (name.lower(), service_type, int(service_lat * 10000), int(service_lon * 10000))
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        services.append(
            {
                "name": name[:80],
                "type": service_type[:40],
                "distance_km": round(distance_km, 2),
                "lat": round(service_lat, 6),
                "lon": round(service_lon, 6),
            }
        )

    services.sort(key=lambda item: (float(item["distance_km"]), str(item["name"])))
    if services:
        return services[:8]
    return _fetch_keyword_services_via_nominatim(lat=lat, lon=lon)


def _fetch_keyword_services_via_nominatim(*, lat: float, lon: float) -> list[dict[str, Any]]:
    area_label = _reverse_geocode_label(lat=lat, lon=lon)
    if not area_label:
        return []

    query_plan = [
        ("hospital near", "hospital"),
        ("shelter near", "shelter"),
        ("police near", "police"),
        ("pharmacy near", "pharmacy"),
    ]
    services: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()

    for query_prefix, service_type in query_plan:
        params = urllib.parse.urlencode(
            {
                "format": "jsonv2",
                "limit": "3",
                "q": f"{query_prefix} {area_label}",
            }
        )
        payload = _fetch_json_url(
            f"https://nominatim.openstreetmap.org/search?{params}",
            timeout_s=3,
        )
        if not isinstance(payload, list):
            continue

        for item in payload:
            if not isinstance(item, dict):
                continue
            try:
                service_lat = float(item.get("lat"))
                service_lon = float(item.get("lon"))
            except (TypeError, ValueError):
                continue

            display_name = str(item.get("display_name") or "").strip()
            if not display_name:
                continue
            name = display_name.split(",")[0].strip() or f"{service_type.title()} service"
            dedupe_key = (name.lower(), service_type)
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)
            services.append(
                {
                    "name": name[:80],
                    "type": service_type,
                    "distance_km": round(_distance_km((lat, lon), (service_lat, service_lon)), 2),
                    "lat": round(service_lat, 6),
                    "lon": round(service_lon, 6),
                }
            )
            if len(services) >= 8:
                break
        if len(services) >= 8:
            break

    services.sort(key=lambda item: (float(item["distance_km"]), str(item["name"])))
    return services[:8]


def _extract_constraints(*, query: str, context: dict[str, Any]) -> list[str]:
    constraints: list[str] = [str(item) for item in context.get("user_constraints", [])]
    lower = query.lower()
    token_map = {
        "wheelchair": "wheelchair",
        "child": "children",
        "children": "children",
        "no car": "no_vehicle",
        "night": "night",
        "curfew": "curfew",
    }
    for token, label in token_map.items():
        if token in lower and label not in constraints:
            constraints.append(label)
    return constraints


def _compose_response(
    *,
    query: str,
    havens: list[dict[str, Any]],
    route_payload: dict[str, Any],
    reunion: dict[str, Any],
    aid: dict[str, Any],
    guard: dict[str, Any],
) -> str:
    lines: list[str] = []
    lines.append("RescueOps Copilot assessment:")
    lines.append(f"- Query interpreted as: {query}")

    if havens:
        lines.append("- Nearby verified havens:")
        for haven in havens[:3]:
            lines.append(
                f"  - {haven['name']} ({haven['type']}, {haven['distance_km']} km, "
                f"tier={haven['verification_tier']}, capacity={haven['capacity_status']})"
            )
    else:
        lines.append("- No havens were found in your radius. Expand radius or refresh location.")

    routes = route_payload.get("routes", [])
    if routes:
        lines.append("- Route options (always compare before moving):")
        for route in routes[:3]:
            reasons = ", ".join(route.get("risk_reasons", [])[:2])
            lines.append(
                f"  - {route['type']}: {route['distance_km']} km, "
                f"{route['estimated_minutes']} min, risk {route['risk_score']} ({reasons})"
            )
    else:
        lines.append("- Route options unavailable until at least one haven is selected.")

    if reunion.get("relevant"):
        lines.append(f"- Reunification: {reunion['next_step']}")

    lines.append(f"- Aid matching: {aid['summary']}. {aid['recommendation']}")
    if guard.get("alerts"):
        lines.append("- Safety alerts:")
        for alert in guard["alerts"]:
            lines.append(f"  - {alert}")
    lines.append("- Next action: pick the lowest-risk route and send a check-in before departure.")
    return "\n".join(lines)


def _write_temp_kb_documents() -> list[str]:
    """Persist KB content into temporary files for Gradient RAG ingestion."""
    paths: list[str] = []
    for index, doc in enumerate(_knowledge_documents()):
        doc_type = str(doc.get("metadata", {}).get("type", f"doc-{index + 1}"))
        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=f"-{doc_type}.md",
            encoding="utf-8",
            delete=False,
        ) as tmp:
            tmp.write(f"# {doc_type}\n\n")
            tmp.write(str(doc.get("content", "")))
            paths.append(tmp.name)
    return paths


def _cleanup_temp_files(filepaths: list[str]) -> None:
    for filepath in filepaths:
        try:
            os.remove(filepath)
        except FileNotFoundError:
            continue


def _extract_sources_from_rag_context(rag_context: Any) -> list[dict[str, Any]]:
    """Normalize live Gradient rag_context documents into source objects."""
    if rag_context is None:
        return []

    documents = getattr(rag_context, "documents", None) or []
    sources: list[dict[str, Any]] = []
    for document in documents:
        content = str(getattr(document, "content", "") or "")
        file_name = str(getattr(document, "file_name", "gradient-rag-document"))
        sources.append(
            {
                "title": file_name,
                "type": "gradient_rag_document",
                "provider": "digitalocean_gradient",
                "confidence": 0.9,
                "preview": content[:240].strip(),
            }
        )
    return sources


def _extract_endpoint_response_text(payload: dict[str, Any]) -> str:
    choices = payload.get("choices")
    if not isinstance(choices, list) or not choices:
        return ""
    first = choices[0]
    if not isinstance(first, dict):
        return ""
    message = first.get("message")
    if not isinstance(message, dict):
        return ""
    content = message.get("content")
    return _sanitize_model_response(str(content or ""))


def _extract_sources_from_endpoint_response(payload: dict[str, Any]) -> list[dict[str, Any]]:
    retrieval = payload.get("retrieval")
    if not isinstance(retrieval, dict):
        return []
    retrieved = retrieval.get("retrieved_data")
    if not isinstance(retrieved, list):
        return []

    sources: list[dict[str, Any]] = []
    for item in retrieved:
        if not isinstance(item, dict):
            continue
        title = str(item.get("filename") or item.get("index") or item.get("id") or "retrieved_source")
        preview = str(item.get("page_content") or "")[:240].strip()
        raw_score = item.get("score")
        confidence = 0.9
        if isinstance(raw_score, (int, float)):
            # Keep confidence bounded and deterministic for UI consumption.
            normalized = max(min(abs(float(raw_score)) / 100.0, 1.0), 0.4)
            confidence = round(normalized, 2)
        sources.append(
            {
                "title": title,
                "type": "gradient_agent_retrieval",
                "provider": "digitalocean_gradient",
                "confidence": confidence,
                "preview": preview,
            }
        )
    return sources


_THINK_BLOCK = re.compile(r"<think>.*?</think>\s*", re.IGNORECASE | re.DOTALL)
_OPEN_THINK_TO_END = re.compile(r"<think>.*$", re.IGNORECASE | re.DOTALL)


def _sanitize_model_response(text: str) -> str:
    """Remove private reasoning traces before returning end-user content."""
    if not text:
        return ""
    had_think = "<think>" in text.lower()
    cleaned = _THINK_BLOCK.sub("", text)
    cleaned = _OPEN_THINK_TO_END.sub("", cleaned).strip()
    if cleaned:
        return cleaned
    # If the model produced only internal reasoning, do not leak it.
    if had_think:
        return ""
    return text.strip()


def _knowledge_documents() -> list[dict[str, Any]]:
    from .crisis_kb_content import (
        CRISIS_FAQS,
        CRISIS_SAFETY_PROTOCOLS,
        HAVEN_VERIFICATION_PLAYBOOK,
    )

    return [
        {"content": CRISIS_FAQS, "metadata": {"type": "faq"}},
        {"content": HAVEN_VERIFICATION_PLAYBOOK, "metadata": {"type": "verification_playbook"}},
        {"content": CRISIS_SAFETY_PROTOCOLS, "metadata": {"type": "safety_protocols"}},
    ]


def _knowledge_sources() -> list[dict[str, Any]]:
    return [
        {
            "title": "Crisis Response FAQs",
            "type": "faq",
            "provider": "lifebridge_local_knowledge",
            "confidence": 0.85,
        },
        {
            "title": "Haven Verification Playbook",
            "type": "verification_playbook",
            "provider": "lifebridge_local_knowledge",
            "confidence": 0.89,
        },
        {
            "title": "Crisis Safety Protocols",
            "type": "safety_protocols",
            "provider": "lifebridge_local_knowledge",
            "confidence": 0.87,
        },
    ]


# Global service instance
gradient_service = GradientAIService()


# Agent tool definitions for RescueOps Copilot
RESCUEOPS_TOOLS = [
    {
        "name": "search_havens",
        "description": "Search for nearby safe havens (shelters, hospitals, embassies, aid stations)",
        "parameters": {
            "type": "object",
            "properties": {
                "lat": {"type": "number", "description": "User's latitude"},
                "lon": {"type": "number", "description": "User's longitude"},
                "radius_km": {"type": "number", "description": "Search radius in kilometers"},
                "haven_type": {"type": "string", "description": "Type of haven (shelter, hospital, embassy, aid_station, water_point)"},
                "required_services": {"type": "array", "items": {"type": "string"}, "description": "Required services"},
            },
            "required": ["lat", "lon"],
        },
    },
    {
        "name": "score_route",
        "description": "Assess safety risk for a route between two points",
        "parameters": {
            "type": "object",
            "properties": {
                "start_lat": {"type": "number"},
                "start_lon": {"type": "number"},
                "end_lat": {"type": "number"},
                "end_lon": {"type": "number"},
                "travel_mode": {"type": "string", "description": "walking, car, wheelchair"},
                "time_of_day": {"type": "string", "description": "morning, afternoon, evening, night"},
            },
            "required": ["start_lat", "start_lon", "end_lat", "end_lon"],
        },
    },
    {
        "name": "log_checkin",
        "description": "Log a safety check-in for a user",
        "parameters": {
            "type": "object",
            "properties": {
                "user_code": {"type": "string"},
                "lat": {"type": "number"},
                "lon": {"type": "number"},
                "status": {"type": "string", "description": "safe, moving, need_help"},
                "message": {"type": "string"},
            },
            "required": ["user_code", "lat", "lon", "status"],
        },
    },
]


# Agent system instructions
RESCUEOPS_INSTRUCTIONS = """You are the RescueOps Copilot, a humanitarian AI assistant helping displaced civilians find safety during crises.

MISSION:
- Guide people to verified safe havens
- Provide risk-aware route options
- Enable family reunification
- Maintain calm, reassuring tone

BEHAVIOR RULES (STRICT):
1. ALWAYS provide multiple route options (never just one)
2. ALWAYS explain risk factors and reasoning
3. NEVER guarantee absolute safety (acknowledge uncertainty)
4. PRIORITIZE vulnerable groups (children, elderly, disabled, pregnant)
5. INCLUDE accessibility considerations
6. RESPECT cultural and privacy needs
7. USE simple, clear language (assume stress and limited literacy)
8. PROVIDE actionable next steps
9. CITE sources and verification tiers
10. MAINTAIN hope while being realistic

CONSTRAINTS AWARENESS:
- Curfews and time windows
- Mobility limitations (wheelchair, children, no vehicle)
- Resource needs (food, water, medical, shelter)
- Language barriers
- Battery/connectivity limits

OUTPUT FORMAT:
1. Direct answer to request
2. Multiple options with clear trade-offs
3. Risk factors and mitigation steps
4. Actionable next steps
5. Sources and confidence level

Remember: You're helping people in crisis. Be clear, compassionate, and safety-first.
"""
