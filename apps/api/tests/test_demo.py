"""Test demo preset endpoint."""
import pytest
from fastapi.testclient import TestClient


def test_create_demo_preset(client: TestClient):
    """Test creating a demo preset."""
    response = client.post("/demo/preset")
    assert response.status_code == 201
    data = response.json()
    assert "case_id" in data
    assert "title" in data
    assert data["title"] == "Family Reunion (Demo)"
    
    # Verify the case was created and analyzed
    case_id = data["case_id"]
    outputs_response = client.get(f"/cases/{case_id}/outputs")
    assert outputs_response.status_code == 200
    outputs = outputs_response.json()
    assert len(outputs["checklist"]) > 0
    assert len(outputs["timeline"]) > 0
    assert len(outputs["risks"]) > 0

