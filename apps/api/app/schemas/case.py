from __future__ import annotations

from pydantic import BaseModel, Field


class CaseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    scenario: str = Field(min_length=1, max_length=64)


class CaseOut(BaseModel):
    id: str
    title: str
    scenario: str
    summary: str
    user_story: str = ""


class ChecklistItemOut(BaseModel):
    id: str
    label: str
    status: str
    notes: str
    evidence_chunk_ids: list[str]


class TimelineItemOut(BaseModel):
    id: str
    label: str
    status: str
    due_date: str
    owner: str
    notes: str
    evidence_chunk_ids: list[str]


class RiskOut(BaseModel):
    id: str
    category: str
    severity: str
    statement: str
    reason: str
    evidence_chunk_ids: list[str]


class ChunkOut(BaseModel):
    id: str
    document_id: str
    idx: int
    text: str


class CaseUpdateStory(BaseModel):
    user_story: str


class DocumentOut(BaseModel):
    id: str
    case_id: str
    filename: str
    content_type: str
    created_at: str
