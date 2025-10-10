from .base import Base, BaseModel
from .user import User, Role, StudentProfile, TutorProfile, ParentProfile, StudentParent
from .lesson import Lesson
from .assignment import Assignment, AssignmentSubmission
from .availability import Availability
from .feedback import Feedback
from .payment import Payment
from .report import Report
from .file import File

# Import all models to ensure they are registered with SQLAlchemy
__all__ = [
    "Base",
    "BaseModel", 
    "User",
    "Role",
    "StudentProfile",
    "TutorProfile", 
    "ParentProfile",
    "StudentParent",
    "Lesson",
    "Assignment",
    "Availability",
    "Feedback",
    "Payment",
    "Report",
    "File",
]
