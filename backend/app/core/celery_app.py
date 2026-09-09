from celery import Celery
from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "medikiosk",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.services.ocr_worker",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,
    task_soft_time_limit=240,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=50,
    result_expires=3600,
    task_routes={
        "app.services.ocr_worker.process_document": {"queue": "ocr"},
        "app.services.ocr_worker.extract_clinical_entities": {"queue": "ocr"},
    },
    beat_schedule={},
)

celery_app.autodiscover_tasks()


@celery_app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f"Request: {self.request!r}")