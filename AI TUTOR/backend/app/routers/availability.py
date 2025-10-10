from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.db import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, Role
from app.schemas.lesson import (
    AvailabilityCreate, AvailabilityUpdate, AvailabilityResponse,
    TutorAvailabilityResponse
)
from app.services.availability import AvailabilityService

router = APIRouter()

@router.post("/", response_model=List[AvailabilityResponse], status_code=status.HTTP_201_CREATED)
async def set_availability(
    availability_data: List[AvailabilityCreate],
    current_user: User = Depends(require_roles([Role.tutor])),
    db: Session = Depends(get_db)
):
    """Imposta la disponibilità del tutor"""
    availability_service = AvailabilityService(db)
    
    availability = availability_service.set_tutor_availability(
        current_user.id, 
        availability_data
    )
    
    return [AvailabilityResponse.model_validate(av) for av in availability]

@router.get("/", response_model=List[AvailabilityResponse])
async def get_my_availability(
    current_user: User = Depends(require_roles([Role.tutor])),
    db: Session = Depends(get_db)
):
    """Ottiene la disponibilità del tutor corrente"""
    availability_service = AvailabilityService(db)
    
    availability = availability_service.get_tutor_availability(current_user.id)
    return [AvailabilityResponse.model_validate(av) for av in availability]

@router.get("/{tutor_id}", response_model=TutorAvailabilityResponse)
async def get_tutor_availability(
    tutor_id: int,
    db: Session = Depends(get_db)
):
    """Ottiene la disponibilità di un tutor specifico"""
    availability_service = AvailabilityService(db)
    
    # Verifica che il tutor esista
    from app.models.user import TutorProfile
    tutor = db.query(TutorProfile).filter(TutorProfile.user_id == tutor_id).first()
    if not tutor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tutor non trovato"
        )
    
    availability = availability_service.get_tutor_availability(tutor_id)
    next_slots = availability_service.get_next_available_slots(tutor_id)
    
    return TutorAvailabilityResponse(
        tutor_id=tutor_id,
        tutor_name=f"{tutor.first_name} {tutor.last_name}",
        availability=[AvailabilityResponse.model_validate(av) for av in availability],
        next_available_slots=next_slots
    )

@router.put("/{availability_id}", response_model=AvailabilityResponse)
async def update_availability(
    availability_id: int,
    update_data: AvailabilityUpdate,
    current_user: User = Depends(require_roles([Role.tutor])),
    db: Session = Depends(get_db)
):
    """Aggiorna una specifica disponibilità"""
    availability_service = AvailabilityService(db)
    
    availability = availability_service.update_availability(
        availability_id, 
        current_user.id, 
        update_data
    )
    
    return AvailabilityResponse.model_validate(availability)

@router.get("/search/available", response_model=List[dict])
async def search_available_tutors(
    weekday: int = Query(..., ge=0, le=6, description="Giorno della settimana (0=Lunedì, 6=Domenica)"),
    start_time: str = Query(..., pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', description="Ora di inizio (HH:MM)"),
    end_time: str = Query(..., pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', description="Ora di fine (HH:MM)"),
    subject: str = Query(None, description="Materia (opzionale)"),
    db: Session = Depends(get_db)
):
    """Cerca tutor disponibili in un determinato orario"""
    from datetime import time
    from app.models.user import TutorProfile
    
    availability_service = AvailabilityService(db)
    
    start_time_obj = time.fromisoformat(start_time)
    end_time_obj = time.fromisoformat(end_time)
    
    available_tutors = availability_service.get_available_tutors(
        weekday, start_time_obj, end_time_obj
    )
    
    # Filtra per materia se specificata
    if subject:
        available_tutors = [
            tutor for tutor in available_tutors 
            if tutor.subjects and subject.lower() in [s.lower() for s in tutor.subjects]
        ]
    
    # Formatta la risposta
    result = []
    for tutor in available_tutors:
        result.append({
            "tutor_id": tutor.user_id,
            "name": f"{tutor.first_name} {tutor.last_name}",
            "subjects": tutor.subjects,
            "hourly_rate": tutor.hourly_rate,
            "bio": tutor.bio,
            "is_verified": tutor.is_verified
        })
    
    return result

