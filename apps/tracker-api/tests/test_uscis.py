import pytest
from app.services.uscis import USCISService

@pytest.mark.asyncio
async def test_uscis_mock_responses():
    service = USCISService()
    
    # Test Demo Receipt 1
    res1 = await service.check_status("IOE0929519272")
    assert res1["status"] == "Case Was Received and A Receipt Notice Was Sent"
    assert "demo" in res1["detail"].lower()
    
    # Test Demo Receipt 2
    res2 = await service.check_status("IOE0987654321")
    assert res2["status"] == "Case Was Received"
    assert "demo" in res2["detail"].lower()

@pytest.mark.asyncio
async def test_uscis_invalid_receipt():
    service = USCISService()
    # No receipt
    res = await service.check_status("")
    assert res["status"] == "Error"
    assert "no receipt" in res["detail"].lower()

@pytest.mark.asyncio
async def test_uscis_parsing_fallback(mocker):
    service = USCISService()
    
    # Mock httpx response to test parsing logic without hitting real USCIS
    mock_resp = mocker.Mock()
    mock_resp.status_code = 200
    mock_resp.text = """
        <html>
            <body>
                <h1 class="text-center">Case Was Approved</h1>
                <p>We approved your case...</p>
            </body>
        </html>
    """
    
    # Mocking the internal httpx client post call
    mocker.patch("httpx.AsyncClient.post", return_value=mock_resp)
    # Mocking the landing page get call
    mocker.patch("httpx.AsyncClient.get", return_value=mock_resp)
    
    res = await service.check_status("MSC1234567890")
    assert res["status"] == "Case Was Approved"
    assert "approved" in res["detail"].lower()
