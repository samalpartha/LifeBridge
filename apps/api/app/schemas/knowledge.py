
from pydantic import BaseModel


class KnowledgeTopic(BaseModel):
    id: str
    title: str
    description: str
    source_url: str

class KnowledgeContent(BaseModel):
    topic_id: str
    title: str
    content: str  # Markdown
    last_updated: str | None = None
    commit_sha: str | None = None
