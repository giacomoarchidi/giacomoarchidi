from datetime import datetime, time
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import HTTPException, status

from app.models.availability import Availability
from app.models.user import TutorProfile
from app.schemas.lesson import AvailabilityCreate, AvailabilityUpdate, AvailabilityResponse

class AvailabilityService:
    def __init__(self, db: Session):
        self.db = db

    def get_availability(self, user_id: int) -> List[Availability]:
        """Ottiene la disponibilità di un tutor (dal user_id)"""
        # Trova il profilo tutor
        tutor = self.db.query(TutorProfile).filter(TutorProfile.user_id == user_id).first()
        if not tutor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profilo tutor non trovato"
            )
        
        return self.db.query(Availability).filter(Availability.tutor_id == tutor.id).all()

    def set_availability(self, user_id: int, availability_data: List[AvailabilityCreate]) -> List[Availability]:
        """Imposta la disponibilità di un tutor (dal user_id)"""
        # Trova il profilo tutor
        tutor = self.db.query(TutorProfile).filter(TutorProfile.user_id == user_id).first()
        if not tutor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profilo tutor non trovato"
            )
        
        # Rimuovi disponibilità esistenti
        self.db.query(Availability).filter(Availability.tutor_id == tutor.id).delete()
        
        # Aggiungi nuova disponibilità
        new_availability = []
        for av_data in availability_data:
            availability = Availability(
                tutor_id=tutor.id,
                weekday=av_data.weekday,
                start_time=av_data.start_time,
                end_time=av_data.end_time,
                is_available=av_data.is_available
            )
            self.db.add(availability)
            new_availability.append(availability)
        
        self.db.commit()
        
        # Refresh degli oggetti
        for av in new_availability:
            self.db.refresh(av)
        
        return new_availability

    def get_tutor_availability(self, tutor_id: int) -> List[Availability]:
        """Ottiene la disponibilità di un tutor"""
        # Verifica che il tutor esista
        tutor = self.db.query(TutorProfile).filter(TutorProfile.user_id == tutor_id).first()
        if not tutor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tutor non trovato"
            )
        
        return self.db.query(Availability).filter(Availability.tutor_id == tutor_id).all()

    def update_tutor_availability(self, tutor_id: int, availability_data: List[AvailabilityCreate]) -> List[Availability]:
        """Aggiorna la disponibilità di un tutor"""
        # Verifica che il tutor esista
        tutor = self.db.query(TutorProfile).filter(TutorProfile.user_id == tutor_id).first()
        if not tutor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tutor non trovato"
            )
        
        # Rimuovi disponibilità esistenti
        existing_availability = self.db.query(Availability).filter(Availability.tutor_id == tutor_id).all()
        for av in existing_availability:
            self.db.delete(av)
        
        # Aggiungi nuova disponibilità
        new_availability = []
        for av_data in availability_data:
            availability = Availability(
                tutor_id=tutor_id,
                weekday=av_data.weekday,
                start_time=av_data.start_time,
                end_time=av_data.end_time,
                is_available=av_data.is_available
            )
            self.db.add(availability)
            new_availability.append(availability)
        
        self.db.commit()
        
        # Refresh degli oggetti
        for av in new_availability:
            self.db.refresh(av)
        
        return new_availability

    def get_available_slots(self, tutor_id: int, date: datetime) -> List[dict]:
        """Ottiene gli slot disponibili per un tutor in una data specifica"""
        weekday = date.weekday()
        
        # Ottieni la disponibilità per il giorno della settimana
        availability = self.db.query(Availability).filter(
            and_(
                Availability.tutor_id == tutor_id,
                Availability.weekday == weekday,
                Availability.is_available == True
            )
        ).first()
        
        if not availability:
            return []
        
        # TODO: Implementare logica per generare slot di 1 ora
        # basandosi su start_time e end_time
        slots = []
        start_hour = availability.start_time.hour
        end_hour = availability.end_time.hour
        
        for hour in range(start_hour, end_hour):
            slot_start = datetime.combine(date.date(), time(hour, 0))
            slot_end = datetime.combine(date.date(), time(hour + 1, 0))
            
            slots.append({
                "start_at": slot_start,
                "end_at": slot_end,
                "available": True  # TODO: Verificare conflitti con lezioni esistenti
            })
        
        return slots