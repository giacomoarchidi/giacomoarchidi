from celery import Celery
from app.core.config import settings

# Create Celery app
celery_app = Celery(
    "tutoring_platform",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.services.ai",
        "app.services.notifications",
        "app.services.reports"
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Europe/Rome",
    enable_utc=True,
    result_expires=3600,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    "send-lesson-reminders": {
        "task": "app.services.notifications.send_lesson_reminders",
        "schedule": 60.0 * 60,  # Every hour
    },
    "generate-monthly-reports": {
        "task": "app.services.reports.generate_monthly_reports",
        "schedule": 60.0 * 60 * 24,  # Daily (will check if it's the 1st of month)
    },
    "cleanup-expired-files": {
        "task": "app.services.storage.cleanup_expired_files",
        "schedule": 60.0 * 60 * 24,  # Daily
    },
}

# Optional: Configure task routes for different workers
celery_app.conf.task_routes = {
    "app.services.ai.*": {"queue": "ai_queue"},
    "app.services.reports.*": {"queue": "reports_queue"},
    "app.services.notifications.*": {"queue": "notifications_queue"},
}
