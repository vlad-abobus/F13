"""
Migration script to add security models and tables
Run: python migrations/migrate_security_models.py
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.security_models import (
    UserSession, TwoFactorCode, TrustedDevice, SecurityLog, RateLimitCounter
)

def migrate_up():
    """Create security tables"""
    app = create_app()
    with app.app_context():
        print("🔒 Creating security tables...")
        db.create_all()
        
        # Check if tables exist
        tables = db.engine.table_names()
        
        created = []
        if 'user_session' in tables:
            created.append('✓ user_session')
        if 'two_factor_code' in tables:
            created.append('✓ two_factor_code')
        if 'trusted_device' in tables:
            created.append('✓ trusted_device')
        if 'security_log' in tables:
            created.append('✓ security_log')
        if 'rate_limit_counter' in tables:
            created.append('✓ rate_limit_counter')
        
        print("📊 Created tables:")
        for table in created:
            print(f"  {table}")
        
        print("\n✅ Security migration completed!")

def migrate_down():
    """Drop security tables"""
    app = create_app()
    with app.app_context():
        print("🔓 Dropping security tables...")
        
        # Drop in reverse order
        db.session.execute('DROP TABLE IF EXISTS rate_limit_counter')
        db.session.execute('DROP TABLE IF EXISTS security_log')
        db.session.execute('DROP TABLE IF EXISTS trusted_device')
        db.session.execute('DROP TABLE IF EXISTS two_factor_code')
        db.session.execute('DROP TABLE IF EXISTS user_session')
        
        db.session.commit()
        print("✅ Tables dropped!")

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'down':
        migrate_down()
    else:
        migrate_up()
