from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException, status
import uuid

from app.models.lesson import Lesson, LessonStatus
from app.models.user import User, TutorProfile, StudentProfile
from app.models.availability import Availability
from app.schemas.lesson import LessonCreate, LessonUpdate, LessonResponse

class LessonService:
    def __init__(self, db: Session):
        self.db = db

    def create_lesson(self, lesson_data: LessonCreate, student_id: int) -> Lesson:
        """Crea una nuova lezione"""
        print(f"🔵 Service: Creating lesson for student_id={student_id}, tutor_id={lesson_data.tutor_id}")
        
        # Verifica che il tutor esista
        tutor = self.db.query(TutorProfile).filter(TutorProfile.user_id == lesson_data.tutor_id).first()
        if not tutor:
            print(f"❌ Tutor not found for user_id={lesson_data.tutor_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tutor non trovato"
            )
        print(f"✅ Tutor found: profile_id={tutor.id}")
        
        # Verifica che lo studente esista
        student = self.db.query(StudentProfile).filter(StudentProfile.user_id == student_id).first()
        if not student:
            print(f"❌ Student not found for user_id={student_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Studente non trovato"
            )
        print(f"✅ Student found: profile_id={student.id}")
        
        # Calcola end_at dalla durata
        end_at = lesson_data.start_at + timedelta(minutes=lesson_data.duration_minutes)
        print(f"✅ Calculated end_at: {end_at}")
        
        # Genera room slug per Jitsi
        room_slug = f"lesson-{uuid.uuid4().hex[:12]}"
        
        # Calcola il prezzo
        price = (tutor.hourly_rate / 60) * lesson_data.duration_minutes
        print(f"✅ Calculated price: €{price}")
        
        # Crea la lezione con status 'pending_payment' (in attesa conferma tutor)
        lesson = Lesson(
            student_id=student.user_id,  # Usa user_id, non profile.id
            tutor_id=tutor.user_id,      # Usa user_id, non profile.id
            subject=lesson_data.subject,
            start_at=lesson_data.start_at,
            end_at=end_at,
            status=LessonStatus.pending_payment,  # In attesa conferma tutor
            room_slug=room_slug,
            objectives=lesson_data.objectives,
            price=price
        )
        print(f"✅ Lesson object created, adding to DB...")
        
        self.db.add(lesson)
        self.db.commit()
        self.db.refresh(lesson)
        print(f"✅ Lesson saved to DB: id={lesson.id}")
        
        return lesson

    def get_lesson(self, lesson_id: int, user_id: int) -> Optional[Lesson]:
        """Ottiene una lezione per ID (con controllo autorizzazione)"""
        lesson = self.db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            return None
        
        # Verifica autorizzazione
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        # L'utente può vedere la lezione se è lo studente, il tutor, o un admin
        if (lesson.student_id == user_id or 
            lesson.tutor_id == user_id or 
            user.role.value == "admin"):
            return lesson
        
        return None

    def get_student_lessons(self, student_id: int, page: int = 1, size: int = 20) -> dict:
        """Ottiene tutte le lezioni di uno studente con paginazione"""
        query = self.db.query(Lesson).filter(Lesson.student_id == student_id).order_by(Lesson.start_at.desc())
        
        total = query.count()
        lessons = query.offset((page - 1) * size).limit(size).all()
        
        # Aggiungi il nome del tutor a ogni lezione
        for lesson in lessons:
            # Ottieni il tutor profile dal tutor_id (che è user_id)
            tutor_profile = self.db.query(TutorProfile).filter(TutorProfile.user_id == lesson.tutor_id).first()
            if tutor_profile:
                lesson.tutor_name = f"{tutor_profile.first_name} {tutor_profile.last_name}"
            else:
                # Fallback all'email dell'user
                tutor_user = self.db.query(User).filter(User.id == lesson.tutor_id).first()
                lesson.tutor_name = tutor_user.email if tutor_user else "Tutor"
        
        return {
            "lessons": lessons,
            "total": total,
            "page": page,
            "size": size
        }

    def get_tutor_lessons(self, tutor_user_id: int, page: int = 1, size: int = 20) -> dict:
        """Ottiene tutte le lezioni di un tutor con paginazione"""
        # Lesson.tutor_id è già user_id, non serve convertire
        query = self.db.query(Lesson).filter(Lesson.tutor_id == tutor_user_id).order_by(Lesson.start_at.desc())
        
        total = query.count()
        lessons = query.offset((page - 1) * size).limit(size).all()
        
        # Aggiungi il nome dello studente a ogni lezione
        for lesson in lessons:
            if lesson.student:
                student_profile = lesson.student.student_profile
                if student_profile:
                    lesson.student_name = f"{student_profile.first_name} {student_profile.last_name}"
                else:
                    lesson.student_name = lesson.student.email
            else:
                lesson.student_name = "Studente"
        
        return {
            "lessons": lessons,
            "total": total,
            "page": page,
            "size": size
        }

    def update_lesson(self, lesson_id: int, lesson_data: LessonUpdate, user_id: int) -> Optional[Lesson]:
        """Aggiorna una lezione"""
        lesson = self.get_lesson(lesson_id, user_id)
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lezione non trovata"
            )
        
        # Solo il tutor può aggiornare la lezione
        if lesson.tutor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Non autorizzato a modificare questa lezione"
            )
        
        # Aggiorna i campi
        if lesson_data.status is not None:
            lesson.status = lesson_data.status
        if lesson_data.notes_seed is not None:
            lesson.notes_seed = lesson_data.notes_seed
        
        self.db.commit()
        self.db.refresh(lesson)
        
        return lesson

    def complete_lesson(self, lesson_id: int, tutor_id: int, notes_seed: str) -> Lesson:
        """Completa una lezione e genera appunti AI"""
        lesson = self.db.query(Lesson).filter(
            and_(Lesson.id == lesson_id, Lesson.tutor_id == tutor_id)
        ).first()
        
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lezione non trovata"
            )
        
        if lesson.status != LessonStatus.confirmed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La lezione deve essere confermata prima di essere completata"
            )
        
        # Aggiorna lo stato e le note
        lesson.status = LessonStatus.completed
        lesson.notes_seed = notes_seed
        
        self.db.commit()
        self.db.refresh(lesson)
        
        # TODO: Trigger AI task per generare appunti
        # generate_lesson_notes.delay(lesson.id)
        
        return lesson

    def cancel_lesson(self, lesson_id: int, user_id: int) -> Lesson:
        """Cancella una lezione"""
        lesson = self.get_lesson(lesson_id, user_id)
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lezione non trovata"
            )
        
        # Solo studente o tutor possono cancellare
        if lesson.student_id != user_id and lesson.tutor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Non autorizzato a cancellare questa lezione"
            )
        
        lesson.status = LessonStatus.cancelled
        self.db.commit()
        self.db.refresh(lesson)
        
        return lesson

    def _check_tutor_availability(self, tutor_id: int, start_at: datetime, end_at: datetime) -> bool:
        """Verifica se il tutor ha disponibilità nell'orario richiesto"""
        weekday = start_at.weekday()
        start_time = start_at.time()
        end_time = end_at.time()
        
        availability = self.db.query(Availability).filter(
            and_(
                Availability.tutor_id == tutor_id,
                Availability.weekday == weekday,
                Availability.start_time <= start_time,
                Availability.end_time >= end_time
            )
        ).first()
        
        return availability is not None

    def _check_lesson_conflicts(self, tutor_id: int, start_at: datetime, end_at: datetime) -> bool:
        """Verifica se ci sono conflitti con altre lezioni"""
        conflicting_lesson = self.db.query(Lesson).filter(
            and_(
                Lesson.tutor_id == tutor_id,
                or_(
                    and_(Lesson.start_at < end_at, Lesson.end_at > start_at)
                ),
                Lesson.status.in_([LessonStatus.confirmed, LessonStatus.in_progress])
            )
        ).first()
        
        return conflicting_lesson is not None

    def get_upcoming_lessons(self, user_id: int, user_role: str) -> List[Lesson]:
        """Ottiene le prossime lezioni per un utente"""
        now = datetime.utcnow()
        
        if user_role == "student":
            return self.db.query(Lesson).filter(
                and_(
                    Lesson.student_id == user_id,
                    Lesson.start_at > now,
                    Lesson.status == LessonStatus.confirmed
                )
            ).order_by(Lesson.start_at).all()
        elif user_role == "tutor":
            return self.db.query(Lesson).filter(
                and_(
                    Lesson.tutor_id == user_id,
                    Lesson.start_at > now,
                    Lesson.status == LessonStatus.confirmed
                )
            ).order_by(Lesson.start_at).all()
        
        return []