
from pydantic import BaseModel


class AttorneyBase(BaseModel):
    name: str
    firm: str | None = None
    practice_area: str | None = None
    location_text: str
    image: str | None = None
    bio: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    source: str = "CourtListener"

class AttorneyOut(AttorneyBase):
    id: str
    rating: float
    reviews: int
    confidence_score: float

class AttorneySearchResponse(BaseModel):
    results: list[AttorneyOut]
    location_city: str | None = None
    location_state: str | None = None
