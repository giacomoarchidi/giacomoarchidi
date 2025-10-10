from sqlalchemy import String, ForeignKey, Float, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, BaseModel


class TutorProfile(Base, BaseModel):
    __tablename__ = "tutor_profiles"
    
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, unique=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    bio: Mapped[str] = mapped_column(String(1000), nullable=True)
    subjects: Mapped[list] = mapped_column(JSON, nullable=True, default=list)
    hourly_rate: Mapped[float] = mapped_column(Float, nullable=False, default=15.0)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    is_verified: Mapped[bool] = mapped_column(default=False)
    
    # Relationships
    user = relationship("User", back_populates="tutor_profile")
    availability = relationship("Availability", back_populates="tutor")
    lessons = relationship("Lesson", back_populates="tutor", foreign_keys="Lesson.tutor_id")
    assignments = relationship("Assignment", back_populates="tutor")
    feedback = relationship("Feedback", back_populates="tutor")
