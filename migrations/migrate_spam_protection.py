#!/usr/bin/env python3
"""
Migration script to create IP spam logging table
Run this script to apply the migration: python migrations/migrate_spam_protection.py
"""
import sys
import os
import hashlib
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from sqlalchemy import inspect
from config import Config

def migrate_spam_protection():
    """Create spam protection related tables"""
    # Prevent app from running full DB initialization during migration
    import os
    os.environ['SKIP_INIT_DB'] = '1'
    app = create_app(Config)
    
    with app.app_context():
        # Get database inspector
        inspector = inspect(db.engine)
        # SQLAlchemy inspector provides get_table_names() for table listing
        try:
            existing_tables = inspector.get_table_names()
        except Exception:
            # Fallback for different inspector implementations
            existing_tables = []
        
        # Check if ip_spam_logs table exists
        if 'ip_spam_logs' not in existing_tables:
            print("Creating ip_spam_logs table...")
            try:
                from app.models.ip_spam_log import IPSpamLog
                db.create_all()
                print("✓ ip_spam_logs table created successfully")
            except Exception as e:
                print(f"✗ Error creating ip_spam_logs table: {e}")
                return False
        else:
            print("✓ ip_spam_logs table already exists")
        
        print("\nMigration completed successfully!")
        print("\nNew Features Enabled:")
        print("- IP-based spam tracking and logging")
        print("- Content duplication detection")
        print("- Spam keyword filtering")
        print("- URL limiting on posts and comments")
        print("- CAPTCHA on report submissions")
        print("- Automatic moderation flagging for suspicious content")
        return True

if __name__ == '__main__':
    success = migrate_spam_protection()
    sys.exit(0 if success else 1)
