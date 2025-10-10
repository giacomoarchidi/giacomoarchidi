from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.db import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, Role, TutorProfile
from app.models.lesson import Lesson
from app.models.availability import Availability
from app.schemas.lesson import (
    LessonCreate, LessonUpdate, LessonComplete, LessonResponse, 
    LessonListResponse, LessonBookingResponse
)
from app.services.lessons import LessonService
from pydantic import BaseModel

router = APIRouter()


# Schema per la risposta dei tutor
class AvailabilitySlot(BaseModel):
    weekday: int
    start_time: str
    end_time: str

class TutorSearchResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    bio: Optional[str]
    subjects: List[str]
    hourly_rate: float
    is_verified: bool
    rating: Optional[float] = 5.0
    total_lessons: Optional[int] = 0
    availability: List[AvailabilitySlot] = []

    class Config:
        from_attributes = True


@router.get("/tutors/subject/{subject}", response_model=List[TutorSearchResponse])
async def get_tutors_by_subject(
    subject: str,
    db: Session = Depends(get_db)
):
    """Get all tutors that teach a specific subject"""
    # Cerca tutti i tutor che hanno questa materia
    # Le materie sono salvate come stringa tipo "{matematica,fisica}"
    # quindi usiamo LIKE per la ricerca
    tutors = db.query(TutorProfile).filter(
        TutorProfile.subjects.like(f'%{subject}%')
    ).all()
    
    result = []
    for tutor_profile in tutors:
        # Ottieni l'user associato
        user = db.query(User).filter(User.id == tutor_profile.user_id).first()
        if not user:
            continue
            
        # Ottieni la disponibilità
        availability_slots = db.query(Availability).filter(
            Availability.tutor_id == tutor_profile.id,
            Availability.is_available == True
        ).all()
        
        # Conta le lezioni completate per rating/statistiche
        total_lessons = db.query(Lesson).filter(
            Lesson.tutor_id == tutor_profile.id,
            Lesson.status == 'completed'
        ).count()
        
        # Converti subjects da stringa a lista
        # subjects è salvato come "{matematica,fisica}" o "{matematica}"
        subjects_str = tutor_profile.subjects
        if isinstance(subjects_str, str):
            # Rimuovi { } e splitta per virgola
            subjects_list = subjects_str.strip('{}').split(',') if subjects_str else []
        else:
            subjects_list = subjects_str if subjects_str else []
        
        result.append(TutorSearchResponse(
            id=user.id,  # Usa user.id invece di tutor_profile.id
            email=user.email,
            first_name=tutor_profile.first_name,
            last_name=tutor_profile.last_name,
            bio=tutor_profile.bio,
            subjects=subjects_list,
            hourly_rate=tutor_profile.hourly_rate,
            is_verified=tutor_profile.is_verified,
            total_lessons=total_lessons,
            availability=[
                AvailabilitySlot(
                    weekday=slot.weekday,
                    start_time=slot.start_time,
                    end_time=slot.end_time
                ) for slot in availability_slots
            ]
        ))
    
    return result


@router.post("/", response_model=LessonBookingResponse, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    lesson_data: LessonCreate,
    current_user: User = Depends(require_roles([Role.student])),
    db: Session = Depends(get_db)
):
    """Create a new lesson booking"""
    try:
        print(f"🔵 Creating lesson: tutor_id={lesson_data.tutor_id}, student_id={current_user.id}")
        lesson_service = LessonService(db)
        lesson = lesson_service.create_lesson(lesson_data, current_user.id)
        print(f"✅ Lesson created: id={lesson.id}, status={lesson.status}")
        
        # Ritorna la risposta
        return LessonBookingResponse(
            lesson_id=lesson.id,
            message="Richiesta di lezione inviata! Il tutor dovrà confermare.",
            room_url=None,
            checkout_url=None
        )
    except Exception as e:
        print(f"❌ Error creating lesson: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


@router.get("/", response_model=LessonListResponse)
async def get_lessons(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get lessons for current user"""
    lesson_service = LessonService(db)
    
    if current_user.role == Role.student:
        result = lesson_service.get_student_lessons(current_user.id, page, size)
    elif current_user.role == Role.tutor:
        result = lesson_service.get_tutor_lessons(current_user.id, page, size)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    lessons_response = [LessonResponse.model_validate(lesson) for lesson in result["lessons"]]
    
    return LessonListResponse(
        lessons=lessons_response,
        total=result["total"],
        page=result["page"],
        size=result["size"]
    )


@router.get("/{lesson_id}", response_model=LessonResponse)
async def get_lesson(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get lesson details"""
    lesson_service = LessonService(db)
    lesson = lesson_service.get_lesson(lesson_id, current_user.id, current_user.role)
    return LessonResponse.model_validate(lesson)


@router.put("/{lesson_id}/complete", response_model=LessonResponse)
async def complete_lesson(
    lesson_id: int,
    completion_data: LessonComplete,
    current_user: User = Depends(require_roles([Role.tutor])),
    db: Session = Depends(get_db)
):
    """Mark lesson as completed"""
    lesson_service = LessonService(db)
    lesson = lesson_service.complete_lesson(lesson_id, current_user.id, completion_data.tutor_notes)
    return LessonResponse.model_validate(lesson)


@router.put("/{lesson_id}/confirm", response_model=LessonResponse)
async def confirm_lesson(
    lesson_id: int,
    current_user: User = Depends(require_roles([Role.tutor])),
    db: Session = Depends(get_db)
):
    """Confirm a pending lesson request (tutor only)"""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Verifica che il tutor sia quello della lezione
    # lesson.tutor_id è user_id, non profile_id
    if lesson.tutor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only confirm your own lessons"
        )
    
    if lesson.status not in ['pending_payment']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot confirm lesson with status: {lesson.status}"
        )
    
    lesson.status = 'confirmed'
    db.commit()
    db.refresh(lesson)
    
    return LessonResponse.model_validate(lesson)


@router.put("/{lesson_id}/reject", response_model=LessonResponse)
async def reject_lesson(
    lesson_id: int,
    current_user: User = Depends(require_roles([Role.tutor])),
    db: Session = Depends(get_db)
):
    """Reject a pending lesson request (tutor only)"""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Verifica che il tutor sia quello della lezione
    # lesson.tutor_id è user_id, non profile_id
    if lesson.tutor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only reject your own lessons"
        )
    
    if lesson.status not in ['pending_payment']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reject lesson with status: {lesson.status}"
        )
    
    lesson.status = 'cancelled'
    db.commit()
    db.refresh(lesson)
    
    return LessonResponse.model_validate(lesson)


@router.put("/{lesson_id}/cancel", response_model=LessonResponse)
async def cancel_lesson(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a lesson"""
    lesson_service = LessonService(db)
    lesson = lesson_service.cancel_lesson(lesson_id, current_user.id, current_user.role)
    return LessonResponse.model_validate(lesson)


@router.put("/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: int,
    update_data: LessonUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update lesson details"""
    lesson_service = LessonService(db)
    lesson = lesson_service.get_lesson(lesson_id, current_user.id, current_user.role)
    
    # Only allow updates if user is the tutor or admin
    if current_user.role not in [Role.tutor, Role.admin] or lesson.tutor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only tutor can update lesson details"
        )
    
    # Update fields
    if update_data.subject:
        lesson.subject = update_data.subject
    if update_data.objectives:
        lesson.objectives = update_data.objectives
    if update_data.tutor_notes:
        lesson.tutor_notes = update_data.tutor_notes
    
    db.commit()
    db.refresh(lesson)
    
    return LessonResponse.model_validate(lesson)
