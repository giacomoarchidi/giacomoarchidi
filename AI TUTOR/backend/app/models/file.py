from sqlalchemy import String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.models.base import Base, BaseModel


class File(Base, BaseModel):
    __tablename__ = "files"
    
    owner_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_path: Mapped[str] = mapped_column(String(500), nullable=False)  # Path in storage
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)  # Size in bytes
    is_public: Mapped[bool] = mapped_column(default=False)  # Can be accessed without auth
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)  # For temporary files
    
    # Relationships
    owner = relationship("User", back_populates="files")
    
    @property
    def file_size_display(self) -> str:
        """Return human-readable file size"""
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"
    
    @property
    def is_expired(self) -> bool:
        """Check if file has expired"""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at
