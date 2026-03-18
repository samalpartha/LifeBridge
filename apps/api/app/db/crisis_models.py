"""Crisis-specific database models for LifeBridge Crisis Corridor.

For DigitalOcean Gradient AI Hackathon.
"""
from __future__ import annotations

import datetime as dt

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .models import Base


class SafeHaven(Base):
    """Safe haven locations (shelters, hospitals, embassies, etc.)."""
    __tablename__ = "safe_havens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)

    name: Mapped[str] = mapped_column(String(200))
    type: Mapped[str] = mapped_column(String(64))  # shelter, hospital, embassy, aid_station, water_point
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    address: Mapped[str] = mapped_column(Text, default="")

    services: Mapped[str] = mapped_column(JSON, default="[]")  # JSON array of services
    hours: Mapped[str] = mapped_column(String(200), default="")
    intake_rules: Mapped[str] = mapped_column(Text, default="")

    capacity_status: Mapped[str] = mapped_column(String(32), default="unknown")  # available, limited, full, unknown
    verification_tier: Mapped[str] = mapped_column(String(32), default="community")  # official, verified, community
    last_verified_at: Mapped[dt.datetime | None] = mapped_column(DateTime, nullable=True)

    contact_info: Mapped[str] = mapped_column(String(200), default="")
    notes: Mapped[str] = mapped_column(Text, default="")


class HavenUpdate(Base):
    """Status updates for safe havens."""
    __tablename__ = "haven_updates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    haven_id: Mapped[str] = mapped_column(String(36), ForeignKey("safe_havens.id"), index=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)

    status: Mapped[str] = mapped_column(String(64))
    note: Mapped[str] = mapped_column(Text)
    reporter_role: Mapped[str] = mapped_column(String(64), default="community")
    evidence_url: Mapped[str] = mapped_column(String(512), default="")


class CheckIn(Base):
    """Safety check-ins from users."""
    __tablename__ = "check_ins"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_code: Mapped[str] = mapped_column(String(64), index=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)

    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(32))  # safe, moving, need_help
    battery_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    message: Mapped[str] = mapped_column(Text, default="")


class HelpRequest(Base):
    """Help requests from people in need."""
    __tablename__ = "help_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    requester_code: Mapped[str] = mapped_column(String(64), index=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)

    category: Mapped[str] = mapped_column(String(64))  # transport, medical, food, water, shelter, charging
    details: Mapped[str] = mapped_column(Text)
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    urgency: Mapped[str] = mapped_column(String(32))  # low, medium, high, critical

    fulfilled_at: Mapped[dt.datetime | None] = mapped_column(DateTime, nullable=True)
    matched_offer_id: Mapped[str | None] = mapped_column(String(36), nullable=True)


class HelpOffer(Base):
    """Help offers from people who can assist."""
    __tablename__ = "help_offers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    offerer_code: Mapped[str] = mapped_column(String(64), index=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)

    category: Mapped[str] = mapped_column(String(64))
    details: Mapped[str] = mapped_column(Text)
    seats: Mapped[int | None] = mapped_column(Integer, nullable=True)
    radius_km: Mapped[float] = mapped_column(Float, default=10.0)

    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    valid_until: Mapped[dt.datetime | None] = mapped_column(DateTime, nullable=True)


class ReunificationBeacon(Base):
    """Family reunification beacons."""
    __tablename__ = "reunification_beacons"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    beacon_code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)
    last_updated_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)

    family_name_hint: Mapped[str] = mapped_column(String(100))  # First 2 letters only
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(32))  # safe, moving, need_help
    message: Mapped[str] = mapped_column(Text, default="")


class AgentTrace(Base):
    """Gradient AI agent execution traces for transparency."""
    __tablename__ = "agent_traces"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)

    trace_id: Mapped[str] = mapped_column(String(100), index=True)
    agent_name: Mapped[str] = mapped_column(String(100))
    query: Mapped[str] = mapped_column(Text)
    response: Mapped[str] = mapped_column(Text)

    tool_calls: Mapped[str] = mapped_column(JSON, default="[]")
    sources_used: Mapped[str] = mapped_column(JSON, default="[]")
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
