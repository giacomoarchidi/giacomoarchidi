from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime
from app.core.db import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.agora import AgoraService
from app.routers.auth import require_roles
from app.models.user import Role
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class JoinRoomRequest(BaseModel):
    lesson_id: int

class JoinRoomResponse(BaseModel):
    token: str
    app_id: str
    channel: str
    uid: int
    expires_at: int
    lesson_id: int

class RoomStatus(BaseModel):
    lesson_id: int
    channel: str
    is_active: bool
    participants_count: int
    start_time: str
    end_time: str

@router.post("/join", response_model=JoinRoomResponse)
async def join_video_room(
    request: JoinRoomRequest,
    current_user: User = Depends(require_roles([Role.student, Role.tutor])),
    db: Session = Depends(get_db)
):
    """
    Genera token per entrare nella video room della lezione
    """
    try:
        agora_service = AgoraService(db)
        
        # Genera nome canale e UID
        channel_name = agora_service.generate_channel_name(request.lesson_id)
        uid = agora_service.generate_uid(current_user.id)
        
        # Genera token RTC
        token_data = agora_service.generate_rtc_token(
            lesson_id=request.lesson_id,
            user_id=current_user.id,
            channel_name=channel_name,
            uid=uid
        )
        
        logger.info(f"Utente {current_user.id} ha richiesto accesso alla lezione {request.lesson_id}")
        
        return JoinRoomResponse(**token_data)
        
    except ValueError as e:
        logger.warning(f"Accesso negato alla lezione {request.lesson_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Errore join video room: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore interno del server"
        )

@router.get("/room/{lesson_id}/status", response_model=RoomStatus)
async def get_room_status(
    lesson_id: int,
    current_user: User = Depends(require_roles([Role.student, Role.tutor])),
    db: Session = Depends(get_db)
):
    """
    Ottieni lo status della video room
    """
    try:
        agora_service = AgoraService(db)
        
        # Verifica accesso
        if not agora_service.validate_lesson_access(lesson_id, current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accesso negato alla lezione"
            )
        
        # Ottieni dettagli lezione
        from app.models.lesson import Lesson
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lezione non trovata"
            )
        
        channel_name = agora_service.generate_channel_name(lesson_id)
        
        return RoomStatus(
            lesson_id=lesson_id,
            channel=channel_name,
            is_active=lesson.status == "confirmed",
            participants_count=0,  # TODO: Implementare contatore partecipanti real-time
            start_time=lesson.start_at.isoformat(),
            end_time=lesson.end_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore get room status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore interno del server"
        )

@router.post("/room/{lesson_id}/start-recording")
async def start_recording(
    lesson_id: int,
    current_user: User = Depends(require_roles([Role.tutor])),
    db: Session = Depends(get_db)
):
    """
    Avvia registrazione della lezione (solo tutor)
    """
    try:
        agora_service = AgoraService(db)
        
        # Verifica che sia il tutor della lezione
        from app.models.lesson import Lesson
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson or lesson.tutor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo il tutor può avviare la registrazione"
            )
        
        # TODO: Implementare start recording con Agora Cloud Recording API
        logger.info(f"Tutor {current_user.id} ha avviato registrazione per lezione {lesson_id}")
        
        return {
            "message": "Registrazione avviata",
            "lesson_id": lesson_id,
            "recording_id": f"recording_{lesson_id}_{int(datetime.utcnow().timestamp())}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore start recording: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore interno del server"
        )

@router.post("/room/{lesson_id}/stop-recording")
async def stop_recording(
    lesson_id: int,
    current_user: User = Depends(require_roles([Role.tutor])),
    db: Session = Depends(get_db)
):
    """
    Ferma registrazione della lezione (solo tutor)
    """
    try:
        agora_service = AgoraService(db)
        
        # Verifica che sia il tutor della lezione
        from app.models.lesson import Lesson
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson or lesson.tutor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo il tutor può fermare la registrazione"
            )
        
        # TODO: Implementare stop recording con Agora Cloud Recording API
        logger.info(f"Tutor {current_user.id} ha fermato registrazione per lezione {lesson_id}")
        
        return {
            "message": "Registrazione fermata",
            "lesson_id": lesson_id,
            "recording_url": f"https://example.com/recordings/{lesson_id}.mp4"  # TODO: URL reale
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore stop recording: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore interno del server"
        )
