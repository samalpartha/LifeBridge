
import pytest
from pydantic import ValidationError
from app.main import (
    TravelEntry, EmploymentEntry, ResidenceEntry, 
    TaskEntry, NoteEntry, CaseEntry, DocumentEntry
)

def test_travel_entry_schema():
    # Valid
    valid = TravelEntry(country="USA", entry_date="2023-01-01", purpose="Business")
    assert valid.country == "USA"
    
    # Invalid Date
    with pytest.raises(ValidationError):
        TravelEntry(country="USA", entry_date="not-a-date", purpose="Business")
        
    # Missing Required
    with pytest.raises(ValidationError):
        TravelEntry(country="USA") # Missing entry_date, purpose

def test_case_entry_schema():
    # Valid
    valid = CaseEntry(title="T", case_type="C")
    assert valid.status == "Open" # Default
    
    # Invalid Types
    with pytest.raises(ValidationError):
        CaseEntry(title=123, case_type="C") # Title should be str (Pydantic might coerce, but usually safe)
        
    # Check optional fields behavior
    obj = CaseEntry(title="T", case_type="C", receipt_number=None)
    assert obj.receipt_number is None

def test_task_entry_defaults():
    task = TaskEntry(title="Win Hackathon")
    assert task.status == "pending"
    assert task.priority == "medium"
    
    # Validation of Enums (strictly speaking str in this simple model, but good to check)
    # The current model uses str, so we just check it accepts strings.
    
def test_api_schema_validation(client):
    """Ensure API actually rejects bad schemas with 422"""
    # 1. Missing fields
    res = client.post("/v1/history/travel", json={"country": "Nowhere"})
    assert res.status_code == 422
    
    # 2. Wrong types
    res = client.post("/v1/history/travel", json={
        "country": "Nowhere", 
        "entry_date": "invalid-date",
        "purpose": "Testing"
    })
    assert res.status_code == 422

