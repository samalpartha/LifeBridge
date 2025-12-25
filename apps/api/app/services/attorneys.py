import httpx
import random
from typing import List, Optional
from ..schemas.attorney import AttorneyOut, AttorneySearchResponse
from ..utils.logger import get_logger

logger = get_logger(__name__)

class AttorneyService:
    ZIP_API = "https://api.zippopotam.us/us/{zip}"
    CL_API = "https://www.courtlistener.com/api/rest/v3/people/"

    async def search(self, zip_code: Optional[str] = None, query: Optional[str] = None) -> AttorneySearchResponse:
        async with httpx.AsyncClient() as client:
            location_context = ""
            city = "Unknown City"
            state = "Unknown State"

            # 1. Resolve Location from ZIP if provided
            if zip_code:
                try:
                    zip_resp = await client.get(self.ZIP_API.format(zip=zip_code))
                    if zip_resp.status_code == 200:
                        zip_data = zip_resp.json()
                        place = zip_data.get("places", [{}])[0]
                        city = place.get("place name")
                        state = place.get("state abbreviation")
                        location_context = f"in {city}, {state}"
                except:
                    pass
            
            # If no zip and no query, return empty
            if not zip_code and not query:
                return AttorneySearchResponse(results=[])

            # 2. Use Gemini AI Generation
            import google.generativeai as genai
            import os
            import json
            
            api_key = os.getenv("GOOGLE_API_KEY")
            results = []

            if not api_key:
                logger.warning("No GOOGLE_API_KEY found, falling back to simulation.")
                results = self._get_fallback_attorneys(city, state)
            else:
                try:
                    genai.configure(api_key=api_key)
                    # Use a model that exists - trying flash-latest as established
                    model = genai.GenerativeModel('gemini-flash-latest')
                    
                    search_term = f"'{query}'" if query else "immigration attorneys"
                    loc = location_context if location_context else "the US"
                    
                    prompt = f"""
                    You are a helpful legal assistant.
                    Generate a JSON list of 5 real or realistic immigration attorneys/firms matching: {search_term} {loc}.
                    Include realistic contact details (phone, email, website) and a full address.
                    Format:
                    [
                        {{
                            "name": "Attorney Name",
                            "firm": "Firm Name",
                            "practice_area": "Specific Area (e.g. Deportation, Visa)",
                            "bio": "Short 1 sentence bio",
                            "location": "{city if zip_code else 'City'}, {state if zip_code else 'State'}",
                            "email": "contact@example.com",
                            "phone": "+1 (555) ...",
                            "website": "https://...",
                            "address": "Full Street Address"
                        }}
                    ]
                    Return ONLY raw JSON. No markdown formatting.
                    """
                    
                    logger.info(f"Generating attorneys with Gemini for query='{query}' loc='{location_context}'")
                    response = model.generate_content(prompt)
                    text = response.text.strip()
                    if text.startswith("```json"):
                        text = text[7:]
                    if text.endswith("```"):
                        text = text[:-3]
                        
                    ai_data = json.loads(text)
                    
                    for idx, item in enumerate(ai_data):
                        name_candidate = item.get("name", "Unknown Attorney")
                        results.append(AttorneyOut(
                            id=f"ai-{idx}",
                            name=name_candidate,
                            firm=item.get("firm", "Private Practice"),
                            location_text=item.get("location", f"{city}, {state}"),
                            practice_area=item.get("practice_area", "Immigration Law"),
                            image=f"https://api.dicebear.com/7.x/initials/svg?seed={name_candidate}",
                            rating=4.7 + (random.random() * 0.3),
                            reviews=random.randint(20, 150),
                            confidence_score=0.95,
                            source="Create with Gemini AI",
                            bio=item.get("bio", "Experienced immigration attorney."),
                            email=item.get("email"),
                            phone=item.get("phone"),
                            website=item.get("website"),
                            address=item.get("address")
                        ))
                except Exception as ai_err:
                    logger.error(f"Gemini Generation failed: {ai_err}")
                    # Fallthrough to fallback logic below if empty

            # 3. Fallback
            if not results:
                results = self._get_fallback_attorneys(city, state)

            return AttorneySearchResponse(
                results=results, 
                location_city=city, 
                location_state=state
            )

    def _get_fallback_attorneys(self, city: str, state: str) -> List[AttorneyOut]:
        # Generate varied mock data to look realistic
        return [
            AttorneyOut(
                id="mock-1",
                name="Sarah Jenkins",
                firm="Global Immigration Group",
                location_text=f"{city}, {state}",
                practice_area="Immigration Law",
                image="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
                rating=4.9,
                reviews=124,
                confidence_score=0.98,
                source="Simulated Directory",
                email="sarah@example.com",
                phone="+1 (555) 123-4567"
            ),
            AttorneyOut(
                id="mock-2",
                name="David Chen",
                firm="Chen & Associates",
                location_text=f"{city}, {state}",
                practice_area="Family & Visa Law",
                image="https://api.dicebear.com/7.x/avataaars/svg?seed=David",
                rating=4.7,
                reviews=89,
                confidence_score=0.95,
                source="Simulated Directory",
                 email="david@example.com",
                phone="+1 (555) 234-5678"
            ),
            AttorneyOut(
                id="mock-3",
                name="Maria Rodriguez",
                firm="Liberty Legal Services",
                location_text=f"{city}, {state}",
                practice_area="Deportation Defense",
                image="https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
                rating=4.8,
                reviews=210,
                confidence_score=0.97,
                source="Simulated Directory",
                 email="maria@example.com",
                phone="+1 (555) 345-6789"
            ),
            AttorneyOut(
                id="mock-4",
                name="James Wilson",
                firm="Wilson Immigration Law",
                location_text=f"{city}, {state}",
                practice_area="Business Immigration",
                image="https://api.dicebear.com/7.x/avataaars/svg?seed=James",
                rating=4.6,
                reviews=45,
                confidence_score=0.92,
                source="Simulated Directory",
                 email="james@example.com",
                phone="+1 (555) 456-7890"
            ),
              AttorneyOut(
                id="mock-5",
                name="Priya Patel",
                firm="Patel Legal Group",
                location_text=f"{city}, {state}",
                practice_area="Asylum & Refugee Status",
                image="https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
                rating=4.9,
                reviews=156,
                confidence_score=0.96,
                source="Simulated Directory",
                 email="priya@example.com",
                phone="+1 (555) 567-8901"
            )
        ]

attorney_service = AttorneyService()
