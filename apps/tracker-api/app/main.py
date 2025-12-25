from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
from .models import (
    init_db, SessionLocal, TravelHistory, EmploymentHistory, ResidenceHistory,
    ImmigrationCase, CaseEvent, Task, Note, Contact
)

app = FastAPI(title="LifeBridge Tracker API", version="1.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Startup Event
@app.on_event("startup")
def on_startup():
    init_db()

# --- Pydantic Models ---
class TravelEntry(BaseModel):
    country: str
    entry_date: date
    exit_date: Optional[date] = None
    purpose: str
    port_of_entry: Optional[str] = None
    class_of_admission: Optional[str] = None

# --- Endpoints ---
@app.get("/")
def read_root():
    return {"message": "LifeBridge Tracker API Service"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# History: Travel
@app.post("/v1/history/travel")
def add_travel(entry: TravelEntry, db: Session = Depends(get_db)):
    # Mock user_id for now (MVP) - In real integration, verify JWT
    db_entry = TravelHistory(user_id="mock_user_123", **entry.dict())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.get("/v1/history/travel")
def get_travel(db: Session = Depends(get_db)):
    return db.query(TravelHistory).filter(TravelHistory.user_id == "mock_user_123").all()

@app.delete("/v1/history/travel/{entry_id}")
def delete_travel(entry_id: int, db: Session = Depends(get_db)):
    db_entry = db.query(TravelHistory).filter(TravelHistory.id == entry_id, TravelHistory.user_id == "mock_user_123").first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(db_entry)
    db.commit()
    return {"message": "Entry deleted"}

class EmploymentEntry(BaseModel):
    employer: str
    title: str
    start_date: date
    end_date: Optional[date] = None
    city: str
    state: str

class ResidenceEntry(BaseModel):
    address: str
    city: str
    country: str
    start_date: date
    end_date: Optional[date] = None

# History: Employment
@app.post("/v1/history/employment")
def add_employment(entry: EmploymentEntry, db: Session = Depends(get_db)):
    db_entry = EmploymentHistory(user_id="mock_user_123", **entry.dict())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.get("/v1/history/employment")
def get_employment(db: Session = Depends(get_db)):
    return db.query(EmploymentHistory).filter(EmploymentHistory.user_id == "mock_user_123").all()

@app.delete("/v1/history/employment/{entry_id}")
def delete_employment(entry_id: int, db: Session = Depends(get_db)):
    db_entry = db.query(EmploymentHistory).filter(EmploymentHistory.id == entry_id, EmploymentHistory.user_id == "mock_user_123").first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(db_entry)
    db.commit()
    return {"message": "Entry deleted"}

# History: Residence
@app.post("/v1/history/residence")
def add_residence(entry: ResidenceEntry, db: Session = Depends(get_db)):
    db_entry = ResidenceHistory(user_id="mock_user_123", **entry.dict())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.get("/v1/history/residence")
def get_residence(db: Session = Depends(get_db)):
    return db.query(ResidenceHistory).filter(ResidenceHistory.user_id == "mock_user_123").all()

@app.delete("/v1/history/residence/{entry_id}")
def delete_residence(entry_id: int, db: Session = Depends(get_db)):
    db_entry = db.query(ResidenceHistory).filter(ResidenceHistory.id == entry_id, ResidenceHistory.user_id == "mock_user_123").first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(db_entry)
    db.commit()
    return {"message": "Entry deleted"}

# --- Documents ---
class DocumentEntry(BaseModel):
    filename: str
    category: str
    s3_key: Optional[str] = None
    upload_date: Optional[date] = None
    case_id: Optional[int] = None

from .models import Document

@app.get("/v1/documents")
def get_documents(db: Session = Depends(get_db)):
    return db.query(Document).filter(Document.user_id == "mock_user_123").all()

@app.post("/v1/documents")
def add_document(entry: DocumentEntry, db: Session = Depends(get_db)):
    # In a real app, we would handle the file upload here or pre-sign a URL.
    # For MVP, we assume the file is handled or we just track metadata.
    if not entry.upload_date:
        entry.upload_date = date.today()
    if not entry.s3_key:
        entry.s3_key = f"mock/{entry.filename}"
        
    db_entry = Document(user_id="mock_user_123", **entry.dict())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

# --- Export ---
from fastapi.responses import StreamingResponse
from .pdf_service import generate_history_pdf

@app.get("/v1/export/pdf")
def export_pdf(db: Session = Depends(get_db)):
    travel = db.query(TravelHistory).filter(TravelHistory.user_id == "mock_user_123").all()
    employment = db.query(EmploymentHistory).filter(EmploymentHistory.user_id == "mock_user_123").all()
    residence = db.query(ResidenceHistory).filter(ResidenceHistory.user_id == "mock_user_123").all()
    
    pdf_buffer = generate_history_pdf(travel, employment, residence)
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": "attachment; filename=immigration_history.pdf"}
    )

# --- Contacts ---
class ContactEntry(BaseModel):
    name: str
    role: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

from .models import Contact

@app.get("/v1/contacts")
def get_contacts(db: Session = Depends(get_db)):
    return db.query(Contact).filter(Contact.user_id == "mock_user_123").all()

@app.post("/v1/contacts")
def add_contact(entry: ContactEntry, db: Session = Depends(get_db)):
    db_entry = Contact(user_id="mock_user_123", **entry.dict())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

# --- Notes ---
class NoteEntry(BaseModel):
    title: str
    content: str
    note_date: date
    linked_entity_id: Optional[str] = None

from .models import Note

@app.get("/v1/notes")
def get_notes(db: Session = Depends(get_db)):
    return db.query(Note).filter(Note.user_id == "mock_user_123").all()

@app.post("/v1/notes")
def add_note(entry: NoteEntry, db: Session = Depends(get_db)):
    db_entry = Note(user_id="mock_user_123", **entry.dict())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

# --- Tasks ---
class TaskEntry(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: str = "pending" # pending, in_progress, completed
    priority: str = "medium" # low, medium, high
    linked_entity_id: Optional[str] = None
    case_id: Optional[int] = None

from .models import Task

@app.get("/v1/tasks")
def get_tasks(db: Session = Depends(get_db)):
    return db.query(Task).filter(Task.user_id == "mock_user_123").all()

@app.post("/v1/tasks")
def add_task(entry: TaskEntry, db: Session = Depends(get_db)):
    task_data = entry.dict()
    # Remove fields not present in the DB model
    if "linked_entity_id" in task_data:
        del task_data["linked_entity_id"]
        
    db_entry = Task(user_id="mock_user_123", created_at=date.today(), **task_data)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.put("/v1/tasks/{task_id}")
def update_task(task_id: int, entry: TaskEntry, db: Session = Depends(get_db)):
    db_task = db.query(Task).filter(Task.id == task_id, Task.user_id == "mock_user_123").first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    for key, value in entry.dict().items():
        if key != "linked_entity_id":
             setattr(db_task, key, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/v1/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(Task).filter(Task.id == task_id, Task.user_id == "mock_user_123").first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted"}

# --- Cases ---
class CaseEntry(BaseModel):
    title: str
    case_type: str
    status: str = "Open"
    filing_date: Optional[date] = None
    priority_date: Optional[date] = None
    receipt_number: Optional[str] = None

class CaseEventEntry(BaseModel):
    event_date: date
    title: str
    description: Optional[str] = None
    event_type: str

from .models import ImmigrationCase, CaseEvent
from .services.uscis import get_uscis_service

@app.get("/v1/cases")
def get_cases(db: Session = Depends(get_db)):
    return db.query(ImmigrationCase).filter(ImmigrationCase.user_id == "mock_user_123").all()

@app.get("/v1/cases/{case_id}")
def get_case(case_id: int, db: Session = Depends(get_db)):
    db_case = db.query(ImmigrationCase).filter(ImmigrationCase.id == case_id, ImmigrationCase.user_id == "mock_user_123").first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")
    return db_case

@app.post("/v1/cases")
def add_case(entry: CaseEntry, db: Session = Depends(get_db)):
    db_entry = ImmigrationCase(user_id="mock_user_123", **entry.dict())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.put("/v1/cases/{case_id}")
def update_case(case_id: int, entry: CaseEntry, db: Session = Depends(get_db)):
    db_case = db.query(ImmigrationCase).filter(ImmigrationCase.id == case_id, ImmigrationCase.user_id == "mock_user_123").first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    for key, value in entry.dict().items():
        setattr(db_case, key, value)
        
    db.commit()
    db.refresh(db_case)
    return db_case

@app.delete("/v1/cases/{case_id}")
def delete_case(case_id: int, db: Session = Depends(get_db)):
    db_case = db.query(ImmigrationCase).filter(ImmigrationCase.id == case_id, ImmigrationCase.user_id == "mock_user_123").first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    db.delete(db_case)
    db.commit()
    return {"message": "Case deleted"}

@app.get("/v1/cases/{case_id}/events")
def get_case_events(case_id: int, db: Session = Depends(get_db)):
    return db.query(CaseEvent).filter(CaseEvent.case_id == case_id).order_by(CaseEvent.event_date.desc()).all()

@app.post("/v1/cases/{case_id}/events")
def add_case_event(case_id: int, entry: CaseEventEntry, db: Session = Depends(get_db)):
    # Verify case ownership
    db_case = db.query(ImmigrationCase).filter(ImmigrationCase.id == case_id, ImmigrationCase.user_id == "mock_user_123").first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    db_entry = CaseEvent(case_id=case_id, **entry.dict())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.post("/v1/cases/{case_id}/status")
async def check_case_status(case_id: int, db: Session = Depends(get_db)):
    print(f"DEBUG: Checking status for case_id={case_id}")
    # 1. Fetch case
    db_case = db.query(ImmigrationCase).filter(ImmigrationCase.id == case_id, ImmigrationCase.user_id == "mock_user_123").first()
    if not db_case:
        print(f"DEBUG: Case {case_id} not found")
        raise HTTPException(status_code=404, detail="Case not found")
    
    if not db_case.receipt_number:
        print(f"DEBUG: Case {case_id} has no receipt number")
        raise HTTPException(status_code=400, detail="Case has no receipt number")

    # 2. Call USCIS Service
    from .services.uscis import get_uscis_service
    print(f"DEBUG: Calling USCIS service for receipt {db_case.receipt_number}")
    service = await get_uscis_service()
    result = await service.check_status(db_case.receipt_number)
    print(f"DEBUG: USCIS Result: {result.get('status')} - {result.get('detail')[:50]}...")
    
    # 3. Update case status if valid (Exclude both tech errors and access blocks)
    bad_statuses = ["Error", "Invalid Receipt", "Unknown", "Access Denied", "Connection Error"]
    if result["status"] not in bad_statuses:
        # Only update if meaningful
        db_case.status = result["status"]
        
        # Log event
        existing_event = db.query(CaseEvent).filter(
            CaseEvent.case_id == case_id, 
            CaseEvent.title == result["status"],
            CaseEvent.event_date == date.today()
        ).first()
        
        if not existing_event:
            new_event = CaseEvent(
                case_id=case_id,
                event_date=date.today(),
                title=result["status"],
                description=result["detail"],
                event_type="status_update"
            )
            db.add(new_event)
            print(f"DEBUG: Added new case event: {result['status']}")
            
        db.commit()
        db.refresh(db_case)
        
    return {
        "case_id": case_id,
        "receipt": db_case.receipt_number,
        "uscis_status": result
    }


# --- Demo ---
@app.post("/v1/demo/seed")
def seed_demo_data(db: Session = Depends(get_db)):
    # 1. Create a Demo Case
    demo_case = ImmigrationCase(
        user_id="mock_user_123",
        title="Demo: Spouse Visa Application",
        case_type="I-130 (Petition for Alien Relative)",
        status="Open",
        filing_date=date.today(),
        receipt_number="IOE0987654321"
    )
    db.add(demo_case)
    db.commit()
    db.refresh(demo_case)
    
    # 2. Add Tasks
    tasks = [
        Task(
            user_id="mock_user_123",
            title="Gather Marriage Certificate",
            description="Locate original copy of marriage certificate for I-130 evidence.",
            status="pending",
            priority="high",
            created_at=date.today(),
            case_id=demo_case.id
        ),
        Task(
            user_id="mock_user_123",
            title="Passport Photos",
            description="Get 2x2 passport-style photos for beneficiary.",
            status="in_progress",
            priority="medium",
            created_at=date.today(),
            case_id=demo_case.id
        ),
        Task(
            user_id="mock_user_123",
            title="Complete Form I-130A",
            description="Supplemental Information for Spouse Beneficiary.",
            status="pending",
            priority="medium",
            created_at=date.today(),
            case_id=demo_case.id
        )
    ]
    db.add_all(tasks)
    
    # 3. Add Note
    note = Note(
        user_id="mock_user_123",
        title="Consultation Notes",
        content="Attorney mentioned focusing on bona fide marriage evidence. Need joint lease and bank statements.",
        note_date=date.today(),
        linked_entity_id=str(demo_case.id)
    )
    db.add(note)
    
    # 4. Add Document (Placeholder)
    doc = Document(
        user_id="mock_user_123",
        filename="sample_marriage_cert.pdf",
        category="Evidence",
        s3_key="demo/sample_marriage_cert.pdf",
        upload_date=date.today(),
        case_id=demo_case.id
    )
    db.add(doc)
    
    # 5. Add Timeline Event
    event = CaseEvent(
        case_id=demo_case.id,
        event_date=date.today(),
        title="Case Started",
        description="Initialized new I-130 petition for spouse.",
        event_type="milestone"
    )
    db.add(event)
    
    db.commit()
    
    return {"message": "Demo data seeded", "case_id": demo_case.id}
