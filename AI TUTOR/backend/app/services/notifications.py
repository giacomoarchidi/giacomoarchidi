from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.emailer import email_service
from app.core.celery_app import celery_app
from app.models.lesson import Lesson, LessonStatus
from app.models.user import User

class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def send_lesson_reminder(self, lesson_id: int):
        """Send lesson reminder to student and tutor"""
        lesson = self.db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            return {"status": "error", "message": "Lesson not found"}

        # Check if lesson is in the next 24 hours
        time_until_lesson = lesson.start_at - datetime.utcnow()
        if time_until_lesson > timedelta(hours=24) or time_until_lesson < timedelta(hours=0):
            return {"status": "skipped", "message": "Lesson not within reminder window"}

        # Send reminder to student
        student_email = lesson.student.email
        student_name = f"{lesson.student.first_name} {lesson.student.last_name}"
        
        email_service.send_lesson_reminder(
            to_email=student_email,
            student_name=student_name,
            tutor_name=f"{lesson.tutor.first_name} {lesson.tutor.last_name}",
            subject=lesson.subject,
            start_time=lesson.start_at.strftime("%d/%m/%Y alle %H:%M"),
            room_url=f"https://meet.jit.si/{lesson.room_slug}" if lesson.room_slug else None
        )

        # Send reminder to tutor
        tutor_email = lesson.tutor.email
        tutor_name = f"{lesson.tutor.first_name} {lesson.tutor.last_name}"
        
        email_service.send_lesson_reminder(
            to_email=tutor_email,
            student_name=student_name,
            tutor_name=tutor_name,
            subject=lesson.subject,
            start_time=lesson.start_at.strftime("%d/%m/%Y alle %H:%M"),
            room_url=f"https://meet.jit.si/{lesson.room_slug}" if lesson.room_slug else None
        )

        return {"status": "success", "message": "Reminders sent"}

    def send_lesson_confirmation(self, lesson_id: int):
        """Send lesson confirmation after payment"""
        lesson = self.db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            return {"status": "error", "message": "Lesson not found"}

        # Send confirmation to student
        student_email = lesson.student.email
        student_name = f"{lesson.student.first_name} {lesson.student.last_name}"
        
        email_service.send_lesson_confirmation(
            to_email=student_email,
            student_name=student_name,
            tutor_name=f"{lesson.tutor.first_name} {lesson.tutor.last_name}",
            subject=lesson.subject,
            start_time=lesson.start_at.strftime("%d/%m/%Y alle %H:%M"),
            room_url=f"https://meet.jit.si/{lesson.room_slug}" if lesson.room_slug else None,
            price=lesson.price
        )

        # Send confirmation to tutor
        tutor_email = lesson.tutor.email
        tutor_name = f"{lesson.tutor.first_name} {lesson.tutor.last_name}"
        
        email_service.send_lesson_confirmation(
            to_email=tutor_email,
            student_name=student_name,
            tutor_name=tutor_name,
            subject=lesson.subject,
            start_time=lesson.start_at.strftime("%d/%m/%Y alle %H:%M"),
            room_url=f"https://meet.jit.si/{lesson.room_slug}" if lesson.room_slug else None,
            price=lesson.price
        )

        return {"status": "success", "message": "Confirmations sent"}

    def send_report_notification(self, report_id: int):
        """Send notification when monthly report is ready"""
        from app.models.report import Report
        from app.services.parent import ParentService
        
        report = self.db.query(Report).filter(Report.id == report_id).first()
        if not report:
            return {"status": "error", "message": "Report not found"}

        # Get student's parents
        parent_service = ParentService(self.db)
        parents = self.db.query(User).join(User.student_profile).filter(
            User.student_profile.has(parent_id__isnot=None)
        ).all()

        for parent in parents:
            if parent.student_profile and parent.student_profile.user_id == report.student_id:
                email_service.send_report_notification(
                    to_email=parent.email,
                    parent_name=f"{parent.first_name} {parent.last_name}",
                    student_name=f"{report.student.first_name} {report.student.last_name}",
                    report_period=f"{report.period_start} - {report.period_end}",
                    report_url=f"https://tutoring-platform.com/parent/reports/{report.id}"
                )

        return {"status": "success", "message": "Report notifications sent"}

# Celery tasks
@celery_app.task(name="app.services.notifications.send_lesson_reminders")
def send_lesson_reminders_task():
    """Send reminders for lessons starting in the next 24 hours"""
    from app.core.db import SessionLocal
    
    db = SessionLocal()
    try:
        notification_service = NotificationService(db)
        
        # Get lessons starting in the next 24 hours
        now = datetime.utcnow()
        tomorrow = now + timedelta(hours=24)
        
        lessons = db.query(Lesson).filter(
            Lesson.status == LessonStatus.confirmed,
            Lesson.start_at >= now,
            Lesson.start_at <= tomorrow
        ).all()
        
        sent_count = 0
        for lesson in lessons:
            result = notification_service.send_lesson_reminder(lesson.id)
            if result["status"] == "success":
                sent_count += 1
        
        return {"status": "success", "reminders_sent": sent_count, "total_lessons": len(lessons)}
        
    except Exception as e:
        return {"status": "error", "error": str(e)}
    finally:
        db.close()