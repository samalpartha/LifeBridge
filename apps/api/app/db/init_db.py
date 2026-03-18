from __future__ import annotations

from .models import Base
from .session import engine


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
