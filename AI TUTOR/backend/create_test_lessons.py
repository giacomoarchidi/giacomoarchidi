"""
Script per creare lezioni di test nel database
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.db import SessionLocal
from app.models.lesson import Lesson, LessonStatus
from app.models.user import User, Role

def create_test_lessons():
    db = SessionLocal()
    
    try:
        # Trova un tutor
        tutor = db.query(User).filter(User.role == Role.tutor).first()
        if not tutor:
            print("❌ Nessun tutor trovato nel database")
            return
        
        print(f"✅ Trovato tutor: {tutor.email} (ID: {tutor.id})")
        
        # Trova uno studente
        student = db.query(User).filter(User.role == Role.student).first()
        if not student:
            print("❌ Nessuno studente trovato nel database")
            return
        
        print(f"✅ Trovato studente: {student.email} (ID: {student.id})")
        
        # Crea lezioni di test
        today = datetime.now()
        lessons_data = [
            # Lezioni di oggi
            {
                "subject": "Matematica",
                "start_at": today.replace(hour=10, minute=0, second=0, microsecond=0),
                "duration_minutes": 60,
                "status": LessonStatus.confirmed,
                "price": 25.0
            },
            {
                "subject": "Fisica",
                "start_at": today.replace(hour=14, minute=0, second=0, microsecond=0),
                "duration_minutes": 90,
                "status": LessonStatus.confirmed,
                "price": 35.0
            },
            {
                "subject": "Chimica",
                "start_at": today.replace(hour=16, minute=30, second=0, microsecond=0),
                "duration_minutes": 60,
                "status": LessonStatus.confirmed,
                "price": 25.0
            },
            # Lezioni domani
            {
                "subject": "Italiano",
                "start_at": (today + timedelta(days=1)).replace(hour=9, minute=0, second=0, microsecond=0),
                "duration_minutes": 60,
                "status": LessonStatus.confirmed,
                "price": 25.0
            },
            {
                "subject": "Inglese",
                "start_at": (today + timedelta(days=1)).replace(hour=15, minute=0, second=0, microsecond=0),
                "duration_minutes": 60,
                "status": LessonStatus.confirmed,
                "price": 25.0
            },
            # Lezioni questa settimana
            {
                "subject": "Storia",
                "start_at": (today + timedelta(days=2)).replace(hour=10, minute=0, second=0, microsecond=0),
                "duration_minutes": 60,
                "status": LessonStatus.confirmed,
                "price": 25.0
            },
            {
                "subject": "Geografia",
                "start_at": (today + timedelta(days=3)).replace(hour=11, minute=0, second=0, microsecond=0),
                "duration_minutes": 60,
                "status": LessonStatus.confirmed,
                "price": 25.0
            },
            {
                "subject": "Filosofia",
                "start_at": (today + timedelta(days=4)).replace(hour=14, minute=0, second=0, microsecond=0),
                "duration_minutes": 90,
                "status": LessonStatus.confirmed,
                "price": 35.0
            },
            # Lezioni passate
            {
                "subject": "Matematica",
                "start_at": (today - timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0),
                "duration_minutes": 60,
                "status": LessonStatus.completed,
                "price": 25.0
            },
            {
                "subject": "Fisica",
                "start_at": (today - timedelta(days=2)).replace(hour=15, minute=0, second=0, microsecond=0),
                "duration_minutes": 60,
                "status": LessonStatus.completed,
                "price": 25.0
            },
        ]
        
        created_count = 0
        for lesson_data in lessons_data:
            end_at = lesson_data["start_at"] + timedelta(minutes=lesson_data["duration_minutes"])
            
            lesson = Lesson(
                tutor_id=tutor.id,
                student_id=student.id,
                subject=lesson_data["subject"],
                start_at=lesson_data["start_at"],
                end_at=end_at,
                status=lesson_data["status"],
                price=lesson_data["price"]
            )
            
            db.add(lesson)
            created_count += 1
            print(f"✅ Creata lezione: {lesson_data['subject']} - {lesson_data['start_at'].strftime('%Y-%m-%d %H:%M')}")
        
        db.commit()
        print(f"\n🎉 Totale lezioni create: {created_count}")
        
        # Conta lezioni per categoria
        today_start = today.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        week_end = today_start + timedelta(days=7)
        
        today_count = sum(1 for l in lessons_data if today_start <= l["start_at"] < today_end)
        week_count = sum(1 for l in lessons_data if today_start <= l["start_at"] < week_end)
        
        print(f"\n📊 Statistiche:")
        print(f"  • Lezioni oggi: {today_count}")
        print(f"  • Lezioni questa settimana: {week_count}")
        print(f"  • Lezioni completate: {sum(1 for l in lessons_data if l['status'] == LessonStatus.completed)}")
        
    except Exception as e:
        print(f"❌ Errore: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Creazione lezioni di test...")
    create_test_lessons()
