"""Crisis-specific API endpoints for LifeBridge Crisis Corridor.

For DigitalOcean Gradient AI Hackathon.
"""
from __future__ import annotations

import datetime as dt
import json
import time
import uuid
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from geopy.distance import geodesic
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..db.crisis_models import (
    AgentTrace,
    CheckIn,
    HavenUpdate,
    HelpOffer,
    HelpRequest,
    ReunificationBeacon,
    SafeHaven,
)
from ..db.session import SessionLocal
from ..services.crisis_routing import generate_route_options
from ..services.gradient_ai import gradient_service
from ..utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/crisis", tags=["crisis"])
_RATE_LIMIT_BUCKETS: dict[str, deque[float]] = defaultdict(deque)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _normalize_services(raw_services: object) -> list[str]:
    """Parse services payload safely from DB."""
    if raw_services is None:
        return []
    if isinstance(raw_services, list):
        return [str(s) for s in raw_services]
    if isinstance(raw_services, str):
        try:
            parsed = json.loads(raw_services)
            if isinstance(parsed, list):
                return [str(s) for s in parsed]
        except json.JSONDecodeError:
            pass
        return [s.strip() for s in raw_services.split(",") if s.strip()]
    return []


def _apply_rate_limit(bucket_key: str, *, limit: int, window_seconds: int = 60) -> None:
    now = time.time()
    bucket = _RATE_LIMIT_BUCKETS[bucket_key]
    while bucket and now - bucket[0] > window_seconds:
        bucket.popleft()
    if len(bucket) >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please retry shortly.",
        )
    bucket.append(now)


def _client_rate_key(request: Request, scope: str, identity: str | None = None) -> str:
    ip = request.client.host if request.client else "unknown"
    suffix = identity or "anon"
    return f"{scope}:{ip}:{suffix}"


# Pydantic schemas
class SafeHavenCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    type: str = Field(pattern="^(shelter|hospital|embassy|aid_station|water_point)$")
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    address: str = ""
    services: list[str] = []
    hours: str = ""
    intake_rules: str = ""


class SafeHavenOut(BaseModel):
    id: str
    name: str
    type: str
    lat: float
    lon: float
    address: str
    services: list[str]
    hours: str
    capacity_status: str
    verification_tier: str
    last_verified_at: str | None
    distance_km: float | None = None


class HavenUpdateCreate(BaseModel):
    status: str = Field(min_length=2, max_length=64)
    note: str = Field(min_length=1, max_length=1000)
    reporter_role: str = Field(default="community", min_length=2, max_length=64)
    evidence_url: str = ""


class RouteRequest(BaseModel):
    start_lat: float = Field(ge=-90, le=90)
    start_lon: float = Field(ge=-180, le=180)
    end_lat: float = Field(ge=-90, le=90)
    end_lon: float = Field(ge=-180, le=180)
    mode: str = Field(default="walking", pattern="^(walking|car|wheelchair)$")
    time_of_day: str = Field(default="day", pattern="^(morning|afternoon|evening|night|day)$")
    user_constraints: list[str] = []


class CheckInCreate(BaseModel):
    user_code: str = Field(min_length=4, max_length=64)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    status: str = Field(pattern="^(safe|moving|need_help)$")
    battery_level: int | None = Field(default=None, ge=0, le=100)
    message: str = ""
    idempotency_key: str | None = Field(default=None, max_length=120)


class HelpRequestCreate(BaseModel):
    requester_code: str = Field(min_length=4, max_length=64)
    category: str = Field(pattern="^(transport|medical|food|water|shelter|charging)$")
    details: str
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    urgency: str = Field(default="medium", pattern="^(low|medium|high|critical)$")


class HelpOfferCreate(BaseModel):
    offerer_code: str = Field(min_length=4, max_length=64)
    category: str = Field(pattern="^(transport|medical|food|water|shelter|charging|translation|escort)$")
    details: str = Field(min_length=1, max_length=2000)
    seats: int | None = Field(default=None, ge=0, le=100)
    radius_km: float = Field(default=10, ge=0.5, le=100)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    valid_until: str | None = None


class ReunificationBeaconCreate(BaseModel):
    beacon_code: str = Field(min_length=6, max_length=64)
    family_name_hint: str = Field(min_length=2, max_length=100)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    status: str = Field(pattern="^(safe|moving|need_help)$")
    message: str = ""


class ReunificationBeaconUpdate(BaseModel):
    lat: float | None = Field(default=None, ge=-90, le=90)
    lon: float | None = Field(default=None, ge=-180, le=180)
    status: str | None = Field(default=None, pattern="^(safe|moving|need_help)$")
    message: str | None = None


class AgentQueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=4000)
    context: dict = {}


# Endpoints
@router.get("/runtime")
def get_runtime() -> dict:
    """Return AI runtime mode and provider readiness."""
    return gradient_service.get_runtime_status()


@router.get("/runtime/live-check")
def live_runtime_check() -> dict:
    """Validate live DigitalOcean Gradient connectivity."""
    result = gradient_service.live_healthcheck()
    if not result.get("ok"):
        raise HTTPException(status_code=503, detail=result)
    return result


@router.post("/havens", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_haven(haven: SafeHavenCreate, request: Request, db: Session = Depends(get_db)) -> dict:
    """Create a new safe haven location."""
    _apply_rate_limit(_client_rate_key(request, "create_haven"), limit=30)
    logger.info("creating_haven", name=haven.name, type=haven.type)

    try:
        haven_id = str(uuid.uuid4())
        db_haven = SafeHaven(
            id=haven_id,
            name=haven.name,
            type=haven.type,
            lat=haven.lat,
            lon=haven.lon,
            address=haven.address,
            services=haven.services,
            hours=haven.hours,
            intake_rules=haven.intake_rules,
        )
        db.add(db_haven)
        db.commit()

        logger.info("haven_created", haven_id=haven_id)
        return {"id": haven_id, "name": haven.name}
    except Exception as e:
        logger.error("haven_creation_failed", error=str(e))
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create haven") from e


@router.get("/havens/search")
def search_havens(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(default=10, ge=0, le=100),
    haven_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[SafeHavenOut]:
    """Search for safe havens near a location."""
    logger.info("searching_havens", lat=lat, lon=lon, radius_km=radius_km)

    # Simple distance-based search (production would use PostGIS)
    havens = db.query(SafeHaven).all()

    nearby = []
    for haven in havens:
        distance = geodesic((lat, lon), (haven.lat, haven.lon)).kilometers
        if distance <= radius_km:
            if haven_type is None or haven.type == haven_type:
                nearby.append((distance, haven))

    # Sort by distance
    nearby.sort(key=lambda x: x[0])

    logger.info("havens_found", count=len(nearby))

    return [
        SafeHavenOut(
            id=h.id,
            name=h.name,
            type=h.type,
            lat=h.lat,
            lon=h.lon,
            address=h.address,
            services=_normalize_services(h.services),
            hours=h.hours,
            capacity_status=h.capacity_status,
            verification_tier=h.verification_tier,
            last_verified_at=h.last_verified_at.isoformat() if h.last_verified_at else None,
            distance_km=round(distance, 2),
        )
        for distance, h in nearby
    ]


@router.post("/havens/{haven_id}/updates", response_model=dict, status_code=status.HTTP_201_CREATED)
def add_haven_update(
    haven_id: str,
    payload: HavenUpdateCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    """Add a status update to a haven with optional evidence."""
    _apply_rate_limit(_client_rate_key(request, "haven_update"), limit=20)
    haven = db.query(SafeHaven).filter(SafeHaven.id == haven_id).first()
    if not haven:
        raise HTTPException(status_code=404, detail="Haven not found")

    update_id = str(uuid.uuid4())
    update = HavenUpdate(
        id=update_id,
        haven_id=haven_id,
        status=payload.status,
        note=payload.note,
        reporter_role=payload.reporter_role,
        evidence_url=payload.evidence_url,
    )
    haven.capacity_status = payload.status if payload.status in {"available", "limited", "full"} else haven.capacity_status
    haven.last_verified_at = dt.datetime.utcnow()
    db.add(update)
    db.commit()
    return {"id": update_id, "haven_id": haven_id}


@router.get("/havens/{haven_id}/updates", response_model=list[dict])
def list_haven_updates(
    haven_id: str,
    limit: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[dict]:
    """List recent updates for a haven."""
    updates = (
        db.query(HavenUpdate)
        .filter(HavenUpdate.haven_id == haven_id)
        .order_by(HavenUpdate.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": item.id,
            "status": item.status,
            "note": item.note,
            "reporter_role": item.reporter_role,
            "evidence_url": item.evidence_url,
            "created_at": item.created_at.isoformat(),
        }
        for item in updates
    ]


@router.post("/routes/generate")
def generate_routes(request: RouteRequest) -> dict:
    """Generate 3 risk-aware route options."""
    logger.info(
        "generating_routes",
        start=(request.start_lat, request.start_lon),
        end=(request.end_lat, request.end_lon),
        mode=request.mode,
    )

    try:
        routes = generate_route_options(
            request.start_lat,
            request.start_lon,
            request.end_lat,
            request.end_lon,
            request.mode,
            request.time_of_day,
            request.user_constraints,
        )

        return {
            "routes": [
                {
                    "type": r.type,
                    "distance_km": r.distance_km,
                    "estimated_minutes": r.estimated_minutes,
                    "risk_score": r.risk_score,
                    "risk_reasons": r.risk_reasons,
                    "waypoints": [{"lat": w[0], "lon": w[1]} for w in r.waypoints],
                    "instructions": r.instructions,
                }
                for r in routes
            ]
        }
    except Exception as e:
        logger.error("route_generation_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to generate routes") from e


@router.post("/checkins", status_code=status.HTTP_201_CREATED)
def create_checkin(checkin: CheckInCreate, request: Request, db: Session = Depends(get_db)) -> dict:
    """Log a safety check-in."""
    _apply_rate_limit(_client_rate_key(request, "checkin", checkin.user_code), limit=30)
    logger.info("creating_checkin", user_code=checkin.user_code[:8], status=checkin.status)

    try:
        cutoff = dt.datetime.utcnow() - dt.timedelta(minutes=2)
        existing = (
            db.query(CheckIn)
            .filter(CheckIn.user_code == checkin.user_code)
            .filter(CheckIn.status == checkin.status)
            .filter(CheckIn.created_at >= cutoff)
            .order_by(CheckIn.created_at.desc())
            .first()
        )
        if existing and abs(existing.lat - checkin.lat) < 0.0001 and abs(existing.lon - checkin.lon) < 0.0001:
            return {"id": existing.id, "status": existing.status, "idempotent": True}

        checkin_id = str(uuid.uuid4())
        db_checkin = CheckIn(
            id=checkin_id,
            user_code=checkin.user_code,
            lat=checkin.lat,
            lon=checkin.lon,
            status=checkin.status,
            battery_level=checkin.battery_level,
            message=checkin.message,
        )
        db.add(db_checkin)
        db.commit()

        logger.info("checkin_created", checkin_id=checkin_id)
        return {"id": checkin_id, "status": checkin.status, "idempotent": False}
    except Exception as e:
        logger.error("checkin_creation_failed", error=str(e))
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create check-in") from e


@router.get("/checkins/{user_code}")
def get_checkins(
    user_code: str,
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[dict]:
    """Get recent check-ins for a user."""
    logger.info("fetching_checkins", user_code=user_code[:8])

    checkins = (
        db.query(CheckIn)
        .filter(CheckIn.user_code == user_code)
        .order_by(CheckIn.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": c.id,
            "lat": c.lat,
            "lon": c.lon,
            "status": c.status,
            "message": c.message,
            "battery_level": c.battery_level,
            "created_at": c.created_at.isoformat(),
        }
        for c in checkins
    ]


@router.post("/beacons", status_code=status.HTTP_201_CREATED)
def create_beacon(beacon: ReunificationBeaconCreate, request: Request, db: Session = Depends(get_db)) -> dict:
    """Create a family reunification beacon."""
    _apply_rate_limit(_client_rate_key(request, "beacon_create", beacon.beacon_code), limit=20)
    logger.info("creating_beacon", beacon_code=beacon.beacon_code[:8])

    try:
        existing = (
            db.query(ReunificationBeacon)
            .filter(ReunificationBeacon.beacon_code == beacon.beacon_code)
            .first()
        )
        if existing:
            raise HTTPException(status_code=409, detail="Beacon code already exists")

        beacon_id = str(uuid.uuid4())
        db_beacon = ReunificationBeacon(
            id=beacon_id,
            beacon_code=beacon.beacon_code,
            family_name_hint=beacon.family_name_hint,
            lat=beacon.lat,
            lon=beacon.lon,
            status=beacon.status,
            message=beacon.message,
        )
        db.add(db_beacon)
        db.commit()

        logger.info("beacon_created", beacon_id=beacon_id)
        return {
            "id": beacon_id,
            "beacon_code": beacon.beacon_code,
            "share_url": f"/reunion/{beacon.beacon_code}",
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        logger.error("beacon_creation_failed", error=str(e))
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create beacon") from e


@router.get("/beacons/{beacon_code}")
def get_beacon(beacon_code: str, db: Session = Depends(get_db)) -> dict:
    """Get beacon information by code."""
    logger.info("fetching_beacon", beacon_code=beacon_code[:8])

    beacon = (
        db.query(ReunificationBeacon)
        .filter(ReunificationBeacon.beacon_code == beacon_code)
        .first()
    )

    if not beacon:
        raise HTTPException(status_code=404, detail="Beacon not found")

    return {
        "id": beacon.id,
        "family_name_hint": beacon.family_name_hint,
        "lat": beacon.lat,
        "lon": beacon.lon,
        "status": beacon.status,
        "message": beacon.message,
        "last_updated": beacon.last_updated_at.isoformat(),
    }


@router.post("/beacons/{beacon_code}/update", response_model=dict)
def update_beacon(
    beacon_code: str,
    payload: ReunificationBeaconUpdate,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    """Update beacon location/status with last seen timestamp."""
    _apply_rate_limit(_client_rate_key(request, "beacon_update", beacon_code), limit=30)
    beacon = (
        db.query(ReunificationBeacon)
        .filter(ReunificationBeacon.beacon_code == beacon_code)
        .first()
    )
    if not beacon:
        raise HTTPException(status_code=404, detail="Beacon not found")

    if payload.lat is not None:
        beacon.lat = payload.lat
    if payload.lon is not None:
        beacon.lon = payload.lon
    if payload.status is not None:
        beacon.status = payload.status
    if payload.message is not None:
        beacon.message = payload.message
    beacon.last_updated_at = dt.datetime.utcnow()
    db.commit()
    return {"id": beacon.id, "beacon_code": beacon.beacon_code, "last_updated": beacon.last_updated_at.isoformat()}


@router.post("/help/requests", status_code=status.HTTP_201_CREATED)
def create_help_request(payload: HelpRequestCreate, request: Request, db: Session = Depends(get_db)) -> dict:
    """Create a help request."""
    _apply_rate_limit(_client_rate_key(request, "help_request"), limit=20)
    logger.info("creating_help_request", category=payload.category, urgency=payload.urgency)

    try:
        request_id = str(uuid.uuid4())
        db_request = HelpRequest(
            id=request_id,
            requester_code=payload.requester_code,
            category=payload.category,
            details=payload.details,
            lat=payload.lat,
            lon=payload.lon,
            urgency=payload.urgency,
        )
        db.add(db_request)
        db.commit()

        logger.info("help_request_created", request_id=request_id)
        return {"id": request_id, "category": payload.category}
    except Exception as e:
        logger.error("help_request_creation_failed", error=str(e))
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create help request") from e


@router.get("/help/requests/nearby")
def find_nearby_requests(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(default=10, ge=0, le=50),
    db: Session = Depends(get_db),
) -> list[dict]:
    """Find help requests nearby."""
    requests = db.query(HelpRequest).filter(HelpRequest.fulfilled_at.is_(None)).all()

    nearby = []
    for req in requests:
        distance = geodesic((lat, lon), (req.lat, req.lon)).kilometers
        if distance <= radius_km:
            nearby.append({
                "id": req.id,
                "category": req.category,
                "details": req.details,
                "urgency": req.urgency,
                "distance_km": round(distance, 2),
                "created_at": req.created_at.isoformat(),
            })

    urgency_rank = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    nearby.sort(key=lambda x: (-urgency_rank.get(x["urgency"], 0), x["distance_km"]))

    logger.info("nearby_requests_found", count=len(nearby))
    return nearby


@router.post("/help/offers", status_code=status.HTTP_201_CREATED)
def create_help_offer(payload: HelpOfferCreate, request: Request, db: Session = Depends(get_db)) -> dict:
    """Create a help offer."""
    _apply_rate_limit(_client_rate_key(request, "help_offer"), limit=30)
    valid_until = None
    if payload.valid_until:
        try:
            valid_until = dt.datetime.fromisoformat(payload.valid_until)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="valid_until must be ISO datetime") from exc

    offer_id = str(uuid.uuid4())
    offer = HelpOffer(
        id=offer_id,
        offerer_code=payload.offerer_code,
        category=payload.category,
        details=payload.details,
        seats=payload.seats,
        radius_km=payload.radius_km,
        lat=payload.lat,
        lon=payload.lon,
        valid_until=valid_until,
    )
    db.add(offer)
    db.commit()
    return {"id": offer_id, "category": payload.category}


@router.get("/help/offers/nearby")
def find_nearby_offers(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(default=15, ge=0, le=100),
    db: Session = Depends(get_db),
) -> list[dict]:
    """Find nearby help offers by distance and provider radius."""
    now = dt.datetime.utcnow()
    offers = db.query(HelpOffer).all()
    nearby: list[dict] = []
    for offer in offers:
        if offer.valid_until and offer.valid_until < now:
            continue
        distance = geodesic((lat, lon), (offer.lat, offer.lon)).kilometers
        if distance <= min(radius_km, max(float(offer.radius_km), 0.5)):
            nearby.append(
                {
                    "id": offer.id,
                    "category": offer.category,
                    "details": offer.details,
                    "seats": offer.seats,
                    "distance_km": round(distance, 2),
                    "created_at": offer.created_at.isoformat(),
                }
            )
    nearby.sort(key=lambda item: item["distance_km"])
    return nearby


@router.get("/help/match")
def match_help(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    category: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> dict:
    """Simple proximity matching between open requests and offers."""
    requests = find_nearby_requests(lat=lat, lon=lon, radius_km=20, db=db)
    offers = find_nearby_offers(lat=lat, lon=lon, radius_km=20, db=db)
    if category:
        requests = [item for item in requests if item["category"] == category]
        offers = [item for item in offers if item["category"] == category]
    return {"requests": requests[:10], "offers": offers[:10]}


@router.post("/agent/query", response_model=dict)
async def query_agent(
    payload: AgentQueryRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    """Query RescueOps multi-agent orchestrator and persist trace metadata."""
    _apply_rate_limit(_client_rate_key(request, "agent_query"), limit=40)
    logger.info("agent_query_started", query=payload.query[:120])

    try:
        result = await gradient_service.run_query(
            query=payload.query,
            context=payload.context,
            db=db,
        )
        trace_id = result.get("trace_id", str(uuid.uuid4()))
        trace = AgentTrace(
            id=str(uuid.uuid4()),
            trace_id=trace_id,
            agent_name="RescueOpsOrchestrator",
            query=payload.query,
            response=result.get("response", ""),
            tool_calls=result.get("tool_calls", []),
            sources_used=result.get("sources", []),
            confidence_score=result.get("confidence_score"),
            duration_ms=result.get("duration_ms"),
        )
        db.add(trace)
        db.commit()

        logger.info(
            "agent_query_completed",
            query=payload.query[:120],
            trace_id=trace_id,
            duration_ms=result.get("duration_ms"),
        )

        return {
            "response": result.get("response", ""),
            "tool_calls": result.get("tool_calls", []),
            "sources": result.get("sources", []),
            "trace_id": trace_id,
            "duration_ms": result.get("duration_ms", 0),
            "confidence_score": result.get("confidence_score"),
            "mode": result.get("mode"),
            "agents": result.get("agents", []),
        }
    except Exception as e:
        logger.error("agent_query_failed", error=str(e))
        db.rollback()
        raise HTTPException(status_code=500, detail="Agent query failed") from e


@router.get("/traces/{trace_id}", response_model=dict)
def get_trace(trace_id: str, db: Session = Depends(get_db)) -> dict:
    """Fetch a specific trace by trace_id."""
    trace = db.query(AgentTrace).filter(AgentTrace.trace_id == trace_id).order_by(AgentTrace.created_at.desc()).first()
    if not trace:
        raise HTTPException(status_code=404, detail="Trace not found")
    return {
        "trace_id": trace.trace_id,
        "agent_name": trace.agent_name,
        "query": trace.query,
        "response": trace.response,
        "tool_calls": trace.tool_calls,
        "sources": trace.sources_used,
        "confidence_score": trace.confidence_score,
        "duration_ms": trace.duration_ms,
        "created_at": trace.created_at.isoformat(),
    }


@router.get("/traces", response_model=list[dict])
def list_traces(limit: int = Query(default=20, ge=1, le=200), db: Session = Depends(get_db)) -> list[dict]:
    """List recent traces for transparency UI."""
    traces = db.query(AgentTrace).order_by(AgentTrace.created_at.desc()).limit(limit).all()
    return [
        {
            "trace_id": trace.trace_id,
            "query": trace.query,
            "agent_name": trace.agent_name,
            "duration_ms": trace.duration_ms,
            "confidence_score": trace.confidence_score,
            "created_at": trace.created_at.isoformat(),
        }
        for trace in traces
    ]
