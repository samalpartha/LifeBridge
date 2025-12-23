"""Test health endpoint."""
import pytest
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """Test health endpoint returns success."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "version" in data
    assert "components" in data


def test_health_returns_json(client: TestClient):
    """Test health endpoint returns JSON."""
    response = client.get("/health")
    assert response.headers["content-type"] == "application/json"

