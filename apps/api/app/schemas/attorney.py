from typing import List, Optional
from pydantic import BaseModel

class AttorneyBase(BaseModel):
    name: str
    firm: Optional[str] = None
    practice_area: Optional[str] = None
    location_text: str
    image: Optional[str] = None
    bio: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    source: str = "CourtListener"

class AttorneyOut(AttorneyBase):
    id: str
    rating: float
    reviews: int
    confidence_score: float

class AttorneySearchResponse(BaseModel):
    results: List[AttorneyOut]
    location_city: Optional[str] = None
    location_state: Optional[str] = None
