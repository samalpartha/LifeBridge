"""Unit tests for Gradient service response normalization."""

import urllib.error

import pytest

from app.services.gradient_ai import (
    GradientAIService,
    _extract_endpoint_response_text,
    _extract_location_intel_sources,
    _extract_location_query_text,
    _extract_sources_from_endpoint_response,
    _filter_sources_for_response,
    _is_realtime_source,
)


def test_extract_endpoint_response_text_strips_private_reasoning() -> None:
    payload = {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": "<think>internal trace</think>\n\nSafe response for users.",
                }
            }
        ]
    }
    assert _extract_endpoint_response_text(payload) == "Safe response for users."


def test_extract_sources_from_endpoint_response_maps_retrieval_docs() -> None:
    payload = {
        "retrieval": {
            "retrieved_data": [
                {
                    "id": "doc-1",
                    "index": "kb-1",
                    "filename": "playbook.md",
                    "page_content": "Operational guidance for crisis routing.",
                    "score": 12.5,
                }
            ]
        }
    }
    sources = _extract_sources_from_endpoint_response(payload)
    assert len(sources) == 1
    assert sources[0]["title"] == "playbook.md"
    assert sources[0]["type"] == "gradient_agent_retrieval"
    assert "Operational guidance" in sources[0]["preview"]


def test_choose_retrieval_method_prefers_sub_queries_for_multi_intent() -> None:
    service = GradientAIService()
    method = service._choose_retrieval_method(
        query="Find nearby shelters and compare route options for elders and infants",
        context={},
    )
    assert method == "sub_queries"


def test_choose_retrieval_k_clamps_explicit_value() -> None:
    service = GradientAIService()
    k = service._choose_retrieval_k(retrieval_method="rewrite", context={"k": 50})
    assert k == 25


def test_model_policy_blocks_deepseek_when_requested() -> None:
    service = GradientAIService()
    with pytest.raises(RuntimeError, match="DeepSeek"):
        service._enforce_model_policy(
            model_name="deepseek-chat-v3",
            context={"disallow_deepseek_model": True},
        )


def test_model_policy_blocks_models_outside_allowlist() -> None:
    service = GradientAIService()
    with pytest.raises(RuntimeError, match="allowlist"):
        service._enforce_model_policy(
            model_name="gpt-4.1-mini",
            context={"required_model_patterns": "claude, llama-3.3"},
        )


def test_extract_location_query_text_from_free_form_prompt() -> None:
    assert _extract_location_query_text("Can you help me in Hartford tonight?") == "Hartford"
    assert _extract_location_query_text("Need urgent shelter near San Diego, CA right now") == "San Diego, CA"


def test_extract_location_intel_sources_normalizes_shape() -> None:
    sources = _extract_location_intel_sources(
        {
            "location_intel_sources": [
                {"title": "OpenStreetMap Nominatim", "provider": "openstreetmap_nominatim"},
                {"title": "", "provider": "x"},
                "invalid",
            ]
        }
    )
    assert len(sources) == 1
    assert sources[0]["title"] == "OpenStreetMap Nominatim"
    assert sources[0]["type"] == "location_intel"
    assert isinstance(sources[0]["observed_at"], str)


def test_compose_live_message_includes_nearby_services_snapshot() -> None:
    service = GradientAIService()
    message = service._compose_live_user_message(
        query="I need urgent help",
        context={
            "nearby_services_snapshot": [
                {"name": "Hartford Hospital", "type": "hospital", "distance_km": 1.4}
            ]
        },
    )
    assert "nearby_services_snapshot" in message
    assert "Hartford Hospital (hospital, 1.4 km)" in message


def test_is_realtime_source_detects_live_providers() -> None:
    assert _is_realtime_source({"provider": "openstreetmap_overpass", "type": "openstreetmap_nearby_services"})
    assert _is_realtime_source({"provider": "lifebridge_operational_db", "type": "lifebridge_havens_snapshot"})
    assert not _is_realtime_source({"provider": "digitalocean_gradient", "type": "gradient_agent_retrieval"})


def test_filter_sources_for_response_realtime_only() -> None:
    sources = [
        {"title": "safety-controls.md", "provider": "digitalocean_gradient", "type": "gradient_agent_retrieval"},
        {"title": "OpenStreetMap Nearby Services", "provider": "openstreetmap_overpass", "type": "openstreetmap_nearby_services"},
        {"title": "LifeBridge Nearby Havens (operational DB)", "provider": "lifebridge_operational_db", "type": "lifebridge_havens_snapshot"},
    ]
    filtered = _filter_sources_for_response(sources=sources, context={"show_realtime_sources_only": True})
    assert len(filtered) == 2
    assert all(_is_realtime_source(item) for item in filtered)


def test_filter_sources_for_response_keeps_all_when_disabled() -> None:
    sources = [
        {"title": "safety-controls.md", "provider": "digitalocean_gradient", "type": "gradient_agent_retrieval"},
        {"title": "OpenStreetMap Nearby Services", "provider": "openstreetmap_overpass", "type": "openstreetmap_nearby_services"},
    ]
    filtered = _filter_sources_for_response(sources=sources, context={"show_realtime_sources_only": False})
    assert len(filtered) == 2


def test_post_json_retries_once_for_timeout_errors(monkeypatch: pytest.MonkeyPatch) -> None:
    service = GradientAIService()
    call_count = 0

    class _Response:
        def __enter__(self) -> "_Response":
            return self

        def __exit__(self, exc_type, exc, tb) -> bool:
            return False

        def read(self) -> bytes:
            return b'{"ok": true}'

    def fake_urlopen(req, timeout):  # noqa: ANN001
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise urllib.error.URLError("timed out")
        return _Response()

    monkeypatch.setattr("app.services.gradient_ai.urllib.request.urlopen", fake_urlopen)
    monkeypatch.setattr("app.services.gradient_ai.time.sleep", lambda *_: None)
    monkeypatch.setattr("app.services.gradient_ai.settings.GRADIENT_ENDPOINT_TIMEOUT_RETRIES", 1, raising=False)
    monkeypatch.setattr("app.services.gradient_ai.settings.GRADIENT_ENDPOINT_TIMEOUT_SECONDS", 5, raising=False)

    payload = service._post_json(
        url="https://example.com/api/v1/chat/completions",
        access_key="test-key",
        payload={"messages": [{"role": "user", "content": "hello"}]},
    )

    assert payload == {"ok": True}
    assert call_count == 2


def test_post_json_timeout_retries_exhausted_raises(monkeypatch: pytest.MonkeyPatch) -> None:
    service = GradientAIService()
    call_count = 0

    def fake_urlopen(req, timeout):  # noqa: ANN001
        nonlocal call_count
        call_count += 1
        raise urllib.error.URLError("timed out")

    monkeypatch.setattr("app.services.gradient_ai.urllib.request.urlopen", fake_urlopen)
    monkeypatch.setattr("app.services.gradient_ai.time.sleep", lambda *_: None)
    monkeypatch.setattr("app.services.gradient_ai.settings.GRADIENT_ENDPOINT_TIMEOUT_RETRIES", 1, raising=False)
    monkeypatch.setattr("app.services.gradient_ai.settings.GRADIENT_ENDPOINT_TIMEOUT_SECONDS", 5, raising=False)

    with pytest.raises(RuntimeError, match="timed out"):
        service._post_json(
            url="https://example.com/api/v1/chat/completions",
            access_key="test-key",
            payload={"messages": [{"role": "user", "content": "hello"}]},
        )

    assert call_count == 2
