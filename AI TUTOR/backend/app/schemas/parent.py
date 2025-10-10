from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ParentStatsResponse(BaseModel):
    total_children: int
    total_lessons: int
    completed_lessons: int
    pending_payments: int
    total_spent: float

class ChildResponse(BaseModel):
    id: int
    user_id: int
    first_name: str
    last_name: str
    school_level: Optional[str] = None
    email: str
    is_active: bool
    created_at: datetime

class ChildrenResponse(BaseModel):
    data: List[ChildResponse]
    total: int
    page: int
    size: int

# Import existing schemas for responses
from app.schemas.lesson import LessonResponse
from app.schemas.report import ReportResponse

class ChildLessonsResponse(BaseModel):
    data: List[LessonResponse]
    total: int
    page: int
    size: int

class ReportsResponse(BaseModel):
    data: List[ReportResponse]
    total: int
    page: int
    size: int
