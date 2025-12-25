import pytest
from datetime import date

def test_create_case(client):
    response = client.post("/v1/cases", json={
        "title": "Test Case",
        "case_type": "I-130",
        "receipt_number": "IOE123",
        "status": "Pending"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Case"
    assert "id" in data

def test_get_cases(client):
    # Ensure at least one case exists
    client.post("/v1/cases", json={"title": "Case 1", "case_type": "I-140"})
    
    response = client.get("/v1/cases")
    assert response.status_code == 200
    assert len(response.json()) >= 1

def test_check_status_mock_flow(client, db_session):
    # Create the demo case first
    from app.models import ImmigrationCase
    demo_case = ImmigrationCase(
        title="Demo Case",
        receipt_number="IOE0929519272",
        status="Initial"
    )
    db_session.add(demo_case)
    db_session.commit()
    db_session.refresh(demo_case)
    
    case_id = demo_case.id
    
    response = client.post(f"/v1/cases/{case_id}/status")
    assert response.status_code == 200
    data = response.json()
    assert data["uscis_status"]["status"] == "Case Was Received and A Receipt Notice Was Sent"
    
    # Verify DB update
    db_session.refresh(demo_case)
    assert demo_case.status == "Case Was Received and A Receipt Notice Was Sent"

def test_seed_demo_data(client):
    response = client.post("/v1/demo/seed")
    assert response.status_code == 200
    assert "case_id" in response.json()
