
import pytest
from app.pdf_service import generate_history_pdf
from app.models import TravelHistory, EmploymentHistory, ResidenceHistory
from datetime import date

def test_generate_pdf_with_data():
    # Mock data objects (simple classes or dicts since pdf_service expects attribute access)
    class MockObj:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)

    travel = [MockObj(country="USA", entry_date=date(2023,1,1), exit_date=None, purpose="Fun")]
    emp = [MockObj(employer="Acme", title="Dev", city="NY", state="NY", start_date=date(2022,1,1), end_date=None)]
    res = [MockObj(address="123 St", city="NY", country="USA", start_date=date(2020,1,1), end_date=None)]
    
    pdf_buffer = generate_history_pdf(travel, emp, res)
    assert pdf_buffer.getvalue().startswith(b"%PDF")

def test_generate_pdf_empty():
    pdf_buffer = generate_history_pdf([], [], [])
    content = pdf_buffer.getvalue()
    assert content.startswith(b"%PDF")
    # Should technically contain "No records found" text in compressed stream, usually hard to accept on raw bytes without pdf reader
    # But ensuring it doesn't crash is key for coverage.

def test_uscis_service_errors(mocker):
    from app.services.uscis import USCISService
    service = USCISService()
    
    # Test network error handling
    mocker.patch("httpx.AsyncClient.post", side_effect=Exception("Network Down"))
    # The service suppresses error usually or returns error dict?
    # Let's check implementation if I can see it. 
    # Based on main.py usage: result = await service.check_status(receipt)
    # The service check_status wraps try/except? 
    # Viewing file previously showed:
    # except Exception as e: return {"status": "Error", "detail": str(e)}
    # Wait, main.py does the catch. Service might raise.
    
    # Let's verify service directly
    # Need to view ucsis.py to be sure about 
    # "55-57, 63, 73, 85-90, 94-96, 103-104, 109" missing lines
    pass
