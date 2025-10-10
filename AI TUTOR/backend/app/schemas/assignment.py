from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, List
from app.models.assignment import AssignmentStatus

class AssignmentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Titolo del compito")
    description: str = Field(..., min_length=1, description="Descrizione del compito")
    instructions: str = Field(..., min_length=1, description="Istruzioni dettagliate per il compito")
    subject: str = Field(..., min_length=1, max_length=100, description="Materia del compito")
    due_date: datetime = Field(..., description="Data e ora di scadenza")
    points: int = Field(100, ge=1, le=1000, description="Punti massimi del compito")
    student_id: int = Field(..., description="ID dello studente")
    is_published: bool = Field(False, description="Se il compito è pubblicato")

    @validator('due_date')
    def validate_due_date(cls, v):
        if v <= datetime.utcnow():
            raise ValueError('La data di scadenza deve essere nel futuro')
        return v

class AssignmentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1)
    instructions: Optional[str] = Field(None, min_length=1)
    subject: Optional[str] = Field(None, min_length=1, max_length=100)
    due_date: Optional[datetime] = None
    points: Optional[int] = Field(None, ge=1, le=1000)
    is_published: Optional[bool] = None

class AssignmentResponse(BaseModel):
    id: int
    title: str
    description: str
    instructions: str
    subject: str
    due_date: datetime
    points: int
    is_published: bool
    created_at: datetime
    updated_at: datetime
    tutor_name: str
    student_name: str
    has_submission: bool = False
    submission_status: Optional[AssignmentStatus] = None
    submission_grade: Optional[int] = None

    class Config:
        from_attributes = True

class AssignmentListResponse(BaseModel):
    assignments: List[AssignmentResponse]
    total: int
    page: int
    per_page: int

class AssignmentSubmissionCreate(BaseModel):
    content: str = Field(..., min_length=1, description="Contenuto della consegna")
    assignment_id: int = Field(..., description="ID del compito")

class AssignmentSubmissionUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1)

class AssignmentSubmissionResponse(BaseModel):
    id: int
    content: str
    status: AssignmentStatus
    grade: Optional[int] = None
    feedback: Optional[str] = None
    submitted_at: Optional[datetime] = None
    graded_at: Optional[datetime] = None
    created_at: datetime
    assignment_title: str
    student_name: str

    class Config:
        from_attributes = True

class AssignmentGrading(BaseModel):
    grade: int = Field(..., ge=0, le=100, description="Voto da 0 a 100")
    feedback: str = Field(..., min_length=1, description="Feedback per lo studente")
