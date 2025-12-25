
import pytest
from app.services.uscis import USCISService

@pytest.mark.asyncio
async def test_uscis_session_init_error(mocker):
    service = USCISService()
    
    # Mock clean context
    mock_client = mocker.AsyncMock()
    # First get raises exception
    mock_client.__aenter__.return_value.get.side_effect = Exception("Cookie fail")
    # Second post returns success
    mock_resp = mocker.Mock()
    mock_resp.status_code = 200
    mock_resp.text = "<html><body><div class='rows text-center'><h1>Approved</h1><p>Done</p></div></body></html>"
    mock_client.__aenter__.return_value.post.return_value = mock_resp
    
    mocker.patch("httpx.AsyncClient", return_value=mock_client)
    
    res = await service.check_status("IOE_VALID")
    assert res["status"] == "Approved"

@pytest.mark.asyncio
async def test_uscis_http_error(mocker):
    service = USCISService()
    mock_client = mocker.AsyncMock()
    mock_resp = mocker.Mock()
    mock_resp.status_code = 503 # Service Unavailable
    mock_client.__aenter__.return_value.post.return_value = mock_resp
    # .get works fine
    mock_client.__aenter__.return_value.get.return_value = mocker.Mock()
    
    mocker.patch("httpx.AsyncClient", return_value=mock_client)
    
    res = await service.check_status("IOE_ERROR")
    assert res["status"] == "Error"
    assert "503" in res["detail"]

@pytest.mark.asyncio
async def test_uscis_validation_error(mocker):
    service = USCISService()
    text = "<html><body>Validation Error: invalid format</body></html>"
    
    mock_client = mocker.AsyncMock()
    mock_client.__aenter__.return_value.post.return_value.status_code = 200
    mock_client.__aenter__.return_value.post.return_value.text = text
    mocker.patch("httpx.AsyncClient", return_value=mock_client)
    
    res = await service.check_status("BAD_FORMAT")
    assert res["status"] == "Invalid Receipt"

@pytest.mark.asyncio
async def test_uscis_access_denied(mocker):
    service = USCISService()
    text = "<html><body><h1>Access Denied</h1><p>You don't have permission...</p></body></html>"
    
    mock_client = mocker.AsyncMock()
    mock_client.__aenter__.return_value.post.return_value.status_code = 200
    mock_client.__aenter__.return_value.post.return_value.text = text
    mocker.patch("httpx.AsyncClient", return_value=mock_client)
    
    res = await service.check_status("DENIED")
    assert res["status"] == "Access Denied"

@pytest.mark.asyncio
async def test_uscis_no_empty_receipt():
    service = USCISService()
    res = await service.check_status("")
    assert res["status"] == "Error"

@pytest.mark.asyncio
async def test_uscis_fallback_finding(mocker):
    # Tests the "Final fallback: generic status hunt"
    service = USCISService()
    text = "<html><body><div><h2>Case Was Received</h2><p>Details here</p></div></body></html>"
    
    mock_client = mocker.AsyncMock()
    mock_client.__aenter__.return_value.post.return_value.status_code = 200
    mock_client.__aenter__.return_value.post.return_value.text = text
    mocker.patch("httpx.AsyncClient", return_value=mock_client)
    
    res = await service.check_status("FALLBACK")
    assert res["status"] == "Case Was Received"
