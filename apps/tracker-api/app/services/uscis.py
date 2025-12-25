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
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "max-age=0",
            "Connection": "keep-alive",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        
        data = {
            "appReceiptNum": receipt_number,
            "initCaseSearch": "CHECK STATUS"
        }

        try:
            async with httpx.AsyncClient(follow_redirects=True, verify=False) as client:
                resp = await client.post(self.BASE_URL, data=data, headers=headers, timeout=20.0)
                
                if resp.status_code != 200:
                    return {"status": "Error", "detail": f"USCIS returned error status: {resp.status_code}"}

                soup = BeautifulSoup(resp.text, "html.parser")
                
                # Try multiple possible selectors as USCIS frequently A/B tests or updates layouts
                title_tag = (
                    soup.find("div", class_="rows text-center") and soup.find("div", class_="rows text-center").find("h1")
                ) or soup.find("h1", class_="text-center") or soup.find("div", id="caseStatus")
                
                body_tag = (
                    soup.find("div", class_="rows text-center") and soup.find("div", class_="rows text-center").find("p")
                ) or (title_tag and title_tag.find_next("p"))

                if not title_tag:
                    # Search broadly for any header with status keywords
                    for h1 in soup.find_all(["h1", "h2"]):
                        text = h1.get_text().strip()
                        if text and any(word in text.lower() for word in ["case", "request", "notice", "approved", "received", "decision", "status"]):
                            title_tag = h1
                            body_tag = h1.find_next("p")
                            break
                
                if not title_tag:
                    if "Validation Error" in resp.text:
                         return {"status": "Invalid Receipt", "detail": "The receipt number is invalid."}
                    return {"status": "Unknown", "detail": "Status text not found in USCIS response."}

                return {
                    "status": title_tag.get_text(strip=True),
                    "detail": body_tag.get_text(strip=True) if body_tag else ""
                }

        except Exception as e:
            return {"status": "Error", "detail": str(e)}

uscis_service = USCISService()

async def get_uscis_service() -> USCISService:
    return uscis_service
