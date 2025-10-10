import pytest
from fastapi.testclient import TestClient
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User, Role

class TestPasswordHashing:
    def test_password_hashing(self):
        """Test password hashing and verification"""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert verify_password(password, hashed)
        assert not verify_password("wrongpassword", hashed)
    
    def test_password_verification_edge_cases(self):
        """Test password verification edge cases"""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        # Test empty password
        assert not verify_password("", hashed)
        
        # Test None password
        assert not verify_password(None, hashed)

class TestJWTTokens:
    def test_create_access_token(self):
        """Test JWT token creation"""
        user_id = 1
        role = Role.student
        token = create_access_token(user_id=user_id, role=role)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_create_access_token_with_data(self):
        """Test JWT token creation with additional data"""
        user_id = 1
        role = Role.tutor
        additional_claims = {"email": "test@example.com"}
        
        token = create_access_token(
            user_id=user_id, 
            role=role, 
            additional_claims=additional_claims
        )
        
        assert token is not None
        assert isinstance(token, str)

class TestUserModel:
    def test_user_creation(self):
        """Test user model creation"""
        user = User(
            email="test@example.com",
            hashed_password="hashed_password",
            role=Role.student
        )
        
        assert user.email == "test@example.com"
        assert user.role == Role.student
        assert user.is_active == True  # Default value
    
    def test_user_roles(self):
        """Test different user roles"""
        roles = [Role.student, Role.tutor, Role.parent, Role.admin]
        
        for role in roles:
            user = User(
                email=f"{role.value}@example.com",
                hashed_password="hashed_password",
                role=role
            )
            assert user.role == role
    
    def test_user_inactive(self):
        """Test user inactive status"""
        user = User(
            email="test@example.com",
            hashed_password="hashed_password",
            role=Role.student,
            is_active=False
        )
        
        assert user.is_active == False
