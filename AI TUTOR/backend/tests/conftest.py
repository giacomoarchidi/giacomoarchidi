import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.db import get_db, Base
from app.core.config import settings
from app.models.user import User, Role
from app.core.security import get_password_hash

# Test database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

# Create test engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override get_db dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def db_engine():
    """Create database engine for testing"""
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(db_engine):
    """Create database session for testing"""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    """Create test client"""
    return TestClient(app)

@pytest.fixture
def test_user_student(db_session):
    """Create test student user"""
    user = User(
        email="student@test.com",
        hashed_password=get_password_hash("testpassword"),
        role=Role.student,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_user_tutor(db_session):
    """Create test tutor user"""
    user = User(
        email="tutor@test.com",
        hashed_password=get_password_hash("testpassword"),
        role=Role.tutor,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_user_parent(db_session):
    """Create test parent user"""
    user = User(
        email="parent@test.com",
        hashed_password=get_password_hash("testpassword"),
        role=Role.parent,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_user_admin(db_session):
    """Create test admin user"""
    user = User(
        email="admin@test.com",
        hashed_password=get_password_hash("testpassword"),
        role=Role.admin,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def auth_headers_student(client, test_user_student):
    """Get auth headers for student user"""
    response = client.post("/api/auth/login", json={
        "email": "student@test.com",
        "password": "testpassword"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def auth_headers_tutor(client, test_user_tutor):
    """Get auth headers for tutor user"""
    response = client.post("/api/auth/login", json={
        "email": "tutor@test.com",
        "password": "testpassword"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def auth_headers_admin(client, test_user_admin):
    """Get auth headers for admin user"""
    response = client.post("/api/auth/login", json={
        "email": "admin@test.com",
        "password": "testpassword"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
