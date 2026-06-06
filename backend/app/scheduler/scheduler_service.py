from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.executors.pool import ThreadPoolExecutor
import logging

logger = logging.getLogger(__name__)


class SchedulerService:
    _scheduler = None

    def init_app(self, app):
        db_url = app.config["SQLALCHEMY_DATABASE_URI"]
        jobstores  = {"default": SQLAlchemyJobStore(url=db_url, tablename="apscheduler_jobs")}
        executors  = {"default": ThreadPoolExecutor(max_workers=4)}
        job_defaults = {"coalesce": True, "max_instances": 1, "misfire_grace_time": 300}
        self._scheduler = BackgroundScheduler(
            jobstores=jobstores, executors=executors,
            job_defaults=job_defaults, timezone="UTC",
        )
        self._scheduler.start()
        logger.info("Scheduler started")

    def schedule_once(self, func, run_at: datetime, job_id: str, **kwargs):
        if not self._scheduler:
            return
        self._scheduler.add_job(
            func, trigger="date", run_date=run_at,
            id=job_id, replace_existing=True, kwargs=kwargs,
        )
        logger.info(f"Scheduled job '{job_id}' at {run_at}")

    def cancel_job(self, job_id: str):
        if not self._scheduler:
            return
        try:
            self._scheduler.remove_job(job_id)
        except Exception:
            pass

    def shutdown(self):
        if self._scheduler and self._scheduler.running:
            self._scheduler.shutdown(wait=False)

    def schedule_reminder(self, event):
        if not event.reminder_time or not event.reminder_email:
            return

        def _send_reminder(event_id):
            from app import create_app
            _app = create_app()
            with _app.app_context():
                from app.repositories import EventRepository
                from app.email import email_service as es
                repo = EventRepository()
                ev = repo.get_by_id(event_id)
                if ev and not ev.reminder_sent:
                    es.send_event_reminder(ev.reminder_email, ev, ev.reminder_offset_minutes or 0)
                    repo.mark_reminder_sent(event_id)

        self.schedule_once(
            _send_reminder,
            run_at=event.reminder_time,
            job_id=f"reminder_{event.id}",
            event_id=event.id,
        )
