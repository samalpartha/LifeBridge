import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_generate_pdf_endpoint():
    # Attempt to generate a PDF for the timeline
    response = client.post("/render", json={
        "template_id": "case_timeline",
        "data": {
            "case_title": "Test Case",
            "user_name": "John Doe",
            "events": [
                {"date": "2024-01-01", "title": "Filing", "description": "Initial filing"},
                {"date": "2024-02-01", "title": "Biometrics", "description": "Fingerprints taken"}
            ]
        }
    })
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 0

def test_invalid_data():
    # Test with missing required fields
    response = client.post("/render", json={
        "template_id": "case_timeline"
    })
    assert response.status_code == 422 # Validation Error (missing 'data')
