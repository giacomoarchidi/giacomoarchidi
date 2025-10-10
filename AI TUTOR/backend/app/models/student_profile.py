from sqlalchemy import String, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, BaseModel
import enum


class SchoolLevel(str, enum.Enum):
    elementari = "elementari"
    medie = "medie"
    superiori = "superiori"
    universita = "universita"


class StudentProfile(Base, BaseModel):
    __tablename__ = "student_profiles"
    
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, unique=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    school_level: Mapped[SchoolLevel] = mapped_column(Enum(SchoolLevel), nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    bio: Mapped[str] = mapped_column(String(500), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="student_profile")
    parents = relationship("ParentProfile", secondary="student_parent", back_populates="students")
    lessons = relationship("Lesson", back_populates="student", foreign_keys="Lesson.student_id")
    assignments = relationship("Assignment", back_populates="student")
    payments = relationship("Payment", back_populates="student")
    reports = relationship("Report", back_populates="student")
