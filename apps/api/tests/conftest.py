"""Test configuration and fixtures.

Based on FastAPI best practices:
https://github.com/fastapi/full-stack-fastapi-template
"""
import os

os.environ["ENVIRONMENT"] = "local"
os.environ["GRADIENT_RUNTIME_MODE"] = "mock"
os.environ["GRADIENT_ACCESS_TOKEN"] = "test-unused"
os.environ["GRADIENT_WORKSPACE_ID"] = "test-unused"
os.environ["GRADIENT_AGENT_ENDPOINT"] = "https://test.invalid"
os.environ["GRADIENT_AGENT_ACCESS_KEY"] = "test-unused"
os.environ["GOOGLE_API_KEY"] = os.environ.get("GOOGLE_API_KEY", "test-key")

import pytest
from app.api.crisis import get_db as get_crisis_db
from app.db.models import Base
from app.main import app, get_db
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for tests."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    yield TestingSessionLocal()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client():
    """Create a test client with overridden database."""
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_crisis_db] = override_get_db
    Base.metadata.create_all(bind=engine)

    with TestClient(app) as test_client:
        yield test_client

    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()

