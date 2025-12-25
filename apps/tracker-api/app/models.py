from sqlalchemy import create_engine, Column, Integer, String, Date, Text, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL")

# Fix for Render/Supabase: Force psycopg 3 driver
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class TravelHistory(Base):
    __tablename__ = "travel_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True) # From LifeBridge Token
    country = Column(String)
    entry_date = Column(Date)
    exit_date = Column(Date, nullable=True)
    purpose = Column(String)
    port_of_entry = Column(String, nullable=True)
    class_of_admission = Column(String, nullable=True)

class EmploymentHistory(Base):
    __tablename__ = "employment_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    employer = Column(String)
    title = Column(String)
    start_date = Column(Date)
    end_date = Column(Date, nullable=True)
    city = Column(String)
    state = Column(String)

class ResidenceHistory(Base):
    __tablename__ = "residence_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    address = Column(String)
    city = Column(String)
    country = Column(String)
    start_date = Column(Date)
    end_date = Column(Date, nullable=True)

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    filename = Column(String)
    s3_key = Column(String)
    category = Column(String)
    upload_date = Column(Date)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)

class Contact(Base):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    name = Column(String)
    role = Column(String) # e.g. Attorney, Embassy, Sponsor
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)

class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    title = Column(String)
    content = Column(Text)
    note_date = Column(Date)
    linked_entity_id = Column(String, nullable=True) # Optional link to a file or history item
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    title = Column(String)
    description = Column(Text, nullable=True)
    due_date = Column(Date, nullable=True)
    status = Column(String) # pending, in_progress, completed
    priority = Column(String) # low, medium, high
    created_at = Column(Date)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)

class ImmigrationCase(Base):
    __tablename__ = "cases"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    title = Column(String) # e.g. "Spouse Visa (I-130)"
    receipt_number = Column(String, nullable=True) # e.g. IOE1234567890
    case_type = Column(String) # e.g. I-130, I-485
    status = Column(String) # Open, Closed, Pending
    filing_date = Column(Date, nullable=True)
    priority_date = Column(Date, nullable=True)

class CaseEvent(Base):
    __tablename__ = "case_events"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    event_date = Column(Date)
    title = Column(String) # "Receipt Notice Received"
    description = Column(Text, nullable=True)
    event_type = Column(String) # filing, notice, biometric, interview, decision

# Create Tables
def init_db():
    Base.metadata.create_all(bind=engine)
