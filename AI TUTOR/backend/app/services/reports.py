from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.models.user import User, StudentProfile
from app.models.lesson import Lesson, LessonStatus
from app.models.report import Report, ReportStatus
from app.services.ai import ai_service
from app.core.storage import storage
from jinja2 import Environment, FileSystemLoader
import os
from app.core.celery_app import celery_app

class ReportService:
    def __init__(self, db: Session):
        self.db = db

    def generate_monthly_report(self, student_id: int, month: int, year: int) -> Report:
        """Generate monthly report for a student"""
        # Check if report already exists
        existing_report = self.db.query(Report).filter(
            Report.student_id == student_id,
            Report.period_start == f"{year}-{month:02d}-01",
            Report.period_end == f"{year}-{month:02d}-31"
        ).first()

        if existing_report:
            return existing_report

        # Create new report
        report = Report(
            student_id=student_id,
            period_start=f"{year}-{month:02d}-01",
            period_end=f"{year}-{month:02d}-31",
            title=f"Report Mensile - {month:02d}/{year}",
            status=ReportStatus.generating
        )
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)

        # Get lessons for the period
        lessons = self.db.query(Lesson).filter(
            Lesson.student_id == student_id,
            Lesson.status == LessonStatus.completed,
            Lesson.start_at >= f"{year}-{month:02d}-01",
            Lesson.start_at <= f"{year}-{month:02d}-31"
        ).all()

        report.lessons_count = len(lessons)
        self.db.commit()

        if lessons:
            # Generate AI summary
            lessons_summary = []
            for lesson in lessons:
                lessons_summary.append({
                    "subject": lesson.subject,
                    "date": lesson.start_at.strftime("%d/%m/%Y"),
                    "tutor_notes": lesson.tutor_notes,
                    "objectives": lesson.objectives
                })

            # Use AI to generate report text
            context = {
                "student_name": f"{lessons[0].student.first_name} {lessons[0].student.last_name}",
                "month": month,
                "year": year,
                "lessons": lessons_summary,
                "total_lessons": len(lessons)
            }

            report_text = ai_service.generate_monthly_report(context)
            report.text = report_text

            # Generate PDF
            pdf_content = self._generate_report_pdf(report, lessons)
            if pdf_content:
                # Upload PDF to storage
                pdf_filename = f"reports/monthly_report_{student_id}_{year}_{month:02d}.pdf"
                storage.upload_file(pdf_filename, pdf_content, "application/pdf")
                report.pdf_path = pdf_filename

            report.status = ReportStatus.published
        else:
            report.text = "Nessuna lezione completata in questo periodo."
            report.status = ReportStatus.published

        self.db.commit()
        return report

    def _generate_report_pdf(self, report: Report, lessons: List[Lesson]) -> Optional[bytes]:
        """Generate PDF for monthly report"""
        try:
            # Load template
            env = Environment(loader=FileSystemLoader('templates'))
            template = env.get_template('monthly_report.html')

            # Prepare data for template
            student = lessons[0].student if lessons else None
            template_data = {
                "report": report,
                "student_name": f"{student.first_name} {student.last_name}" if student else "Studente",
                "lessons": lessons,
                "month": report.period_start.split('-')[1],
                "year": report.period_start.split('-')[0]
            }

            # Render HTML
            html_content = template.render(**template_data)

            # Generate PDF
            pdf_content = ai_service.render_pdf(html_content)
            return pdf_content

        except Exception as e:
            print(f"Error generating report PDF: {e}")
            return None

    def get_student_reports(self, student_id: int, limit: int = 10) -> List[Report]:
        """Get reports for a student"""
        return self.db.query(Report).filter(
            Report.student_id == student_id,
            Report.status == ReportStatus.published
        ).order_by(Report.created_at.desc()).limit(limit).all()

    def get_pending_reports(self) -> List[Report]:
        """Get reports that are still generating"""
        return self.db.query(Report).filter(
            Report.status == ReportStatus.generating
        ).all()

    def mark_report_failed(self, report_id: int, error_message: str):
        """Mark a report as failed"""
        report = self.db.query(Report).filter(Report.id == report_id).first()
        if report:
            report.status = ReportStatus.failed
            report.text = f"Errore nella generazione: {error_message}"
            self.db.commit()

    def generate_all_monthly_reports(self, year: int, month: int):
        """Generate monthly reports for all active students"""
        # Get all active students
        students = self.db.query(StudentProfile).join(User).filter(
            User.is_active == True
        ).all()

        for student in students:
            try:
                self.generate_monthly_report(student.user_id, month, year)
            except Exception as e:
                print(f"Error generating report for student {student.user_id}: {e}")
                continue

# Celery task for generating monthly reports
@celery_app.task(name="app.services.reports.generate_monthly_reports")
def generate_monthly_reports_task():
    """Celery task to generate monthly reports for all students"""
    from app.core.db import SessionLocal
    from datetime import datetime
    
    db = SessionLocal()
    try:
        report_service = ReportService(db)
        
        # Get current month and year
        now = datetime.now()
        month = now.month
        year = now.year
        
        # Only run on the 1st of the month
        if now.day == 1:
            report_service.generate_all_monthly_reports(year, month)
            return {"status": "success", "month": month, "year": year}
        else:
            return {"status": "skipped", "reason": "Not first day of month"}
            
    except Exception as e:
        return {"status": "error", "error": str(e)}
    finally:
        db.close()