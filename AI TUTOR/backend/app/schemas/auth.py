from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from app.models.user import Role


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=72)
    role: Role = Role.student
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    school_level: Optional[str] = None  # For students
    bio: Optional[str] = None  # For tutors
    subjects: Optional[str] = None  # For tutors
    hourly_rate: Optional[float] = None  # For tutors
    phone: Optional[str] = None  # For parents
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[Role] = None


class UserResponse(BaseModel):
    id: int
    email: str
    role: Role
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserProfile(BaseModel):
    id: int
    email: str
    role: Role
    first_name: str
    last_name: str
    school_level: Optional[str] = None
    bio: Optional[str] = None
    subjects: Optional[str] = None
    hourly_rate: Optional[float] = None
    phone: Optional[str] = None
    is_verified: Optional[bool] = None
    
    class Config:
        from_attributes = True


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=100)
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v
