import pytest
from fastapi.testclient import TestClient
from app.models.user import Role

class TestAuthEndpoints:
    def test_register_student(self, client):
        """Test student registration"""
        response = client.post("/api/auth/register", json={
            "email": "newstudent@test.com",
            "password": "testpassword123",
            "role": "student",
            "first_name": "John",
            "last_name": "Doe",
            "school_level": "superiori"
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newstudent@test.com"
        assert data["role"] == "student"
        assert "id" in data
        assert "created_at" in data
    
    def test_register_tutor(self, client):
        """Test tutor registration"""
        response = client.post("/api/auth/register", json={
            "email": "newtutor@test.com",
            "password": "testpassword123",
            "role": "tutor",
            "first_name": "Jane",
            "last_name": "Smith",
            "subjects": "Matematica, Fisica",
            "hourly_rate": 25.0,
            "bio": "Esperto in matematica e fisica"
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newtutor@test.com"
        assert data["role"] == "tutor"
    
    def test_register_parent(self, client):
        """Test parent registration"""
        response = client.post("/api/auth/register", json={
            "email": "newparent@test.com",
            "password": "testpassword123",
            "role": "parent",
            "first_name": "Parent",
            "last_name": "User"
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newparent@test.com"
        assert data["role"] == "parent"
    
    def test_register_duplicate_email(self, client, test_user_student):
        """Test registration with duplicate email"""
        response = client.post("/api/auth/register", json={
            "email": "student@test.com",  # Same as test_user_student
            "password": "testpassword123",
            "role": "student",
            "first_name": "Another",
            "last_name": "Student"
        })
        
        assert response.status_code == 400
        assert "email" in response.json()["detail"].lower()
    
    def test_login_success(self, client, test_user_student):
        """Test successful login"""
        response = client.post("/api/auth/login", json={
            "email": "student@test.com",
            "password": "testpassword"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
    
    def test_login_wrong_password(self, client, test_user_student):
        """Test login with wrong password"""
        response = client.post("/api/auth/login", json={
            "email": "student@test.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()
    
    def test_login_nonexistent_user(self, client):
        """Test login with nonexistent user"""
        response = client.post("/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "testpassword"
        })
        
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()
    
    def test_get_profile(self, client, auth_headers_student):
        """Test getting user profile"""
        response = client.get("/api/auth/me", headers=auth_headers_student)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "student@test.com"
        assert data["role"] == "student"
    
    def test_get_profile_unauthorized(self, client):
        """Test getting profile without authentication"""
        response = client.get("/api/auth/me")
        
        assert response.status_code == 401
    
    def test_change_password(self, client, auth_headers_student):
        """Test password change"""
        response = client.put("/api/auth/password", 
                            headers=auth_headers_student,
                            json={
                                "current_password": "testpassword",
                                "new_password": "newpassword123"
                            })
        
        assert response.status_code == 200
        assert "message" in response.json()
    
    def test_change_password_wrong_current(self, client, auth_headers_student):
        """Test password change with wrong current password"""
        response = client.put("/api/auth/password", 
                            headers=auth_headers_student,
                            json={
                                "current_password": "wrongpassword",
                                "new_password": "newpassword123"
                            })
        
        assert response.status_code == 400
        assert "invalid" in response.json()["detail"].lower()
    
    def test_deactivate_account(self, client, auth_headers_student):
        """Test account deactivation"""
        response = client.delete("/api/auth/deactivate", 
                               headers=auth_headers_student)
        
        assert response.status_code == 200
        assert "message" in response.json()
    
    def test_login_deactivated_account(self, client, test_user_student, auth_headers_student):
        """Test login with deactivated account"""
        # First deactivate the account
        client.delete("/api/auth/deactivate", headers=auth_headers_student)
        
        # Try to login
        response = client.post("/api/auth/login", json={
            "email": "student@test.com",
            "password": "testpassword"
        })
        
        assert response.status_code == 401
