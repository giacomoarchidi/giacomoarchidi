from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Tuple, Optional
from datetime import datetime
from app.models.user import User, Role, StudentProfile
from app.models.lesson import Lesson, LessonStatus
from app.models.payment import Payment, PaymentStatus
from app.models.report import Report

class ParentService:
    def __init__(self, db: Session):
        self.db = db

    def get_stats(self, parent_id: int) -> dict:
        """Get parent dashboard statistics"""
        # Get children of this parent
        children_query = self.db.query(StudentProfile).filter(
            StudentProfile.parent_id == parent_id
        )
        children_ids = [child.user_id for child in children_query.all()]
        
        if not children_ids:
            return {
                "total_children": 0,
                "total_lessons": 0,
                "completed_lessons": 0,
                "pending_payments": 0,
                "total_spent": 0.0
            }

        # Lesson statistics
        total_lessons = self.db.query(Lesson).filter(Lesson.student_id.in_(children_ids)).count()
        completed_lessons = self.db.query(Lesson).filter(
            Lesson.student_id.in_(children_ids),
            Lesson.status == LessonStatus.completed
        ).count()

        # Payment statistics
        payments_query = self.db.query(Payment).filter(Payment.student_id.in_(children_ids))
        pending_payments = payments_query.filter(Payment.status == PaymentStatus.pending).count()
        total_spent = payments_query.filter(Payment.status == PaymentStatus.paid).with_entities(
            func.sum(Payment.amount)
        ).scalar() or 0

        return {
            "total_children": len(children_ids),
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
            "pending_payments": pending_payments,
            "total_spent": float(total_spent)
        }

    def get_children(self, parent_id: int, page: int, size: int) -> Tuple[List[StudentProfile], int]:
        """Get parent's children"""
        query = self.db.query(StudentProfile).filter(StudentProfile.parent_id == parent_id)
        
        total = query.count()
        children = query.order_by(StudentProfile.created_at.desc()).offset((page - 1) * size).limit(size).all()
        
        return children, total

    def get_child(self, parent_id: int, child_id: int) -> Optional[StudentProfile]:
        """Get child details"""
        return self.db.query(StudentProfile).filter(
            StudentProfile.id == child_id,
            StudentProfile.parent_id == parent_id
        ).first()

    def get_child_lessons(self, parent_id: int, child_id: int, page: int, size: int) -> Tuple[List[Lesson], int]:
        """Get child's lessons"""
        # First verify the child belongs to this parent
        child = self.get_child(parent_id, child_id)
        if not child:
            return [], 0

        query = self.db.query(Lesson).filter(Lesson.student_id == child.user_id)
        
        total = query.count()
        lessons = query.order_by(Lesson.start_at.desc()).offset((page - 1) * size).limit(size).all()
        
        return lessons, total

    def get_reports(self, parent_id: int, page: int, size: int) -> Tuple[List[Report], int]:
        """Get reports for parent's children"""
        # Get children of this parent
        children_query = self.db.query(StudentProfile).filter(
            StudentProfile.parent_id == parent_id
        )
        children_ids = [child.user_id for child in children_query.all()]
        
        if not children_ids:
            return [], 0

        query = self.db.query(Report).filter(Report.student_id.in_(children_ids))
        
        total = query.count()
        reports = query.order_by(Report.created_at.desc()).offset((page - 1) * size).limit(size).all()
        
        return reports, total

    def get_report(self, parent_id: int, report_id: int) -> Optional[Report]:
        """Get specific report"""
        # Get children of this parent
        children_query = self.db.query(StudentProfile).filter(
            StudentProfile.parent_id == parent_id
        )
        children_ids = [child.user_id for child in children_query.all()]
        
        if not children_ids:
            return None

        return self.db.query(Report).filter(
            Report.id == report_id,
            Report.student_id.in_(children_ids)
        ).first()
