from sqlalchemy import String, Text, DateTime, ForeignKey, Enum, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.models.base import Base, BaseModel
import enum


class ReportStatus(str, enum.Enum):
    draft = "draft"
    generating = "generating"
    published = "published"
    failed = "failed"


class Report(Base, BaseModel):
    __tablename__ = "reports"
    
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    period_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=True)  # AI-generated report text
    pdf_path: Mapped[str] = mapped_column(String(500), nullable=True)  # Path to PDF report
    status: Mapped[ReportStatus] = mapped_column(Enum(ReportStatus), default=ReportStatus.draft)
    lessons_count: Mapped[int] = mapped_column(Integer, default=0)
    average_rating: Mapped[float] = mapped_column(default=0.0)
    key_achievements: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string
    areas_for_improvement: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string
    recommendations: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string
    
    # Relationships
    student = relationship("User")
    
    @property
    def period_display(self) -> str:
        """Return formatted period string"""
        start_str = self.period_start.strftime("%B %Y")
        end_str = self.period_end.strftime("%B %Y")
        if start_str == end_str:
            return start_str
        return f"{start_str} - {end_str}"
