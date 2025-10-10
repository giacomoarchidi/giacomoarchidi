from sqlalchemy import Integer, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, BaseModel


class Availability(Base, BaseModel):
    __tablename__ = "availability"
    
    tutor_id: Mapped[int] = mapped_column(ForeignKey("tutor_profiles.id"), nullable=False)
    weekday: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time: Mapped[str] = mapped_column(String(5), nullable=False)  # Format: "09:00"
    end_time: Mapped[str] = mapped_column(String(5), nullable=False)  # Format: "17:00"
    is_available: Mapped[bool] = mapped_column(default=True)
    
    # Relationships
    tutor = relationship("TutorProfile", back_populates="availability")
