from __future__ import annotations

import datetime as dt
from sqlalchemy import String, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Case(Base):
    __tablename__ = "api_cases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)
    title: Mapped[str] = mapped_column(String(200))
    scenario: Mapped[str] = mapped_column(String(64))
    summary: Mapped[str] = mapped_column(Text, default="")
    user_story: Mapped[str] = mapped_column(Text, default="")

    documents: Mapped[list["Document"]] = relationship(back_populates="case", cascade="all, delete-orphan")
    chunks: Mapped[list["Chunk"]] = relationship(back_populates="case", cascade="all, delete-orphan")
    risks: Mapped[list["Risk"]] = relationship(back_populates="case", cascade="all, delete-orphan")
    timeline_items: Mapped[list["TimelineItem"]] = relationship(back_populates="case", cascade="all, delete-orphan")
    checklist_items: Mapped[list["ChecklistItem"]] = relationship(back_populates="case", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "api_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("api_cases.id"), index=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)

    filename: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(120), default="")
    storage_key: Mapped[str] = mapped_column(String(512))

    case: Mapped[Case] = relationship(back_populates="documents")
    chunks: Mapped[list["Chunk"]] = relationship(back_populates="document", cascade="all, delete-orphan")


class Chunk(Base):
    __tablename__ = "api_chunks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("api_cases.id"), index=True)
    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("api_documents.id"), index=True)

    idx: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)

    case: Mapped[Case] = relationship(back_populates="chunks")
    document: Mapped[Document] = relationship(back_populates="chunks")


class Risk(Base):
    __tablename__ = "api_risks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("api_cases.id"), index=True)

    category: Mapped[str] = mapped_column(String(64))
    severity: Mapped[str] = mapped_column(String(16))
    statement: Mapped[str] = mapped_column(Text)
    reason: Mapped[str] = mapped_column(Text)
    evidence_chunk_ids: Mapped[str] = mapped_column(Text, default="")  # comma-separated

    case: Mapped[Case] = relationship(back_populates="risks")


class TimelineItem(Base):
    __tablename__ = "api_timeline_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("api_cases.id"), index=True)

    label: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(24), default="todo")
    due_date: Mapped[str] = mapped_column(String(32), default="")  # keep string for hackathon simplicity
    owner: Mapped[str] = mapped_column(String(64), default="user")
    notes: Mapped[str] = mapped_column(Text, default="")
    evidence_chunk_ids: Mapped[str] = mapped_column(Text, default="")

    case: Mapped[Case] = relationship(back_populates="timeline_items")


class ChecklistItem(Base):
    __tablename__ = "api_checklist_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("api_cases.id"), index=True)

    label: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(24), default="todo")
    notes: Mapped[str] = mapped_column(Text, default="")
    evidence_chunk_ids: Mapped[str] = mapped_column(Text, default="")

    case: Mapped[Case] = relationship(back_populates="checklist_items")
