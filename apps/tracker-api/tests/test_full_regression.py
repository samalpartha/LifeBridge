
import pytest
from datetime import date

def test_travel_history_crud(client):
    # Create
    res = client.post("/v1/history/travel", json={
        "country": "Japan",
        "entry_date": "2023-01-01",
        "purpose": "Tourism"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["country"] == "Japan"
    entry_id = data["id"]
    
    # Read
    res = client.get("/v1/history/travel")
    assert res.status_code == 200
    assert len(res.json()) >= 1
    
    # Delete
    res = client.delete(f"/v1/history/travel/{entry_id}")
    assert res.status_code == 200
    
    # Verify Delete
    res = client.delete(f"/v1/history/travel/{entry_id}")
    assert res.status_code == 404

def test_employment_history_crud(client):
    # Create
    res = client.post("/v1/history/employment", json={
        "employer": "Tech Corp",
        "title": "Engineer",
        "start_date": "2022-01-01",
        "city": "SF",
        "state": "CA"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["employer"] == "Tech Corp"
    entry_id = data["id"]
    
    # Read
    res = client.get("/v1/history/employment")
    assert res.status_code == 200
    
    # Delete
    client.delete(f"/v1/history/employment/{entry_id}")

def test_residence_history_crud(client):
    res = client.post("/v1/history/residence", json={
        "address": "123 Main St",
        "city": "New York",
        "country": "USA",
        "start_date": "2020-01-01"
    })
    assert res.status_code == 200
    entry_id = res.json()["id"]
    client.delete(f"/v1/history/residence/{entry_id}")

def test_tasks_crud(client):
    # Create
    res = client.post("/v1/tasks", json={
        "title": "Test Task",
        "priority": "high"
    })
    assert res.status_code == 200
    task_id = res.json()["id"]
    
    # Update
    res = client.put(f"/v1/tasks/{task_id}", json={
        "title": "Updated Task",
        "status": "completed"
    })
    assert res.status_code == 200
    assert res.json()["title"] == "Updated Task"
    
    # Delete
    client.delete(f"/v1/tasks/{task_id}")

def test_notes_crud(client):
    res = client.post("/v1/notes", json={
        "title": "My Note",
        "content": "Secret info",
        "note_date": "2025-01-01"
    })
    assert res.status_code == 200
    assert res.json()["title"] == "My Note"

def test_documents_crud(client):
    res = client.post("/v1/documents", json={
        "filename": "passport.pdf",
        "category": "ID"
    })
    assert res.status_code == 200
    assert res.json()["s3_key"] == "mock/passport.pdf"

def test_full_case_lifecycle(client):
    # 1. Create Case
    res = client.post("/v1/cases", json={
        "title": "Regression Case",
        "case_type": "I-485",
        "receipt_number": "MSC999999999"
    })
    assert res.status_code == 200
    case_id = res.json()["id"]
    
    # 2. Add Event
    res = client.post(f"/v1/cases/{case_id}/events", json={
        "title": "Filed",
        "event_date": "2025-01-01",
        "event_type": "milestone"
    })
    assert res.status_code == 200
    
    # 3. Get Events
    res = client.get(f"/v1/cases/{case_id}/events")
    assert res.status_code == 200
    assert len(res.json()) == 1
    
    # 4. Update Case
    res = client.put(f"/v1/cases/{case_id}", json={
        "title": "Regression Case Updated",
        "case_type": "I-485",
        "status": "Approved"
    })
    assert res.status_code == 200
    assert res.json()["status"] == "Approved"

