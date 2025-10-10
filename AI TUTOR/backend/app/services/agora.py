from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from agora_token_builder import RtcTokenBuilder
from app.core.config import settings
from app.models.lesson import Lesson
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

class AgoraService:
    def __init__(self, db: Session):
        self.db = db
    
    def generate_rtc_token(
        self, 
        lesson_id: int, 
        user_id: int, 
        channel_name: str,
        uid: int
    ) -> dict:
        """
        Genera un token RTC sicuro per Agora
        """
        try:
            # Verifica che l'utente abbia accesso alla lezione
            lesson = self.db.query(Lesson).filter(Lesson.id == lesson_id).first()
            if not lesson:
                raise ValueError("Lezione non trovata")
            
            # Verifica che l'utente sia studente o tutor della lezione
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError("Utente non trovato")
            
            if lesson.student_id != user_id and lesson.tutor_id != user_id:
                raise ValueError("Accesso negato alla lezione")
            
            # Verifica che la lezione sia confermata
            if lesson.status != "confirmed":
                raise ValueError("La lezione deve essere confermata per accedere alla video call")
            
            # Calcola scadenza token (24 ore da ora)
            token_expiry = int((datetime.utcnow() + timedelta(hours=24)).timestamp())
            
            # Genera token RTC sicuro
            token = RtcTokenBuilder.buildTokenWithUid(
                settings.AGORA_APP_ID,
                settings.AGORA_APP_CERTIFICATE,
                channel_name,
                uid,
                1,  # Role_Publisher = 1: Permette pubblicare video/audio
                token_expiry
            )
            
            logger.info(f"Token generato per lezione {lesson_id}, utente {user_id}")
            
            return {
                "token": token,
                "app_id": settings.AGORA_APP_ID,
                "channel": channel_name,
                "uid": uid,
                "expires_at": token_expiry,
                "lesson_id": lesson_id
            }
            
        except Exception as e:
            logger.error(f"Errore generazione token Agora: {str(e)}")
            raise
    
    def generate_channel_name(self, lesson_id: int) -> str:
        """
        Genera un nome canale univoco per la lezione
        """
        return f"lesson_{lesson_id}"
    
    def generate_uid(self, user_id: int) -> int:
        """
        Genera un UID univoco per l'utente (basato su user_id)
        """
        # UID deve essere un intero positivo, usiamo user_id + offset per evitare conflitti
        return user_id + 10000
    
    def validate_lesson_access(self, lesson_id: int, user_id: int) -> bool:
        """
        Valida che l'utente possa accedere alla lezione
        """
        lesson = self.db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            return False
        
        return lesson.student_id == user_id or lesson.tutor_id == user_id
