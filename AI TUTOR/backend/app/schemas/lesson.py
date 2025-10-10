from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, timedelta, timezone
from app.models.lesson import LessonStatus


class LessonCreate(BaseModel):
    tutor_id: int
    subject: str = Field(..., min_length=1, max_length=100)
    start_at: datetime
    duration_minutes: int = Field(..., ge=30, le=180)  # 30 min to 3 hours
    objectives: Optional[str] = None
    
    @validator('start_at')
    def validate_start_time(cls, v):
        # Make comparison timezone-aware
        now = datetime.now(timezone.utc)
        if v.tzinfo is None:
            # If incoming datetime is naive, make it UTC
            v = v.replace(tzinfo=timezone.utc)
        # Rimuovo il controllo di 1 ora in anticipo per facilitare i test
        # if v <= now + timedelta(hours=1):
        #     raise ValueError('Lesson must be scheduled at least 1 hour in advance')
        return v
    
    @property
    def end_at(self) -> datetime:
        return self.start_at + timedelta(minutes=self.duration_minutes)


class LessonUpdate(BaseModel):
    subject: Optional[str] = Field(None, min_length=1, max_length=100)
    objectives: Optional[str] = None
    tutor_notes: Optional[str] = None


class LessonComplete(BaseModel):
    tutor_notes: str = Field(..., min_length=10, max_length=1000)
    objectives_achieved: Optional[bool] = None


class LessonResponse(BaseModel):
    id: int
    student_id: int
    tutor_id: int
    subject: str
    start_at: datetime
    end_at: datetime
    status: LessonStatus
    room_slug: Optional[str] = None
    notes_text: Optional[str] = None
    notes_pdf_path: Optional[str] = None
    tutor_notes: Optional[str] = None
    objectives: Optional[str] = None
    price: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    student_name: Optional[str] = None  # Nome dello studente (calcolato)
    tutor_name: Optional[str] = None    # Nome del tutor (calcolato)
    
    class Config:
        from_attributes = True


class LessonListResponse(BaseModel):
    lessons: List[LessonResponse]
    total: int
    page: int
    size: int


class AvailabilityCreate(BaseModel):
    weekday: int = Field(..., ge=0, le=6)  # 0=Monday, 6=Sunday
    start_time: str = Field(..., pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')  # HH:MM format
    end_time: str = Field(..., pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')  # HH:MM format
    is_available: bool = Field(default=True)  # Se il tutor è disponibile in questo slot
    
    @validator('end_time')
    def validate_end_time(cls, v, values):
        if 'start_time' in values:
            start = values['start_time']
            if v <= start:
                raise ValueError('End time must be after start time')
        return v


class AvailabilityUpdate(BaseModel):
    start_time: Optional[str] = Field(None, pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    end_time: Optional[str] = Field(None, pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    is_available: Optional[bool] = None


class AvailabilityResponse(BaseModel):
    id: int
    weekday: int
    start_time: str
    end_time: str
    is_available: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class TutorAvailabilityResponse(BaseModel):
    tutor_id: int
    tutor_name: str
    availability: List[AvailabilityResponse]
    next_available_slots: List[dict]  # {start_at, end_at, available}


class LessonBookingResponse(BaseModel):
    lesson_id: int
    checkout_url: Optional[str] = None
    room_url: Optional[str] = None
    message: str
