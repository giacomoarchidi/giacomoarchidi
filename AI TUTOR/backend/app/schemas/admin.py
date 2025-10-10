from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AdminStatsResponse(BaseModel):
    total_users: int
    total_students: int
    total_tutors: int
    total_parents: int
    total_lessons: int
    total_revenue: float
    pending_verifications: int
    active_lessons_today: int

class UserUpdateStatus(BaseModel):
    is_active: bool

class PaymentRefund(BaseModel):
    reason: Optional[str] = None

# Import existing schemas for responses
from app.schemas.auth import UserResponse
from app.schemas.lesson import LessonResponse
from app.schemas.payment import PaymentResponse

class UserListResponse(BaseModel):
    data: List[UserResponse]
    total: int
    page: int
    size: int

class LessonListResponse(BaseModel):
    data: List[LessonResponse]
    total: int
    page: int
    size: int

class PaymentListResponse(BaseModel):
    data: List[PaymentResponse]
    total: int
    page: int
    size: int
