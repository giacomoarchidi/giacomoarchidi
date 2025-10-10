from sqlalchemy import String, Enum, DateTime, ForeignKey, Float, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timedelta
from app.models.base import Base, BaseModel
import enum
import uuid


class LessonStatus(str, enum.Enum):
    pending_payment = "pending_payment"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"


class Lesson(Base, BaseModel):
    __tablename__ = "lessons"
    
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    tutor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    subject: Mapped[str] = mapped_column(String(100), nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[LessonStatus] = mapped_column(Enum(LessonStatus), default=LessonStatus.pending_payment)
    room_slug: Mapped[str] = mapped_column(String(100), nullable=True)  # Jitsi room identifier
    notes_text: Mapped[str] = mapped_column(Text, nullable=True)  # AI-generated notes
    notes_pdf_path: Mapped[str] = mapped_column(String(500), nullable=True)  # Path to PDF notes
    tutor_notes: Mapped[str] = mapped_column(Text, nullable=True)  # Tutor's manual notes/seed for AI
    objectives: Mapped[str] = mapped_column(Text, nullable=True)  # Lesson objectives
    price: Mapped[float] = mapped_column(Float, nullable=True)  # Price in EUR
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id], back_populates="student_lessons")
    tutor = relationship("User", foreign_keys=[tutor_id], back_populates="tutor_lessons")
    payments = relationship("Payment", back_populates="lesson", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="lesson", cascade="all, delete-orphan")
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.room_slug:
            self.room_slug = f"lesson-{uuid.uuid4().hex}"
    
    @property
    def duration_minutes(self) -> int:
        """Calculate lesson duration in minutes"""
        if self.end_at and self.start_at:
            delta = self.end_at - self.start_at
            return int(delta.total_seconds() / 60)
        return 0
    
    @property
    def is_upcoming(self) -> bool:
        """Check if lesson is upcoming (within next 24 hours)"""
        if not self.start_at:
            return False
        now = datetime.utcnow()
        time_until = (self.start_at - now).total_seconds()
        return 0 < time_until <= 24 * 3600  # Within 24 hours
    
    @property
    def can_enter_room(self) -> bool:
        """Check if student/tutor can enter the lesson room"""
        if self.status != LessonStatus.confirmed:
            return False
        
        if not self.start_at:
            return False
        
        now = datetime.utcnow()
        # Can enter 15 minutes before start time
        return now >= (self.start_at - datetime.timedelta(minutes=15))
