from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Tuple, Optional
from datetime import datetime, timedelta
from app.models.user import User, Role
from app.models.lesson import Lesson, LessonStatus
from app.models.payment import Payment, PaymentStatus

class AdminService:
    def __init__(self, db: Session):
        self.db = db

    def get_stats(self) -> dict:
        """Get admin dashboard statistics"""
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        # User statistics
        total_users = self.db.query(User).count()
        total_students = self.db.query(User).filter(User.role == Role.student).count()
        total_tutors = self.db.query(User).filter(User.role == Role.tutor).count()
        total_parents = self.db.query(User).filter(User.role == Role.parent).count()

        # Lesson statistics
        total_lessons = self.db.query(Lesson).count()
        active_lessons_today = self.db.query(Lesson).filter(
            Lesson.status == LessonStatus.confirmed,
            Lesson.start_at >= today_start,
            Lesson.start_at < today_end
        ).count()

        # Payment statistics
        total_revenue = self.db.query(func.sum(Payment.amount)).filter(
            Payment.status == PaymentStatus.paid
        ).scalar() or 0

        # Pending verifications (tutors not verified)
        pending_verifications = self.db.query(User).filter(
            User.role == Role.tutor,
            User.is_active == True
        ).count()  # This would need a verification field in real implementation

        return {
            "total_users": total_users,
            "total_students": total_students,
            "total_tutors": total_tutors,
            "total_parents": total_parents,
            "total_lessons": total_lessons,
            "total_revenue": float(total_revenue),
            "pending_verifications": pending_verifications,
            "active_lessons_today": active_lessons_today
        }

    def get_users(self, page: int, size: int, role: Optional[str] = None) -> Tuple[List[User], int]:
        """Get users with pagination and optional role filter"""
        query = self.db.query(User)
        
        if role:
            try:
                role_enum = Role(role)
                query = query.filter(User.role == role_enum)
            except ValueError:
                # Invalid role, return empty results
                return [], 0

        total = query.count()
        users = query.order_by(desc(User.created_at)).offset((page - 1) * size).limit(size).all()
        
        return users, total

    def get_user(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()

    def update_user_status(self, user_id: int, is_active: bool) -> Optional[User]:
        """Update user active status"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_active = is_active
            self.db.commit()
            self.db.refresh(user)
        return user

    def get_lessons(self, page: int, size: int, status: Optional[str] = None) -> Tuple[List[Lesson], int]:
        """Get lessons with pagination and optional status filter"""
        query = self.db.query(Lesson)
        
        if status:
            try:
                status_enum = LessonStatus(status)
                query = query.filter(Lesson.status == status_enum)
            except ValueError:
                # Invalid status, return empty results
                return [], 0

        total = query.count()
        lessons = query.order_by(desc(Lesson.created_at)).offset((page - 1) * size).limit(size).all()
        
        return lessons, total

    def get_lesson(self, lesson_id: int) -> Optional[Lesson]:
        """Get lesson by ID"""
        return self.db.query(Lesson).filter(Lesson.id == lesson_id).first()

    def get_payments(self, page: int, size: int, status: Optional[str] = None) -> Tuple[List[Payment], int]:
        """Get payments with pagination and optional status filter"""
        query = self.db.query(Payment)
        
        if status:
            try:
                status_enum = PaymentStatus(status)
                query = query.filter(Payment.status == status_enum)
            except ValueError:
                # Invalid status, return empty results
                return [], 0

        total = query.count()
        payments = query.order_by(desc(Payment.created_at)).offset((page - 1) * size).limit(size).all()
        
        return payments, total

    def refund_payment(self, payment_id: int, reason: Optional[str] = None) -> dict:
        """Refund a payment"""
        payment = self.db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            raise ValueError("Payment not found")
        
        if payment.status != PaymentStatus.paid:
            raise ValueError("Payment is not in paid status")
        
        # Update payment status to refunded
        payment.status = PaymentStatus.refunded
        self.db.commit()
        
        # Here you would integrate with Stripe to actually process the refund
        # For now, we just update the database status
        
        return {"message": "Payment refunded successfully"}
