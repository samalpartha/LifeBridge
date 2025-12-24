from sqlalchemy import create_engine, Column, Integer, String, Date, Text, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL")

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
    category = Column(String)
    upload_date = Column(Date)

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

# Create Tables
def init_db():
    Base.metadata.create_all(bind=engine)
