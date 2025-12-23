"""Test case endpoints."""
import pytest
from fastapi.testclient import TestClient


def test_create_case(client: TestClient):
    """Test creating a new case."""
    response = client.post(
        "/cases",
        json={"title": "Test Case", "scenario": "family_reunion"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Case"
    assert data["scenario"] == "family_reunion"
    assert "id" in data


def test_get_case(client: TestClient):
    """Test retrieving a case."""
    # Create a case first
    create_response = client.post(
        "/cases",
        json={"title": "Test Case", "scenario": "family_reunion"},
    )
    case_id = create_response.json()["id"]
    
    # Get the case
    response = client.get(f"/cases/{case_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == case_id
    assert data["title"] == "Test Case"


def test_get_nonexistent_case(client: TestClient):
    """Test getting a nonexistent case returns 404."""
    response = client.get("/cases/nonexistent-id")
    assert response.status_code == 404


def test_list_cases(client: TestClient):
    """Test listing cases."""
    # Create a few cases
    for i in range(3):
        client.post(
            "/cases",
            json={"title": f"Test Case {i}", "scenario": "family_reunion"},
        )
    
    # List cases
    response = client.get("/cases")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 3


def test_delete_case(client: TestClient):
    """Test deleting a case."""
    # Create a case
    create_response = client.post(
        "/cases",
        json={"title": "Test Case", "scenario": "family_reunion"},
    )
    case_id = create_response.json()["id"]
    
    # Delete the case
    response = client.delete(f"/cases/{case_id}")
    assert response.status_code == 204
    
    # Verify it's gone
    get_response = client.get(f"/cases/{case_id}")
    assert get_response.status_code == 404


def test_case_statistics(client: TestClient):
    """Test getting case statistics."""
    # Create a case
    create_response = client.post(
        "/cases",
        json={"title": "Test Case", "scenario": "family_reunion"},
    )
    case_id = create_response.json()["id"]
    
    # Get statistics
    response = client.get(f"/cases/{case_id}/statistics")
    assert response.status_code == 200
    data = response.json()
    assert "documents" in data
    assert "chunks" in data
    assert "checklist_items" in data


def test_search_cases(client: TestClient):
    """Test searching cases."""
    # Create cases with different titles
    client.post(
        "/cases",
        json={"title": "Family Visit", "scenario": "family_reunion"},
    )
    client.post(
        "/cases",
        json={"title": "Job Application", "scenario": "job_onboarding"},
    )
    
    # Search for "family"
    response = client.get("/search?q=family")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert "Family" in data[0]["title"]

