from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.payment import PaymentStatus

class PaymentCreate(BaseModel):
    student_id: int
    lesson_id: int
    amount: float
    currency: str = "EUR"

class PaymentUpdate(BaseModel):
    status: Optional[PaymentStatus] = None
    stripe_session_id: Optional[str] = None
    stripe_payment_intent_id: Optional[str] = None
    stripe_charge_id: Optional[str] = None
    receipt_url: Optional[str] = None
    refunded_amount: Optional[float] = None
    refunded_at: Optional[datetime] = None

class PaymentResponse(BaseModel):
    id: int
    student_id: int
    lesson_id: int
    amount: float
    currency: str
    status: PaymentStatus
    stripe_session_id: Optional[str] = None
    stripe_payment_intent_id: Optional[str] = None
    stripe_charge_id: Optional[str] = None
    receipt_url: Optional[str] = None
    refunded_amount: float
    refunded_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class PaymentRefund(BaseModel):
    reason: Optional[str] = None

