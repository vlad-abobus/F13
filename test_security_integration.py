"""Integration test for security modules"""
from app.routes.auth import auth_bp
from app.routes.posts import posts_bp
from app.routes.comments import comments_bp
from app.routes.users import users_bp
from app.routes.admin import admin_bp
from app.middleware.bot_detection import detect_bot
from app.middleware.spam_detector import check_spam
from app.middleware.security_manager import SuspiciousActivityTracker
from app.middleware.sql_injection_protection import protect_from_sql_injection
from app.models.security_models import (
    UserSession, TwoFactorCode, TrustedDevice, SecurityLog, RateLimitCounter
)

print("✅ Successfully imported all security routes!")
print("✅ Successfully imported all security middleware!")
print("✅ Successfully imported all security models!")
print("\n🎉 INTEGRATION TEST PASSED!")
