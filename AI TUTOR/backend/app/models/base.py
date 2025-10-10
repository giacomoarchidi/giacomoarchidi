from sqlalchemy import Integer, DateTime
from sqlalchemy.orm import DeclarativeBase, mapped_column
from datetime import datetime


class Base(DeclarativeBase):
    """Base class for all database models"""
    pass


class BaseModel:
    """Mixin class with common fields"""
    
    id = mapped_column(Integer, primary_key=True, index=True)
    created_at = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
