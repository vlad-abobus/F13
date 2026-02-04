"""
Scheduled task for Miku to auto-comment on her posts
Run this once per day (e.g., via cron or scheduler)
"""
from app import create_app, db
from config import Config
from app.services.miku_comment_service import miku_comment_service

def run_miku_auto_comment():
    """Run Miku auto-comment task"""
    app = create_app(Config)
    with app.app_context():
        try:
            count = miku_comment_service.comment_on_own_posts()
            print(f"✅ Miku commented on {count} posts")
            print(f"📅 Personality for today: {miku_comment_service.get_personality_for_today()}")
            return count
        except Exception as e:
            print(f"❌ Error: {e}")
            return 0

if __name__ == '__main__':
    run_miku_auto_comment()
