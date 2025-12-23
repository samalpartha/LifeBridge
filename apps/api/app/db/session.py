from __future__ import annotations

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def _default_sqlite_url() -> str:
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data"))
    os.makedirs(base, exist_ok=True)
    return f"sqlite:///{os.path.join(base, 'lifebridge.db')}"


DATABASE_URL = os.getenv("DATABASE_URL", "").strip() or _default_sqlite_url()

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
