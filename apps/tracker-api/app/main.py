from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
from .models import init_db, SessionLocal, TravelHistory, EmploymentHistory, ResidenceHistory

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

# --- Documents ---
class DocumentEntry(BaseModel):
    filename: str
    category: str
    s3_key: Optional[str] = None
    upload_date: Optional[date] = None

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
