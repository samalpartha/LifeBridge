"""Integration tests for crisis endpoints."""

from fastapi.testclient import TestClient


def _create_haven(client: TestClient) -> str:
    response = client.post(
        "/crisis/havens",
        json={
            "name": "Central Shelter",
            "type": "shelter",
            "lat": 35.0,
            "lon": 36.0,
            "address": "Main Street",
            "services": ["food", "water", "medical"],
            "hours": "24/7",
            "intake_rules": "Families prioritized",
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_crisis_haven_search_and_update(client: TestClient) -> None:
    haven_id = _create_haven(client)

    search = client.get("/crisis/havens/search?lat=35.0&lon=36.0&radius_km=5")
    assert search.status_code == 200
    payload = search.json()
    assert len(payload) >= 1
    assert payload[0]["id"] == haven_id
    assert payload[0]["distance_km"] <= 5

    update = client.post(
        f"/crisis/havens/{haven_id}/updates",
        json={
            "status": "limited",
            "note": "Capacity reduced due to incoming families",
            "reporter_role": "admin",
            "evidence_url": "https://example.org/evidence",
        },
    )
    assert update.status_code == 201

    updates = client.get(f"/crisis/havens/{haven_id}/updates")
    assert updates.status_code == 200
    assert updates.json()[0]["status"] == "limited"


def test_crisis_routes_and_checkins_idempotent(client: TestClient) -> None:
    _create_haven(client)
    routes = client.post(
        "/crisis/routes/generate",
        json={
            "start_lat": 35.0,
            "start_lon": 36.0,
            "end_lat": 35.01,
            "end_lon": 36.01,
            "mode": "walking",
            "time_of_day": "day",
            "user_constraints": ["children"],
        },
    )
    assert routes.status_code == 200
    assert len(routes.json()["routes"]) == 3

    checkin_a = client.post(
        "/crisis/checkins",
        json={
            "user_code": "family-123",
            "lat": 35.0,
            "lon": 36.0,
            "status": "safe",
            "battery_level": 72,
            "message": "Reached waypoint",
        },
    )
    assert checkin_a.status_code == 201
    assert checkin_a.json()["idempotent"] is False

    checkin_b = client.post(
        "/crisis/checkins",
        json={
            "user_code": "family-123",
            "lat": 35.0,
            "lon": 36.0,
            "status": "safe",
            "battery_level": 70,
            "message": "Reached waypoint",
        },
    )
    assert checkin_b.status_code == 201
    assert checkin_b.json()["idempotent"] is True


def test_crisis_beacons_and_help_matching(client: TestClient) -> None:
    beacon_create = client.post(
        "/crisis/beacons",
        json={
            "beacon_code": "BEACON123",
            "family_name_hint": "SM",
            "lat": 35.0,
            "lon": 36.0,
            "status": "safe",
            "message": "At the shelter",
        },
    )
    assert beacon_create.status_code == 201
    assert beacon_create.json()["share_url"] == "/reunion/BEACON123"

    beacon_get = client.get("/crisis/beacons/BEACON123")
    assert beacon_get.status_code == 200
    assert beacon_get.json()["status"] == "safe"

    beacon_update = client.post(
        "/crisis/beacons/BEACON123/update",
        json={"status": "moving", "message": "Heading to medical point"},
    )
    assert beacon_update.status_code == 200

    request_create = client.post(
        "/crisis/help/requests",
        json={
            "requester_code": "req-1",
            "category": "transport",
            "details": "Need transport for family of 4",
            "lat": 35.01,
            "lon": 36.01,
            "urgency": "high",
        },
    )
    assert request_create.status_code == 201

    offer_create = client.post(
        "/crisis/help/offers",
        json={
            "offerer_code": "offer-1",
            "category": "transport",
            "details": "Van with 3 seats",
            "seats": 3,
            "radius_km": 20,
            "lat": 35.0,
            "lon": 36.0,
        },
    )
    assert offer_create.status_code == 201

    nearby_requests = client.get("/crisis/help/requests/nearby?lat=35.0&lon=36.0&radius_km=20")
    assert nearby_requests.status_code == 200
    assert len(nearby_requests.json()) >= 1

    nearby_offers = client.get("/crisis/help/offers/nearby?lat=35.0&lon=36.0&radius_km=20")
    assert nearby_offers.status_code == 200
    assert len(nearby_offers.json()) >= 1

    match = client.get("/crisis/help/match?lat=35.0&lon=36.0&category=transport")
    assert match.status_code == 200
    assert len(match.json()["requests"]) >= 1
    assert len(match.json()["offers"]) >= 1


def test_crisis_agent_and_trace_flow(client: TestClient) -> None:
    _create_haven(client)
    response = client.post(
        "/crisis/agent/query",
        json={
            "query": "I have a child and no car. Recommend safe options nearby.",
            "context": {"lat": 35.0, "lon": 36.0, "mode": "walking"},
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["trace_id"]
    assert payload["mode"] in {"mock", "live"}
    assert isinstance(payload["tool_calls"], list)
    assert isinstance(payload["agents"], list)

    runtime = client.get("/crisis/runtime")
    assert runtime.status_code == 200
    assert runtime.json()["active_mode"] in {"mock", "live"}

    live_check = client.get("/crisis/runtime/live-check")
    # Test suite runs in mock mode by default.
    assert live_check.status_code == 503

    trace = client.get(f"/crisis/traces/{payload['trace_id']}")
    assert trace.status_code == 200
    trace_payload = trace.json()
    assert trace_payload["trace_id"] == payload["trace_id"]
    assert "response" in trace_payload

    traces = client.get("/crisis/traces?limit=5")
    assert traces.status_code == 200
    assert len(traces.json()) >= 1
