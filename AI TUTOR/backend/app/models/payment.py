from sqlalchemy import String, Float, Enum, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.models.base import Base, BaseModel
import enum


class PaymentStatus(str, enum.Enum):
    created = "created"
    pending = "pending"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"
    cancelled = "cancelled"


class Payment(Base, BaseModel):
    __tablename__ = "payments"
    
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)  # Amount in EUR
    currency: Mapped[str] = mapped_column(String(3), default="EUR")
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.created)
    stripe_session_id: Mapped[str] = mapped_column(String(255), nullable=True)
    stripe_payment_intent_id: Mapped[str] = mapped_column(String(255), nullable=True)
    stripe_charge_id: Mapped[str] = mapped_column(String(255), nullable=True)
    receipt_url: Mapped[str] = mapped_column(String(500), nullable=True)
    refunded_amount: Mapped[float] = mapped_column(Float, default=0.0)
    refunded_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    student = relationship("User")
    lesson = relationship("Lesson", back_populates="payments")
    
    @property
    def is_paid(self) -> bool:
        """Check if payment is completed"""
        return self.status == PaymentStatus.paid
    
    @property
    def is_refunded(self) -> bool:
        """Check if payment is refunded"""
        return self.status == PaymentStatus.refunded or self.refunded_amount > 0
