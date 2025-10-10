import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from app.models.lesson import Lesson, LessonStatus
from app.models.user import Role

class TestLessonsEndpoints:
    def test_create_lesson_student(self, client, auth_headers_student, test_user_tutor):
        """Test lesson creation by student"""
        response = client.post("/api/lessons", 
                             headers=auth_headers_student,
                             json={
                                 "tutor_id": test_user_tutor.id,
                                 "subject": "Matematica",
                                 "start_at": (datetime.utcnow() + timedelta(days=1)).isoformat(),
                                 "duration_minutes": 60,
                                 "objectives": "Ripasso algebra"
                             })
        
        assert response.status_code == 201
        data = response.json()
        assert data["lesson_id"] is not None
        assert "message" in data
    
    def test_create_lesson_unauthorized(self, client, test_user_tutor):
        """Test lesson creation without authentication"""
        response = client.post("/api/lessons", json={
            "tutor_id": test_user_tutor.id,
            "subject": "Matematica",
            "start_at": (datetime.utcnow() + timedelta(days=1)).isoformat(),
            "duration_minutes": 60
        })
        
        assert response.status_code == 401
    
    def test_create_lesson_wrong_role(self, client, auth_headers_tutor, test_user_student):
        """Test lesson creation by tutor (should fail)"""
        response = client.post("/api/lessons", 
                             headers=auth_headers_tutor,
                             json={
                                 "tutor_id": test_user_student.id,
                                 "subject": "Matematica",
                                 "start_at": (datetime.utcnow() + timedelta(days=1)).isoformat(),
                                 "duration_minutes": 60
                             })
        
        assert response.status_code == 403
    
    def test_get_lessons_student(self, client, auth_headers_student):
        """Test getting lessons for student"""
        response = client.get("/api/lessons", headers=auth_headers_student)
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data
        assert "page" in data
        assert "size" in data
    
    def test_get_lessons_tutor(self, client, auth_headers_tutor):
        """Test getting lessons for tutor"""
        response = client.get("/api/tutor/lessons", headers=auth_headers_tutor)
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data
    
    def test_get_lesson_details(self, client, auth_headers_student, db_session, test_user_student, test_user_tutor):
        """Test getting specific lesson details"""
        # Create a lesson first
        lesson = Lesson(
            student_id=test_user_student.id,
            tutor_id=test_user_tutor.id,
            subject="Matematica",
            start_at=datetime.utcnow() + timedelta(days=1),
            end_at=datetime.utcnow() + timedelta(days=1, hours=1),
            status=LessonStatus.confirmed
        )
        db_session.add(lesson)
        db_session.commit()
        db_session.refresh(lesson)
        
        response = client.get(f"/api/lessons/{lesson.id}", headers=auth_headers_student)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == lesson.id
        assert data["subject"] == "Matematica"
    
    def test_get_lesson_not_found(self, client, auth_headers_student):
        """Test getting nonexistent lesson"""
        response = client.get("/api/lessons/99999", headers=auth_headers_student)
        
        assert response.status_code == 404
    
    def test_cancel_lesson(self, client, auth_headers_student, db_session, test_user_student, test_user_tutor):
        """Test lesson cancellation"""
        # Create a lesson first
        lesson = Lesson(
            student_id=test_user_student.id,
            tutor_id=test_user_tutor.id,
            subject="Matematica",
            start_at=datetime.utcnow() + timedelta(days=1),
            end_at=datetime.utcnow() + timedelta(days=1, hours=1),
            status=LessonStatus.confirmed
        )
        db_session.add(lesson)
        db_session.commit()
        db_session.refresh(lesson)
        
        response = client.put(f"/api/lessons/{lesson.id}/cancel", headers=auth_headers_student)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "cancelled"
    
    def test_complete_lesson_tutor(self, client, auth_headers_tutor, db_session, test_user_student, test_user_tutor):
        """Test lesson completion by tutor"""
        # Create a lesson first
        lesson = Lesson(
            student_id=test_user_student.id,
            tutor_id=test_user_tutor.id,
            subject="Matematica",
            start_at=datetime.utcnow() - timedelta(hours=1),
            end_at=datetime.utcnow(),
            status=LessonStatus.confirmed
        )
        db_session.add(lesson)
        db_session.commit()
        db_session.refresh(lesson)
        
        response = client.put(f"/api/lessons/{lesson.id}/complete", 
                            headers=auth_headers_tutor,
                            json={
                                "tutor_notes": "Lezione completata con successo",
                                "objectives_achieved": True
                            })
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["tutor_notes"] == "Lezione completata con successo"
    
    def test_complete_lesson_wrong_user(self, client, auth_headers_student, db_session, test_user_student, test_user_tutor):
        """Test lesson completion by wrong user"""
        # Create a lesson first
        lesson = Lesson(
            student_id=test_user_student.id,
            tutor_id=test_user_tutor.id,
            subject="Matematica",
            start_at=datetime.utcnow() - timedelta(hours=1),
            end_at=datetime.utcnow(),
            status=LessonStatus.confirmed
        )
        db_session.add(lesson)
        db_session.commit()
        db_session.refresh(lesson)
        
        response = client.put(f"/api/lessons/{lesson.id}/complete", 
                            headers=auth_headers_student,
                            json={
                                "tutor_notes": "Lezione completata con successo",
                                "objectives_achieved": True
                            })
        
        assert response.status_code == 403
