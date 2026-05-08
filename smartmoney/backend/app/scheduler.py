from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from .services.signal_ranker import build_signals
import logging

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler(timezone="Asia/Kolkata")


def start_scheduler():
    scheduler.add_job(
        build_signals,
        CronTrigger(day_of_week="mon-fri", hour=9, minute=20),
        id="morning_fetch",
        replace_existing=True,
    )
    scheduler.add_job(
        build_signals,
        CronTrigger(day_of_week="mon-fri", hour=15, minute=35),
        id="closing_fetch",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started — fetches at 9:20 AM and 3:35 PM IST on weekdays")
