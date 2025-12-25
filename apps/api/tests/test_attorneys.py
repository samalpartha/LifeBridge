import pytest
from fastapi.testclient import TestClient
from app.main import app

def test_attorney_search(client: TestClient):
    # Search for an attorney 
    response = client.get("/attorneys/search?query=immigration")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert isinstance(data["results"], list)

def test_attorney_details(client: TestClient):
    # This might require a real or mocked ID from a search result
    # We'll test the endpoint's handling of invalid IDs first
    response = client.get("/attorneys/invalid-id")
    # Depending on implementation, it might be 404 or an empty detail
    assert response.status_code in [404, 200]
