from pydantic import BaseModel
from typing import Optional

class KnowledgeTopic(BaseModel):
    id: str
    title: str
    description: str
    source_url: str

class KnowledgeContent(BaseModel):
    topic_id: str
    title: str
    content: str  # Markdown
    last_updated: Optional[str] = None
    commit_sha: Optional[str] = None
