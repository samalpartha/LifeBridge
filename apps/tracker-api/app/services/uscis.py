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
            "Accept-Encoding": "gzip, deflate, br",
            "Origin": "https://egov.uscis.gov",
            "Referer": "https://egov.uscis.gov/casestatus/landing.do",
            "Connection": "keep-alive",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        
        data = {
            "appReceiptNum": receipt_number,
            "initCaseSearch": "CHECK STATUS"
        }

        try:
            # Use a persistent client to handle cookies (USCIS often requires a session)
            async with httpx.AsyncClient(follow_redirects=True, verify=False, timeout=30.0) as client:
                # 1. First visit the landing page to get a session cookie
                try:
                    await client.get("https://egov.uscis.gov/casestatus/landing.do", headers=headers)
                except Exception as e:
                    # Log but continue, sometimes cookies aren't strictly required
                    print(f"USCIS Session Init Warning: {e}")

                # 2. Submit the status check
                resp = await client.post(self.BASE_URL, data=data, headers=headers)
                
                if resp.status_code != 200:
                    return {
                        "status": "Error", 
                        "detail": f"USCIS Communication Error (HTTP {resp.status_code}). This usually means their server is busy or blocking the cloud provider's IP."
                    }

                # 3. Parse result
                soup = BeautifulSoup(resp.text, "html.parser")
                
                # Check for "Validation Error" (Invalid Receipt)
                if "Validation Error" in resp.text:
                    return {"status": "Invalid Receipt", "detail": "USCIS says this receipt number is invalid. Please check for typos."}

                # Find status using multiple common patterns
                title_tag = soup.find("h1", class_="text-center") or \
                            soup.find("div", class_="rows text-center") and soup.find("div", class_="rows text-center").find("h1") or \
                            soup.find("div", id="caseStatus")

                body_tag = (title_tag and title_tag.find_next("p")) or \
                           (soup.find("div", class_="rows text-center") and soup.find("div", class_="rows text-center").find("p"))

                if not title_tag:
                    # Final fallback: generic status hunt
                    for h1 in soup.find_all(["h1", "h2"]):
                        text = h1.get_text().strip()
                        if text and any(word in text.lower() for word in ["case", "status", "received", "approved", "notice"]):
                            title_tag = h1
                            body_tag = h1.find_next("p")
                            break
                
                if not title_tag:
                    # If we got a 200 but no status, it might be a CAPTCHA or "Too many requests" page
                    if "Access Denied" in resp.text or "unusual traffic" in resp.text.lower():
                        return {"status": "Access Denied", "detail": "USCIS is blocking this request due to automated traffic protections. Please try again later or from a different network."}
                    return {"status": "Unknown", "detail": "Could not find status text. The USCIS website format may have changed."}

                return {
                    "status": title_tag.get_text(strip=True),
                    "detail": body_tag.get_text(strip=True) if body_tag else ""
                }

        except Exception as e:
            return {"status": "Error", "detail": f"Connection Error: {str(e)}"}

uscis_service = USCISService()

async def get_uscis_service() -> USCISService:
    return uscis_service
