from __future__ import annotations

import os
import time
import uuid
from typing import Generator, List

from fastapi import Depends, FastAPI, File, HTTPException, Query, Request, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse, FileResponse, RedirectResponse
from sqlalchemy.orm import Session

from .db.init_db import init_db
from .db.models import Case, ChecklistItem, Chunk, Document, Risk, TimelineItem
from .db.session import SessionLocal, engine
from .schemas.case import (
    CaseCreate,
    CaseOut,
    ChecklistItemOut,
    ChunkOut,
    RiskOut,
    TimelineItemOut,
    CaseUpdateStory,
    DocumentOut,
)
from pydantic import BaseModel
from .services.extract import extract_text
from .services.reason import build_reasoning
from .services.storage import get_store
from .services.export import export_case_json, export_case_markdown
from .routers import knowledge
from .utils.logger import configure_logging, get_logger

# Configure logging
configure_logging()
logger = get_logger(__name__)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


app = FastAPI(
    title="LifeBridge API",
    version="1.0.0",
    description="AI-powered cross-border mobility assistant. Transform documents into actionable insights.",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.include_router(knowledge.router) # Knowledge base routes

# CORS configuration
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing information."""
    start_time = time.time()
    
    logger.info(
        "request_started",
        method=request.method,
        path=request.url.path,
        client=request.client.host if request.client else None,
    )
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        logger.info(
            "request_completed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=round(process_time * 1000, 2),
        )
        
        response.headers["X-Process-Time"] = str(process_time)
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            "request_failed",
            method=request.method,
            path=request.url.path,
            duration_ms=round(process_time * 1000, 2),
            error=str(e),
            exc_info=True,
        )
        raise


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions gracefully."""
    logger.error(
        "unhandled_exception",
        path=request.url.path,
        method=request.method,
        error=str(exc),
        exc_info=True,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred. Please try again later.",
            "type": "internal_error",
        },
    )


@app.on_event("startup")
def _startup() -> None:
    """Initialize the application on startup."""
    logger.info("application_starting", version="1.0.0")
    try:
        init_db()
        logger.info("database_initialized")
        
        # Test storage connection
        store = get_store()
        logger.info("storage_initialized", store_type=type(store).__name__)
        
        logger.info("application_ready")
    except Exception as e:
        logger.error("startup_failed", error=str(e), exc_info=True)
        raise


@app.on_event("shutdown")
def _shutdown() -> None:
    """Cleanup on application shutdown."""
    logger.info("application_shutting_down")


@app.get("/health")
def health() -> dict:
    """Health check endpoint with detailed status."""
    try:
        # Check database connection
        with engine.connect() as conn:
            from sqlalchemy import text
            conn.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        logger.error("health_check_db_failed", error=str(e))
        db_status = "unhealthy"
    
    try:
        # Check storage
        store = get_store()
        storage_status = "healthy"
    except Exception as e:
        logger.error("health_check_storage_failed", error=str(e))
        storage_status = "unhealthy"
    
    is_healthy = db_status == "healthy" and storage_status == "healthy"
    status_code = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "healthy" if is_healthy else "unhealthy",
            "version": "1.0.0",
            "components": {
                "database": db_status,
                "storage": storage_status,
            },
        },
    )


@app.post("/cases", response_model=CaseOut, status_code=status.HTTP_201_CREATED)
def create_case(payload: CaseCreate, db: Session = Depends(get_db)) -> CaseOut:
    """Create a new case for document processing."""
    try:
        case_id = str(uuid.uuid4())
        logger.info("creating_case", case_id=case_id, title=payload.title, scenario=payload.scenario)
        
        case = Case(id=case_id, title=payload.title, scenario=payload.scenario, summary="")
        db.add(case)
        db.commit()
        
        logger.info("case_created", case_id=case_id)
        return CaseOut(id=case.id, title=case.title, scenario=case.scenario, summary=case.summary)
    except Exception as e:
        logger.error("case_creation_failed", error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create case. Please try again.",
        )


@app.get("/cases/{case_id}", response_model=CaseOut)
def get_case(case_id: str, db: Session = Depends(get_db)) -> CaseOut:
    """Get details of a specific case."""
    logger.info("fetching_case", case_id=case_id)
    
    case = db.get(Case, case_id)
    if not case:
        logger.warning("case_not_found", case_id=case_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id} not found",
        )
    
    logger.info("case_fetched", case_id=case_id)
    return CaseOut(id=case.id, title=case.title, scenario=case.scenario, summary=case.summary, user_story=case.user_story)


@app.patch("/cases/{case_id}/story", response_model=CaseOut)
def update_case_story(case_id: str, payload: CaseUpdateStory, db: Session = Depends(get_db)) -> CaseOut:
    """Update the user story for a case."""
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case.user_story = payload.user_story
    db.commit()
    return CaseOut(id=case.id, title=case.title, scenario=case.scenario, summary=case.summary, user_story=case.user_story)


@app.post("/cases/{case_id}/documents", response_model=dict, status_code=status.HTTP_201_CREATED)
def upload_document(
    case_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> dict:
    """Upload and process a document for a case."""
    logger.info(
        "document_upload_started",
        case_id=case_id,
        filename=file.filename,
        content_type=file.content_type,
    )
    
    # Validate case exists
    case = db.get(Case, case_id)
    if not case:
        logger.warning("upload_case_not_found", case_id=case_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id} not found",
        )
    
    # Validate file type
    allowed_types = ["application/pdf", "image/png", "image/jpeg", "image/jpg"]
    if file.content_type and file.content_type not in allowed_types:
        logger.warning(
            "invalid_file_type",
            case_id=case_id,
            content_type=file.content_type,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file.content_type}. Allowed types: {', '.join(allowed_types)}",
        )
    
    try:
        # Read file data
        data = file.file.read()
        file_size_mb = len(data) / (1024 * 1024)
        logger.info("file_read", case_id=case_id, size_mb=round(file_size_mb, 2))
        
        # Validate file size (10MB limit)
        if len(data) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds 10MB limit",
            )
        
        # Store file
        store = get_store()
        stored = store.put(
            fileobj=open_bytesio(data),
            filename=file.filename or "upload",
            content_type=file.content_type or "application/octet-stream",
        )
        logger.info("file_stored", case_id=case_id, storage_key=stored.key)
        
        # Create document record
        doc_id = str(uuid.uuid4())
        doc = Document(
            id=doc_id,
            case_id=case_id,
            filename=file.filename or "upload",
            content_type=file.content_type or "",
            storage_key=stored.key,
        )
        db.add(doc)
        
        # Extract text
        logger.info("extracting_text", case_id=case_id, document_id=doc_id)
        extracted = extract_text(file.content_type or "", data)
        logger.info(
            "text_extracted",
            case_id=case_id,
            document_id=doc_id,
            chunks=len(extracted.chunks),
            text_length=len(extracted.full_text),
        )
        
        # Store chunks
        for idx, chunk_text in enumerate(extracted.chunks):
            c = Chunk(
                id=str(uuid.uuid4()),
                case_id=case_id,
                document_id=doc_id,
                idx=idx,
                text=chunk_text,
            )
            db.add(c)
        
        db.commit()
        
        logger.info(
            "document_upload_completed",
            case_id=case_id,
            document_id=doc_id,
            chunks=len(extracted.chunks),
        )
        
        return {
            "document_id": doc_id,
            "chunks": len(extracted.chunks),
            "filename": file.filename,
            "size_mb": round(file_size_mb, 2),
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        logger.error(
            "document_upload_failed",
            case_id=case_id,
            error=str(e),
            exc_info=True,
        )
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process document. Please try again.",
        )


@app.get("/cases/{case_id}/documents", response_model=List[DocumentOut])
def list_case_documents(case_id: str, db: Session = Depends(get_db)) -> List[DocumentOut]:
    """List documents for a specific case."""
    logger.info("listing_case_documents", case_id=case_id)
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    docs = db.query(Document).filter(Document.case_id == case_id).order_by(Document.created_at.desc()).all()
    
    return [
        DocumentOut(
            id=d.id,
            case_id=d.case_id,
            filename=d.filename,
            content_type=d.content_type,
            created_at=d.created_at.isoformat()
        ) for d in docs
    ]


@app.post("/cases/{case_id}/analyze", response_model=dict)
def analyze_case(case_id: str, db: Session = Depends(get_db)) -> dict:
    """Analyze case documents and generate outputs."""
    logger.info("analysis_started", case_id=case_id)
    
    # Validate case exists
    case = db.get(Case, case_id)
    if not case:
        logger.warning("analysis_case_not_found", case_id=case_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id} not found",
        )
    
    try:
        # Clear prior outputs to keep runs deterministic
        deleted_checklist = db.query(ChecklistItem).filter(ChecklistItem.case_id == case_id).delete()
        deleted_timeline = db.query(TimelineItem).filter(TimelineItem.case_id == case_id).delete()
        deleted_risks = db.query(Risk).filter(Risk.case_id == case_id).delete()
        logger.info(
            "cleared_prior_outputs",
            case_id=case_id,
            checklist=deleted_checklist,
            timeline=deleted_timeline,
            risks=deleted_risks,
        )
        
        # Load chunks
        chunks = db.query(Chunk).filter(Chunk.case_id == case_id).order_by(Chunk.idx.asc()).all()
        chunk_texts: List[str] = [c.text for c in chunks]
        logger.info("chunks_loaded", case_id=case_id, count=len(chunks))
        
        if not chunks and not case.user_story:
            logger.warning("no_content_found", case_id=case_id)
            return {
                "ok": True,
                "warning": "No documents uploaded or story provided yet.",
            }
        
        # Run reasoning
        logger.info("running_reasoning", case_id=case_id, scenario=case.scenario)
        rr = build_reasoning(case.scenario, chunk_texts, user_story=case.user_story or "")
        case.summary = rr.summary
        logger.info(
            "reasoning_completed",
            case_id=case_id,
            checklist_items=len(rr.checklist),
            timeline_items=len(rr.timeline),
            risk_items=len(rr.risks),
        )
        
        # Persist outputs with evidence chunk IDs
        for item in rr.checklist:
            ids = [chunks[i].id for i in item.evidence_idx if i < len(chunks)]
            db.add(
                ChecklistItem(
                    id=str(uuid.uuid4()),
                    case_id=case_id,
                    label=item.label,
                    status=item.status,
                    notes=item.notes,
                    evidence_chunk_ids=",".join(ids),
                )
            )
        
        for item in rr.timeline:
            ids = [chunks[i].id for i in item.evidence_idx if i < len(chunks)]
            db.add(
                TimelineItem(
                    id=str(uuid.uuid4()),
                    case_id=case_id,
                    label=item.label,
                    due_date=item.due_date,
                    owner=item.owner,
                    notes=item.notes,
                    evidence_chunk_ids=",".join(ids),
                )
            )
        
        for item in rr.risks:
            ids = [chunks[i].id for i in item.evidence_idx if i < len(chunks)]
            db.add(
                Risk(
                    id=str(uuid.uuid4()),
                    case_id=case_id,
                    category=item.category,
                    severity=item.severity,
                    statement=item.statement,
                    reason=item.reason,
                    evidence_chunk_ids=",".join(ids),
                )
            )
        
        db.commit()
        
        logger.info("analysis_completed", case_id=case_id)
        return {
            "ok": True,
            "summary": case.summary,
            "counts": {
                "checklist": len(rr.checklist),
                "timeline": len(rr.timeline),
                "risks": len(rr.risks),
            },
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        logger.error("analysis_failed", case_id=case_id, error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze case. Please try again.",
        )


@app.get("/cases/{case_id}/outputs", response_model=dict)
def get_outputs(case_id: str, db: Session = Depends(get_db)) -> dict:
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    checklist = db.query(ChecklistItem).filter(ChecklistItem.case_id == case_id).all()
    timeline = db.query(TimelineItem).filter(TimelineItem.case_id == case_id).all()
    risks = db.query(Risk).filter(Risk.case_id == case_id).all()
    chunks = db.query(Chunk).filter(Chunk.case_id == case_id).all()
    
    # Fetch documents to map IDs to filenames
    documents = db.query(Document).filter(Document.case_id == case_id).all()
    doc_map = {d.id: d.filename for d in documents}

    chunk_map = {
        c.id: {
            "id": c.id,
            "document_id": c.document_id,
            "filename": doc_map.get(c.document_id, "Unknown File"),
            "idx": c.idx,
            "text": c.text
        } 
        for c in chunks
    }

    def split_ids(s: str) -> List[str]:
        return [x for x in (s or "").split(",") if x]

    return {
        "case": CaseOut(id=case.id, title=case.title, scenario=case.scenario, summary=case.summary, user_story=case.user_story).model_dump(),
        "checklist": [
            ChecklistItemOut(
                id=i.id,
                label=i.label,
                status=i.status,
                notes=i.notes,
                evidence_chunk_ids=split_ids(i.evidence_chunk_ids),
            ).model_dump()
            for i in checklist
        ],
        "timeline": [
            TimelineItemOut(
                id=i.id,
                label=i.label,
                status=i.status,
                due_date=i.due_date,
                owner=i.owner,
                notes=i.notes,
                evidence_chunk_ids=split_ids(i.evidence_chunk_ids),
            ).model_dump()
            for i in timeline
        ],
        "risks": [
            RiskOut(
                id=i.id,
                category=i.category,
                severity=i.severity,
                statement=i.statement,
                reason=i.reason,
                evidence_chunk_ids=split_ids(i.evidence_chunk_ids),
            ).model_dump()
            for i in risks
        ],
        "chunks": chunk_map,
    }


@app.get("/cases", response_model=List[CaseOut])
def list_cases(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)) -> List[CaseOut]:
    """List all cases with pagination."""
    logger.info("listing_cases", skip=skip, limit=limit)
    
    cases = db.query(Case).order_by(Case.created_at.desc()).offset(skip).limit(limit).all()
    
    logger.info("cases_listed", count=len(cases))
    return [
        CaseOut(id=c.id, title=c.title, scenario=c.scenario, summary=c.summary)
        for c in cases
    ]


@app.delete("/cases/{case_id}", status_code=status.HTTP_200_OK)
def delete_case(case_id: str, db: Session = Depends(get_db)) -> dict:
    """Delete a case and all associated data."""
    logger.info("deleting_case", case_id=case_id)
    
    case = db.get(Case, case_id)
    if not case:
        logger.warning("delete_case_not_found", case_id=case_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id} not found",
        )
    
    try:
        db.delete(case)
        db.commit()
        logger.info("case_deleted", case_id=case_id)
        return {"success": True}
    except Exception as e:
        logger.error("case_deletion_failed", case_id=case_id, error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete case. Please try again.",
        )


@app.get("/cases/{case_id}/statistics", response_model=dict)
def get_case_statistics(case_id: str, db: Session = Depends(get_db)) -> dict:
    """Get statistics about a case."""
    logger.info("fetching_statistics", case_id=case_id)
    
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id} not found",
        )
    
    # Count various items
    document_count = db.query(Document).filter(Document.case_id == case_id).count()
    chunk_count = db.query(Chunk).filter(Chunk.case_id == case_id).count()
    checklist_count = db.query(ChecklistItem).filter(ChecklistItem.case_id == case_id).count()
    timeline_count = db.query(TimelineItem).filter(TimelineItem.case_id == case_id).count()
    risk_count = db.query(Risk).filter(Risk.case_id == case_id).count()
    
    # Count risks by severity
    risks = db.query(Risk).filter(Risk.case_id == case_id).all()
    risk_breakdown = {"high": 0, "medium": 0, "low": 0}
    for risk in risks:
        severity = risk.severity.lower()
        if severity in risk_breakdown:
            risk_breakdown[severity] += 1
    
    logger.info("statistics_fetched", case_id=case_id)
    
    return {
        "case_id": case_id,
        "documents": document_count,
        "chunks": chunk_count,
        "checklist_items": checklist_count,
        "timeline_items": timeline_count,
        "total_risks": risk_count,
        "risk_breakdown": risk_breakdown,
    }


@app.get("/statistics", response_model=dict)
def get_global_statistics(db: Session = Depends(get_db)) -> dict:
    """Get global statistics across all cases."""
    logger.info("fetching_global_statistics")
    
    total_cases = db.query(Case).count()
    total_documents = db.query(Document).count()
    total_chunks = db.query(Chunk).count()
    
    # Count by scenario
    from sqlalchemy import func
    scenario_counts = (
        db.query(Case.scenario, func.count(Case.id))
        .group_by(Case.scenario)
        .all()
    )
    
    logger.info("global_statistics_fetched")
    
    return {
        "total_cases": total_cases,
        "total_documents": total_documents,
        "total_chunks": total_chunks,
        "cases_by_scenario": {scenario: count for scenario, count in scenario_counts},
    }


@app.post("/demo/preset", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_demo_preset(db: Session = Depends(get_db)) -> dict:
    """Create a demo case with sample data for quick testing."""
    logger.info("creating_demo_preset")
    
    try:
        case_id = str(uuid.uuid4())
        case = Case(
            id=case_id,
            title="Family Reunion (Demo)",
            scenario="family_reunion",
            summary="",
        )
        db.add(case)
        db.flush()
        
        doc_id = str(uuid.uuid4())
        doc = Document(
            id=doc_id,
            case_id=case_id,
            filename="demo_invitation_letter.txt",
            content_type="text/plain",
            storage_key="demo/demo_letter.txt",
        )
        db.add(doc)
        db.flush()
        
        demo_text = (
            "Invitation Letter for Family Visit.\n"
            "Host: Alex Rivera. Address: 10 Maple St, Toronto, ON.\n"
            "Visitor: Sam Rivera. Travel window: January 15 - February 28, 2025.\n"
            "Passport Number: P12345678, valid until December 2026.\n"
            "Purpose: family visit during school holiday to spend time together.\n"
            "Relationship: Parent and child.\n"
            "Accommodation: Guest room in host's residence.\n"
            "Financial support: Host will cover all expenses during visit."
        )
        
        # Split into chunks
        for idx, t in enumerate([demo_text[i : i + 200] for i in range(0, len(demo_text), 200)]):
            db.add(
                Chunk(
                    id=str(uuid.uuid4()),
                    case_id=case_id,
                    document_id=doc_id,
                    idx=idx,
                    text=t,
                )
            )
        
        # Populate demo User Story
        case.user_story = "I am inviting my parent for a visit from Mexico to Canada for 6 weeks during the holidays. I will cover their expenses."
        db.add(case)
        db.flush()

        # Trigger Reasoning (Simulated or Real)
        # For demo speed, we'll insert pre-canned high-quality results
        # Checklist
        db.add(ChecklistItem(id=str(uuid.uuid4()), case_id=case_id, label="Draft Letter of Invitation", status="done", notes="Include details about accommodation and financial support."))
        db.add(ChecklistItem(id=str(uuid.uuid4()), case_id=case_id, label="Gather Proof of Funds", status="in_progress", notes="Bank statements for the last 4 months."))
        db.add(ChecklistItem(id=str(uuid.uuid4()), case_id=case_id, label="Check Visa Requirements", status="todo", notes="Verify if TRV is needed for Mexico citizens (ETA might be sufficient)."))
        
        # Timeline
        db.add(TimelineItem(id=str(uuid.uuid4()), case_id=case_id, label="Submit Application", due_date="2024-12-01", owner="Alex", notes="Apply 2 months before travel."))
        db.add(TimelineItem(id=str(uuid.uuid4()), case_id=case_id, label="Travel Window Starts", due_date="2025-01-15", owner="Sam", notes="Planned arrival."))

        # Risks
        db.add(Risk(id=str(uuid.uuid4()), case_id=case_id, category="Financial", severity="low", statement="Proof of funds might be scrutinized.", reason="Ensure the host's bank statements show stable income."))
        db.add(Risk(id=str(uuid.uuid4()), case_id=case_id, category="Ties to Home", severity="medium", statement="Visitor must prove intent to return.", reason="Sam should provide proof of employment or property in Mexico."))

        db.commit()
        
        logger.info("demo_preset_created", case_id=case_id)
        return {"case_id": case_id, "title": case.title, "message": "Demo case created with insights"}

    except Exception as e:
        logger.error("demo_preset_creation_failed", error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create demo preset. Please try again.",
        )


@app.get("/cases/{case_id}/export")
def export_case(
    case_id: str,
    format: str = Query("json", regex="^(json|markdown)$"),
    db: Session = Depends(get_db),
):
    """Export case data in various formats (JSON or Markdown)."""
    logger.info("exporting_case", case_id=case_id, format=format)
    
    # Get all case data (reuse get_outputs logic)
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id} not found",
        )
    
    checklist = db.query(ChecklistItem).filter(ChecklistItem.case_id == case_id).all()
    timeline = db.query(TimelineItem).filter(TimelineItem.case_id == case_id).all()
    risks = db.query(Risk).filter(Risk.case_id == case_id).all()
    chunks = db.query(Chunk).filter(Chunk.case_id == case_id).all()
    
    def split_ids(s: str) -> List[str]:
        return [x for x in (s or "").split(",") if x]
    
    case_data = {
        "case": {
            "id": case.id,
            "title": case.title,
            "scenario": case.scenario,
            "summary": case.summary,
        },
        "checklist": [
            {
                "id": i.id,
                "label": i.label,
                "status": i.status,
                "notes": i.notes,
                "evidence_chunk_ids": split_ids(i.evidence_chunk_ids),
            }
            for i in checklist
        ],
        "timeline": [
            {
                "id": i.id,
                "label": i.label,
                "due_date": i.due_date,
                "owner": i.owner,
                "notes": i.notes,
                "evidence_chunk_ids": split_ids(i.evidence_chunk_ids),
            }
            for i in timeline
        ],
        "risks": [
            {
                "id": i.id,
                "category": i.category,
                "severity": i.severity,
                "statement": i.statement,
                "reason": i.reason,
                "evidence_chunk_ids": split_ids(i.evidence_chunk_ids),
            }
            for i in risks
        ],
        "chunks": {
            c.id: {"id": c.id, "document_id": c.document_id, "idx": c.idx, "text": c.text}
            for c in chunks
        },
    }
    
    logger.info("case_data_prepared", case_id=case_id, format=format)
    
    if format == "json":
        content = export_case_json(case_data)
        media_type = "application/json"
        filename = f"case_{case_id[:8]}.json"
    else:  # markdown
        content = export_case_markdown(case_data)
        media_type = "text/markdown"
        filename = f"case_{case_id[:8]}.md"
    
    logger.info("case_exported", case_id=case_id, format=format)
    
    return PlainTextResponse(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/search")
def search_cases(
    q: str = Query(..., min_length=2, description="Search query"),
    db: Session = Depends(get_db),
) -> List[CaseOut]:
    """Search cases by title or scenario."""
    logger.info("searching_cases", query=q)
    
    # Simple search across title and scenario
    search_term = f"%{q}%"
    cases = (
        db.query(Case)
        .filter(
            (Case.title.ilike(search_term)) | (Case.scenario.ilike(search_term))
        )
        .order_by(Case.created_at.desc())
        .limit(50)
        .all()
    )
    
    logger.info("search_completed", query=q, results=len(cases))
    
    return [
        CaseOut(id=c.id, title=c.title, scenario=c.scenario, summary=c.summary)
        for c in cases
    ]


@app.get("/documents", response_model=List[DocumentOut])
def list_documents(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)) -> List[DocumentOut]:
    """List all documents."""
    logger.info("listing_documents", skip=skip, limit=limit)
    docs = db.query(Document).order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
    
    return [
        DocumentOut(
            id=d.id,
            case_id=d.case_id,
            filename=d.filename,
            content_type=d.content_type,
            created_at=d.created_at.isoformat()
        ) for d in docs
    ]


@app.get("/documents/{document_id}/download")
def download_document(document_id: str, db: Session = Depends(get_db)):
    """Download a document file."""
    logger.info("downloading_document", document_id=document_id)
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        store = get_store()
        
        # S3 Storage: Redirect to public URL
        if hasattr(store, "get_download_url"):
             try:
                 url = store.get_download_url(doc.storage_key)
                 # Check if it's an HTTP URL we can redirect to
                 if url.startswith("http"):
                     return RedirectResponse(url)
             except Exception:
                 pass # Fallback or cleaner error
        
        # Local Storage: File Response
        # Ensure we are using local storage for this endpoint if get_file_path works
        try:
             path = store.get_file_path(doc.storage_key)
             return FileResponse(path, filename=doc.filename, media_type=doc.content_type)
        except NotImplementedError:
             # If S3 but failed to get HTTP URL
             raise HTTPException(status_code=501, detail="Download available only via direct S3 URL.")

    except NotImplementedError:
        raise HTTPException(status_code=501, detail="Download not supported for this storage backend")
    except Exception as e:
        logger.error("download_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to download file")


@app.delete("/documents/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(document_id: str, db: Session = Depends(get_db)) -> dict:
    """Delete a document file and its record."""
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        # Delete from storage first
        store = get_store()
        try:
            store.delete(doc.storage_key)
        except Exception as e:
            logger.error("storage_deletion_failed", error=str(e))
            # Continue to delete DB record even if storage delete fails
            # This prevents "zombie" records that point to nowhere

        # Delete database record
        db.delete(doc)
        db.commit()
        logger.info("document_deleted", document_id=document_id)
        return {"success": True}
        
    except Exception as e:
        logger.error("document_deletion_failed", error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete document")


class ChecklistStatusUpdate(BaseModel):
    status: str

@app.patch("/checklist/{item_id}/status", response_model=dict)
def update_checklist_status(
    item_id: str, 
    payload: ChecklistStatusUpdate, 
    db: Session = Depends(get_db)
) -> dict:
    """Update the status of a checklist item (e.g. todo -> done)."""
    logger.info("updating_checklist_status", item_id=item_id, status=payload.status)
    
    item = db.get(ChecklistItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
        
    item.status = payload.status
    db.commit()
    
    return {"id": item.id, "status": item.status}


@app.patch("/timeline/{item_id}/status", response_model=dict)
def update_timeline_status(
    item_id: str, 
    payload: ChecklistStatusUpdate, 
    db: Session = Depends(get_db)
) -> dict:
    """Update the status of a timeline item."""
    logger.info("updating_timeline_status", item_id=item_id, status=payload.status)
    
    item = db.get(TimelineItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Timeline item not found")
        
    item.status = payload.status
    db.commit()
    
    return {"id": item.id, "status": item.status}


class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat_endpoint(payload: ChatRequest):
    """Chat with the AI assistant."""
    from .services.llm import generate_chat_response
    response_text = generate_chat_response(payload.message)
    return {"response": response_text}


def open_bytesio(data: bytes):
    import io

    return io.BytesIO(data)
