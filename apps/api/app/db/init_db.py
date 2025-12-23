from __future__ import annotations

from .session import engine
from .models import Base


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
