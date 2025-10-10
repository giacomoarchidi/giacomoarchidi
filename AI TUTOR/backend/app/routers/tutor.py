from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.db import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, Role
from app.schemas.lesson import (
    AvailabilityCreate, AvailabilityUpdate, AvailabilityResponse,
    TutorAvailabilityResponse
)
from app.services.lessons import LessonService
from app.services.availability import AvailabilityService

router = APIRouter()


@router.get("/availability", response_model=List[AvailabilityResponse])
async def get_availability(
    current_user: User = Depends(require_roles([Role.tutor])),
    db: Session = Depends(get_db)
):
    """Get tutor's availability"""
    availability_service = AvailabilityService(db)
    availability = availability_service.get_availability(current_user.id)
    return [AvailabilityResponse.model_validate(avail) for avail in availability]


@router.put("/availability", response_model=List[AvailabilityResponse])
async def set_availability(
    availability_data: List[AvailabilityCreate],
    current_user: User = Depends(require_roles([Role.tutor])),
    db: Session = Depends(get_db)
):
    """Set tutor's weekly availability"""
    availability_service = AvailabilityService(db)
    availability = availability_service.set_availability(current_user.id, availability_data)
    return [AvailabilityResponse.model_validate(avail) for avail in availability]


@router.get("/students")
async def get_assigned_students(
    current_user: User = Depends(require_roles([Role.tutor])),
    db: Session = Depends(get_db)
):
    """Get students assigned to this tutor"""
    # Get unique students from lessons
    lesson_service = LessonService(db)
    lessons = lesson_service.get_tutor_lessons(current_user.id, page=1, size=1000)
    
    student_ids = set()
    for lesson in lessons["lessons"]:
        student_ids.add(lesson.student_id)
    
    # Get student details
    students = db.query(User).filter(
        User.id.in_(student_ids),
        User.role == Role.student,
        User.is_active == True
    ).all()
    
    result = []
    for student in students:
        if student.student_profile:
            result.append({
                "id": student.id,
                "first_name": student.student_profile.first_name,
                "last_name": student.student_profile.last_name,
                "school_level": student.student_profile.school_level,
                "email": student.email
            })
    
    return {"students": result, "total": len(result)}


@router.get("/lessons")
async def get_tutor_lessons(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles([Role.tutor])),
    db: Session = Depends(get_db)
):
    """Get tutor's lessons"""
    lesson_service = LessonService(db)
    result = lesson_service.get_tutor_lessons(current_user.id, page, size)
    return result


@router.get("/stats")
async def get_tutor_stats(
    current_user: User = Depends(require_roles([Role.tutor])),
    db: Session = Depends(get_db)
):
    """Get tutor statistics"""
    lesson_service = LessonService(db)
    
    # Get all lessons for stats
    all_lessons = lesson_service.get_tutor_lessons(current_user.id, page=1, size=1000)
    lessons = all_lessons["lessons"]
    
    stats = {
        "total_lessons": len(lessons),
        "completed_lessons": len([l for l in lessons if l.status.value == "completed"]),
        "pending_lessons": len([l for l in lessons if l.status.value == "confirmed"]),
        "total_students": len(set(l.student_id for l in lessons)),
        "total_earnings": sum(l.price or 0 for l in lessons if l.status.value == "completed")
    }
    
    return stats
