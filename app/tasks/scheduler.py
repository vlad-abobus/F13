"""
Flask scheduled tasks using APScheduler
"""
try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.cron import CronTrigger
    APSCHEDULER_AVAILABLE = True
except ImportError:
    APSCHEDULER_AVAILABLE = False
    BackgroundScheduler = None
    CronTrigger = None

from app import create_app, db
from config import Config
from app.services.miku_comment_service import miku_comment_service
from app.models.miku_settings import MikuSettings
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

scheduler = None

def run_miku_auto_comment():
    """Run Miku auto-comment task"""
    app = create_app(Config)
    with app.app_context():
        try:
            settings = MikuSettings.get_settings()
            if not settings.is_enabled:
                logger.info("Miku auto-comment is disabled")
                return
            
            count = miku_comment_service.comment_on_own_posts()
            logger.info(f"Miku auto-comment: {count} comments created")
        except Exception as e:
            logger.error(f"Error in Miku auto-comment: {e}")

def init_scheduler():
    """Initialize and start scheduler"""
    if not APSCHEDULER_AVAILABLE:
        logger.warning("APScheduler not available, scheduled tasks disabled")
        return
    
    global scheduler
    scheduler = BackgroundScheduler()
    
    # Run Miku auto-comment every hour (it will check interval internally)
    scheduler.add_job(
        func=run_miku_auto_comment,
        trigger=CronTrigger(hour='*', minute=0),  # Every hour at minute 0
        id='miku_auto_comment',
        name='Miku Auto Comment',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduler started")

def shutdown_scheduler():
    """Shutdown scheduler"""
    global scheduler
    if scheduler:
        scheduler.shutdown()
        logger.info("Scheduler stopped")
