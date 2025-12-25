from fastapi import APIRouter, Query, HTTPException
from ..schemas.attorney import AttorneySearchResponse
from ..services.attorneys import attorney_service

router = APIRouter(prefix="/attorneys", tags=["attorneys"])

@router.get("/search", response_model=AttorneySearchResponse)
async def search_attorneys(
    zip_code: str = Query(None, alias="zip", min_length=5, description="5-digit ZIP code"),
    query: str = Query(None, description="Name or firm name to search")
):
    """
    Search for attorneys based on ZIP code OR name/firm.
    Uses AI generation to find relevant legal professionals.
    """
    if not zip_code and not query:
         raise HTTPException(status_code=400, detail="Must provide either ZIP code or search query")
    
    return await attorney_service.search(zip_code=zip_code, query=query)
