from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional, Dict, Any
import openai
from datetime import datetime, timedelta
import json
import os
import io
from app.core.config import settings
from app.core.celery_app import celery_app
from app.core.storage import storage
from app.models.lesson import Lesson
from app.models.report import Report, ReportStatus
from jinja2 import Environment, FileSystemLoader
# from weasyprint import HTML  # Disabled due to system dependencies


class AIService:
    """AI service for generating lesson notes and reports"""
    
    def __init__(self):
        self.is_enabled = False
        if settings.OPENAI_API_KEY:
            openai.api_key = settings.OPENAI_API_KEY
            self.is_enabled = True
        else:
            # In development, AI is optional
            print("⚠️  OpenAI API key not configured - AI features disabled")
        
        # Setup Jinja2 for PDF templates
        template_dir = os.path.join(os.path.dirname(__file__), "..", "templates")
        self.jinja_env = Environment(loader=FileSystemLoader(template_dir))
    
    def generate_lesson_notes(self, lesson_id: int, db: Session) -> str:
        """Generate AI notes for a completed lesson"""
        if not self.is_enabled:
            return "AI features are disabled. Please configure OpenAI API key."
        
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        if lesson.status.value != "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Lesson must be completed to generate notes"
            )
        
        if not lesson.tutor_notes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tutor notes are required to generate AI notes"
            )
        
        # Prepare context for AI
        context = self._prepare_lesson_context(lesson)
        
        # Generate notes with OpenAI
        notes = self._generate_notes_with_openai(context)
        
        # Save notes to lesson
        lesson.notes_text = notes
        db.commit()
        
        # Generate PDF
        pdf_path = self._generate_lesson_pdf(lesson, notes)
        if pdf_path:
            lesson.notes_pdf_path = pdf_path
            db.commit()
        
        return notes
    
    def _prepare_lesson_context(self, lesson: Lesson) -> Dict[str, Any]:
        """Prepare context for AI note generation"""
        return {
            "subject": lesson.subject,
            "tutor_notes": lesson.tutor_notes,
            "objectives": lesson.objectives,
            "duration_minutes": lesson.duration_minutes,
            "student_name": f"{lesson.student.student_profile.first_name} {lesson.student.student_profile.last_name}" if lesson.student.student_profile else "Studente",
            "tutor_name": f"{lesson.tutor.tutor_profile.first_name} {lesson.tutor.tutor_profile.last_name}" if lesson.tutor.tutor_profile else "Tutor",
            "date": lesson.start_at.strftime("%d/%m/%Y"),
            "school_level": lesson.student.student_profile.school_level if lesson.student.student_profile else None
        }
    
    def _generate_notes_with_openai(self, context: Dict[str, Any]) -> str:
        """Generate lesson notes using OpenAI"""
        prompt = f"""
Sei un tutor esperto. Genera appunti chiari e ben formattati (in italiano) della lezione appena svolta.

Richiedi:
- Breve introduzione (1-2 frasi)
- "Punti chiave" (elenco puntato)
- "Esercizi/Compiti" (se presenti)
- "Suggerimenti per lo studio"

Contesto:
- Materia: {context['subject']}
- Livello: {context['school_level'] or 'Non specificato'}
- Obiettivi: {context['objectives'] or 'Non specificati'}
- Note del tutor: {context['tutor_notes']}
- Durata: {context['duration_minutes']} minuti
- Data: {context['date']}

IMPORTANTE: Non inventare contenuti. Usa solo le informazioni fornite. Se mancano dettagli, ometti la sezione corrispondente.
"""
        
        try:
            response = openai.ChatCompletion.create(
                model=settings.OPENAI_MODEL or "gpt-4",
                messages=[
                    {"role": "system", "content": "Sei un tutor esperto che genera appunti chiari e strutturati per studenti."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"OpenAI API error: {str(e)}"
            )
    
    def _generate_lesson_pdf(self, lesson: Lesson, notes: str) -> Optional[str]:
        """Generate PDF for lesson notes"""
        try:
            template = self.jinja_env.get_template("lesson_notes.html")
            
            context = {
                "student_name": f"{lesson.student.student_profile.first_name} {lesson.student.student_profile.last_name}" if lesson.student.student_profile else "Studente",
                "tutor_name": f"{lesson.tutor.tutor_profile.first_name} {lesson.tutor.tutor_profile.last_name}" if lesson.tutor.tutor_profile else "Tutor",
                "subject": lesson.subject,
                "date": lesson.start_at.strftime("%d/%m/%Y"),
                "notes_html": notes.replace("\n", "<br>")
            }
            
            html_content = template.render(**context)
            
            # Generate PDF - Temporarily disabled due to weasyprint dependencies
            # pdf_bytes = HTML(string=html_content).write_pdf()
            pdf_bytes = html_content.encode('utf-8')  # Return HTML as bytes for now
            
            # Save to storage
            filename = f"lesson_notes_{lesson.id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
            pdf_path = storage.upload_file(
                file_data=io.BytesIO(pdf_bytes),
                filename=filename,
                content_type="application/pdf"
            )
            
            return pdf_path
            
        except Exception as e:
            print(f"Failed to generate lesson PDF: {e}")
            return None
    
    def generate_monthly_report(self, context: dict) -> str:
        """Generate monthly report text using AI"""
        if not self.is_enabled:
            return "Report mensile - AI features disabled. Please configure OpenAI API key."
        
        try:
            lessons_summary = "\n".join([
                f"- {lesson['subject']} ({lesson['date']}): {lesson['tutor_notes'] or 'Nessuna nota specifica'}"
                for lesson in context['lessons']
            ])
            
            prompt = f"""
            Genera un report mensile per {context['student_name']} per il mese di {context['month']}/{context['year']}.
            
            Lezioni completate ({context['total_lessons']}):
            {lessons_summary}
            
            Il report deve includere:
            1. Un riepilogo generale del progresso
            2. Punti di forza evidenziati
            3. Aree di miglioramento
            4. Raccomandazioni per il prossimo mese
            
            Scrivi in italiano, in modo professionale ma comprensibile per i genitori.
            """
            
            response = openai.ChatCompletion.create(
                model=settings.OPENAI_MODEL or "gpt-4",
                messages=[
                    {"role": "system", "content": "Sei un tutor esperto che scrive report mensili per genitori. Scrivi in modo professionale e costruttivo."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"Error generating monthly report: {e}")
            return f"Report mensile per {context['student_name']} - {context['month']}/{context['year']}\n\n{context['total_lessons']} lezioni completate questo mese."
    
    def render_pdf(self, html_content: str) -> bytes:
        """Render HTML to PDF - Currently disabled due to system dependencies"""
        # TODO: Install system dependencies for WeasyPrint or use alternative
        # return HTML(string=html_content).write_pdf()
        return html_content.encode('utf-8')  # Return HTML as bytes for now


# Celery tasks
@celery_app.task
def generate_lesson_notes_task(lesson_id: int):
    """Celery task to generate lesson notes"""
    from app.core.db import SessionLocal
    from app.services.ai import AIService
    
    db = SessionLocal()
    try:
        ai_service = AIService()
        notes = ai_service.generate_lesson_notes(lesson_id, db)
        return {"status": "success", "lesson_id": lesson_id, "notes_length": len(notes)}
    except Exception as e:
            return {"status": "error", "lesson_id": lesson_id, "error": str(e)}
    finally:
        db.close()


# Global instance for use in other services
ai_service = AIService()