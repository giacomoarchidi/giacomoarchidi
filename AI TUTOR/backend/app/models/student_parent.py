from sqlalchemy import Table, Column, Integer, ForeignKey
from app.models.base import Base

# Tabella di associazione many-to-many tra studenti e genitori
student_parent = Table(
    "student_parent",
    Base.metadata,
    Column("student_id", Integer, ForeignKey("student_profiles.id"), primary_key=True),
    Column("parent_id", Integer, ForeignKey("parent_profiles.id"), primary_key=True),
)
