from typing import Dict, Any, Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Environment, FileSystemLoader
from app.core.config import settings
import os


class EmailService:
    """Email service for sending transactional emails"""
    
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.email_from = settings.EMAIL_FROM
        
        # Setup Jinja2 for email templates
        template_dir = os.path.join(os.path.dirname(__file__), "..", "templates", "email")
        self.jinja_env = Environment(loader=FileSystemLoader(template_dir))
    
    def _send_email(self, to: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
        """Send email via SMTP"""
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.email_from
            msg['To'] = to
            
            if text_content:
                part1 = MIMEText(text_content, 'plain')
                msg.attach(part1)
            
            part2 = MIMEText(html_content, 'html')
            msg.attach(part2)
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False
    
    def _render_template(self, template_name: str, context: Dict[str, Any]) -> str:
        """Render email template with context"""
        try:
            template = self.jinja_env.get_template(template_name)
            return template.render(**context)
        except Exception as e:
            print(f"Failed to render template {template_name}: {e}")
            return f"Error rendering template: {template_name}"
    
    def send_welcome_email(self, to: str, user_name: str, role: str) -> bool:
        """Send welcome email to new user"""
        context = {
            "user_name": user_name,
            "role": role,
            "platform_url": settings.FRONTEND_URL
        }
        
        html_content = self._render_template("welcome.html", context)
        subject = f"Benvenuto su Tutoring Platform - {user_name}"
        
        return self._send_email(to, subject, html_content)
    
    def send_lesson_confirmation(self, to: str, student_name: str, tutor_name: str, 
                               lesson_datetime: str, room_url: str) -> bool:
        """Send lesson confirmation email"""
        context = {
            "student_name": student_name,
            "tutor_name": tutor_name,
            "lesson_datetime": lesson_datetime,
            "room_url": room_url,
            "platform_url": settings.FRONTEND_URL
        }
        
        html_content = self._render_template("lesson_confirmed.html", context)
        subject = f"Lezione confermata - {lesson_datetime}"
        
        return self._send_email(to, subject, html_content)
    
    def send_lesson_reminder(self, to: str, student_name: str, tutor_name: str,
                           lesson_datetime: str, room_url: str, hours_before: int) -> bool:
        """Send lesson reminder email"""
        context = {
            "student_name": student_name,
            "tutor_name": tutor_name,
            "lesson_datetime": lesson_datetime,
            "room_url": room_url,
            "hours_before": hours_before,
            "platform_url": settings.FRONTEND_URL
        }
        
        html_content = self._render_template("lesson_reminder.html", context)
        subject = f"Promemoria lezione tra {hours_before}h - {lesson_datetime}"
        
        return self._send_email(to, subject, html_content)
    
    def send_payment_receipt(self, to: str, student_name: str, amount: float, 
                           currency: str, lesson_datetime: str) -> bool:
        """Send payment receipt email"""
        context = {
            "student_name": student_name,
            "amount": amount,
            "currency": currency,
            "lesson_datetime": lesson_datetime,
            "platform_url": settings.FRONTEND_URL
        }
        
        html_content = self._render_template("payment_receipt.html", context)
        subject = f"Ricevuta pagamento - €{amount:.2f}"
        
        return self._send_email(to, subject, html_content)
    
    def send_report_published(self, to: str, parent_name: str, student_name: str,
                            report_url: str, period: str) -> bool:
        """Send report published notification"""
        context = {
            "parent_name": parent_name,
            "student_name": student_name,
            "report_url": report_url,
            "period": period,
            "platform_url": settings.FRONTEND_URL
        }
        
        html_content = self._render_template("report_published.html", context)
        subject = f"Nuovo report mensile disponibile - {student_name}"
        
        return self._send_email(to, subject, html_content)
    
    def send_assignment_notification(self, to: str, student_name: str, tutor_name: str,
                                   assignment_title: str, due_date: str) -> bool:
        """Send new assignment notification"""
        context = {
            "student_name": student_name,
            "tutor_name": tutor_name,
            "assignment_title": assignment_title,
            "due_date": due_date,
            "platform_url": settings.FRONTEND_URL
        }
        
        html_content = self._render_template("assignment_notification.html", context)
        subject = f"Nuovo compito assegnato - {assignment_title}"
        
        return self._send_email(to, subject, html_content)


# Global email service instance
email_service = EmailService()
