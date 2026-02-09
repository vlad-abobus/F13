#!/usr/bin/env python3
"""
Migration script to add post cooldown tracking fields to users table
Run this script to apply the migration: python migrations/migrate_add_cooldown_tracking.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from sqlalchemy import inspect
from config import Config

def add_cooldown_fields():
    """Add last_post_time and last_comment_time fields to users table"""
    # Prevent app from running full DB initialization during migration
    import os
    os.environ['SKIP_INIT_DB'] = '1'
    app = create_app(Config)
    
    with app.app_context():
        # Get database inspector
        inspector = inspect(db.engine)
        columns = [col['name'] for col in inspector.get_columns('users')]
        
        # Check if columns already exist
        if 'last_post_time' not in columns:
            print("Adding last_post_time column...")
            try:
                with db.engine.begin() as connection:
                    # Check if using SQLite or PostgreSQL
                    if 'sqlite' in str(db.engine.url):
                        # SQLite using ALTER TABLE
                        connection.exec_driver_sql(
                            'ALTER TABLE users ADD COLUMN last_post_time TIMESTAMP'
                        )
                    else:
                        # PostgreSQL
                        connection.exec_driver_sql(
                            'ALTER TABLE users ADD COLUMN last_post_time TIMESTAMP'
                        )
                print("✓ last_post_time column added successfully")
            except Exception as e:
                print(f"✓ last_post_time column already exists or skipped: {e}")
        else:
            print("✓ last_post_time column already exists")
        
        if 'last_comment_time' not in columns:
            print("Adding last_comment_time column...")
            try:
                with db.engine.begin() as connection:
                    # Check if using SQLite or PostgreSQL
                    if 'sqlite' in str(db.engine.url):
                        # SQLite using ALTER TABLE
                        connection.exec_driver_sql(
                            'ALTER TABLE users ADD COLUMN last_comment_time TIMESTAMP'
                        )
                    else:
                        # PostgreSQL
                        connection.exec_driver_sql(
                            'ALTER TABLE users ADD COLUMN last_comment_time TIMESTAMP'
                        )
                print("✓ last_comment_time column added successfully")
            except Exception as e:
                print(f"✓ last_comment_time column already exists or skipped: {e}")
        else:
            print("✓ last_comment_time column already exists")
        
        print("\nMigration completed successfully!")
        print("\nConfiguration:")
        print("- POST_COOLDOWN: 30 seconds (configurable via POST_COOLDOWN env var)")
        print("- COMMENT_COOLDOWN: 10 seconds (configurable via COMMENT_COOLDOWN env var)")
        print("\nExample .env settings:")
        print("POST_COOLDOWN=45")
        print("COMMENT_COOLDOWN=15")

if __name__ == '__main__':
    add_cooldown_fields()
