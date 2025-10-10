from sqlalchemy import String, Boolean, Enum, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.models.base import Base, BaseModel
import enum


class Role(str, enum.Enum):
    student = "student"
    tutor = "tutor"
    parent = "parent"
    admin = "admin"


class User(Base, BaseModel):
    __tablename__ = "users"
    
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Role] = mapped_column(Enum(Role), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Relationships
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    tutor_profile = relationship("TutorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    parent_profile = relationship("ParentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    # Lessons
    student_lessons = relationship("Lesson", foreign_keys="Lesson.student_id", back_populates="student")
    tutor_lessons = relationship("Lesson", foreign_keys="Lesson.tutor_id", back_populates="tutor")
    
    # Assignments
    assigned_assignments = relationship("Assignment", foreign_keys="Assignment.tutor_id", back_populates="tutor")
    received_assignments = relationship("Assignment", foreign_keys="Assignment.student_id", back_populates="student")
    assignment_submissions = relationship("AssignmentSubmission", back_populates="student")
    
    # Files
    files = relationship("File", back_populates="owner")


class StudentProfile(Base, BaseModel):
    __tablename__ = "student_profiles"
    
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    school_level: Mapped[str] = mapped_column(String(50), nullable=True)  # elementare, media, superiore
    date_of_birth: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="student_profile")
    parent_links = relationship("StudentParent", back_populates="student", cascade="all, delete-orphan")


class TutorProfile(Base, BaseModel):
    __tablename__ = "tutor_profiles"
    
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    bio: Mapped[str] = mapped_column(String(1000), nullable=True)
    subjects: Mapped[str] = mapped_column(String(500), nullable=True)  # JSON string of subjects
    hourly_rate: Mapped[float] = mapped_column(default=15.0)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="tutor_profile")
    availability = relationship("Availability", back_populates="tutor", cascade="all, delete-orphan")


class ParentProfile(Base, BaseModel):
    __tablename__ = "parent_profiles"
    
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="parent_profile")
    student_links = relationship("StudentParent", back_populates="parent", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="parent")


# Many-to-many relationship between students and parents
class StudentParent(Base, BaseModel):
    __tablename__ = "student_parent_links"
    
    student_id: Mapped[int] = mapped_column(ForeignKey("student_profiles.id"), nullable=False)
    parent_id: Mapped[int] = mapped_column(ForeignKey("parent_profiles.id"), nullable=False)
    
    # Relationships
    student = relationship("StudentProfile", back_populates="parent_links")
    parent = relationship("ParentProfile", back_populates="student_links")