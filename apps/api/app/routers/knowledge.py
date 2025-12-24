from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from ..schemas.knowledge import KnowledgeTopic, KnowledgeContent
from ..services.knowledge import KnowledgeService, get_knowledge_service

router = APIRouter(prefix="/knowledge", tags=["knowledge"])

@router.get("/topics", response_model=List[KnowledgeTopic])
async def get_topics(
    service: KnowledgeService = Depends(get_knowledge_service)
):
    """Get list of available knowledge base topics."""
    return await service.get_topics()

@router.get("/topics/{topic_id}", response_model=KnowledgeContent)
async def get_topic_content(
    topic_id: str,
    service: KnowledgeService = Depends(get_knowledge_service)
):
    """Get markdown content for a specific topic."""
    content = await service.get_content(topic_id)
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Topic {topic_id} not found"
        )
    return content
