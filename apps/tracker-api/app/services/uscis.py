import httpx
from bs4 import BeautifulSoup
from typing import Dict, Optional

class USCISService:
    BASE_URL = "https://egov.uscis.gov/casestatus/mycasestatus.do"
    
    async def check_status(self, receipt_number: str) -> Dict[str, str]:
        """
        Scrapes USCIS Case Status Online for a given receipt number.
        Returns a dict with 'status', 'title', 'detail'.
        """
        if not receipt_number:
            return {"status": "Error", "detail": "No receipt number provided"}

        # MOCK FOR DEMO
        if receipt_number == "IOE0987654321":
            return {
                "status": "Case Was Received And A Receipt Notice Was Sent",
                "detail": "On December 25, 2025, we received your Form I-130, Petition for Alien Relative, Receipt Number IOE0987654321, and sent you the receipt notice that describes how we will process your case. Please follow the instructions in the notice. If you do not receive your receipt notice by January 24, 2026, contact the USCIS Contact Center at www.uscis.gov/contactcenter. If you move, go to www.uscis.gov/addresschange to give us your new mailing address."
            }

        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        data = {
            "appReceiptNum": receipt_number,
            "initCaseSearch": "CHECK STATUS"
        }

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(self.BASE_URL, data=data, headers=headers, timeout=10.0)
                
                if resp.status_code != 200:
                    return {"status": "Error", "detail": "Failed to reach USCIS servers"}

                soup = BeautifulSoup(resp.text, "html.parser")
                
                # USCIS structure usually puts the status in a specific div
                # The structure is often: <div class="rows text-center"> <h1>Case Was Received</h1> <p>On ...</p> </div>
                
                status_header = soup.find("div", class_="rows text-center")
                
                if not status_header:
                    # Check for error message
                    error_msg = soup.find("div", id="formErrorMessages")
                    if error_msg and "Validation Error" in error_msg.text:
                        return {"status": "Invalid Receipt", "detail": "The receipt number is invalid."}
                    return {"status": "Unknown", "detail": "Could not parse status from USCIS response"}

                title = status_header.find("h1")
                body = status_header.find("p")
                
                return {
                    "status": title.get_text(strip=True) if title else "Status Found",
                    "detail": body.get_text(strip=True) if body else ""
                }

        except Exception as e:
            return {"status": "Error", "detail": str(e)}

uscis_service = USCISService()

async def get_uscis_service() -> USCISService:
    return uscis_service
