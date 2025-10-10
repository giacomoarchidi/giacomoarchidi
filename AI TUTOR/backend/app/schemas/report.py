from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.report import ReportStatus


class ReportResponse(BaseModel):
    id: int
    student_id: int
    title: str
    content: str
    status: ReportStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReportListResponse(BaseModel):
    reports: List[ReportResponse]
    total: int
    page: int
    size: int


class ReportCreate(BaseModel):
    student_id: int
    title: str
    content: str


class ReportUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[ReportStatus] = None
