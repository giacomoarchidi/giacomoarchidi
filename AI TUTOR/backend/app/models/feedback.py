from sqlalchemy import Integer, String, Text, ForeignKey, Enum, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.models.base import Base, BaseModel


class Feedback(Base, BaseModel):
    __tablename__ = "feedback"
    
    parent_id: Mapped[int] = mapped_column(ForeignKey("parent_profiles.id"), nullable=False)
    tutor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5 stars
    comment: Mapped[str] = mapped_column(Text, nullable=True)
    is_public: Mapped[bool] = mapped_column(default=True)  # Can be shown on tutor profile
    is_moderated: Mapped[bool] = mapped_column(default=False)  # Admin approval
    
    # Relationships
    parent = relationship("ParentProfile", back_populates="feedback")
    tutor = relationship("User")
    lesson = relationship("Lesson", back_populates="feedback")
    
    @property
    def rating_display(self) -> str:
        """Return rating as stars string"""
        return "★" * self.rating + "☆" * (5 - self.rating)
