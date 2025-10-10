from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, BaseModel


class ParentProfile(Base, BaseModel):
    __tablename__ = "parent_profiles"
    
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, unique=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="parent_profile")
    students = relationship("StudentProfile", secondary="student_parent", back_populates="parents")
    feedback = relationship("Feedback", back_populates="parent")
