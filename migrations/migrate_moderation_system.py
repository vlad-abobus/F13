#!/usr/bin/env python3
"""
Migration script to add moderation system to users table and create moderation logs table
Run this script to apply the migration: python migrations/migrate_moderation_system.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from sqlalchemy import inspect, text
from config import Config

def migrate_moderation_system():
    """Add moderation columns to users table and create moderation_logs table"""
    # Prevent app from running full DB initialization during migration
    os.environ['SKIP_INIT_DB'] = '1'
    app = create_app(Config)
    
    with app.app_context():
        try:
            # Get database inspector
            inspector = inspect(db.engine)
            existing_tables = inspector.get_table_names()
            
            # Get existing columns in users table
            users_columns = [col['name'] for col in inspector.get_columns('users')] if 'users' in existing_tables else []
            
            print("Adding moderation system to database...")
            print("\n[1/2] Updating users table...")
            
            # Add missing columns to users table
            columns_to_add = {
                'ban_until': "TIMESTAMP NULL",
                'can_post': "BOOLEAN DEFAULT TRUE",
                'warning_count': "INTEGER DEFAULT 0",
                'admin_notes': "TEXT NULL"
            }
            
            for col_name, col_type in columns_to_add.items():
                if col_name not in users_columns:
                    print(f"  Adding column: {col_name}")
                    try:
                        # Use raw SQL to add column
                        query = f"ALTER TABLE users ADD COLUMN {col_name} {col_type};"
                        db.session.execute(text(query))
                        db.session.commit()
                        print(f"  ✓ Column {col_name} added")
                    except Exception as e:
                        print(f"  ✗ Error adding {col_name}: {e}")
                        db.session.rollback()
                else:
                    print(f"  ✓ Column {col_name} already exists")
            
            print("\n[2/2] Creating moderation_logs table...")
            
            # Create moderation_logs table if it doesn't exist
            if 'moderation_logs' not in existing_tables:
                try:
                    from app.models.moderation_log import ModerationLog
                    # Create the table using SQLAlchemy model
                    db.create_all()
                    print("  ✓ moderation_logs table created successfully")
                except Exception as e:
                    print(f"  ✗ Error creating moderation_logs table: {e}")
                    return False
            else:
                print("  ✓ moderation_logs table already exists")
            
            print("\n" + "="*60)
            print("Migration completed successfully!")
            print("="*60)
            print("\nNew Features Enabled:")
            print("- Temporary bans with automatic expiration (ban_until)")
            print("- Post restriction capability (can_post)")
            print("- Warning/infraction system (warning_count)")
            print("- Admin notes for case management (admin_notes)")
            print("- Complete audit trail (moderation_logs table)")
            print("\nModeration endpoints now available:")
            print("- POST /admin/users/<user_id>/warn")
            print("- POST /admin/users/<user_id>/kick")
            print("- POST /admin/users/<user_id>/restrict-posting")
            print("- POST /admin/users/<user_id>/allow-posting")
            print("- POST /admin/users/<user_id>/notes")
            print("- GET /admin/users/<user_id>/history")
            print("- GET /admin/moderation-log")
            print("- POST /admin/posts/<post_id>/delete")
            return True
            
        except Exception as e:
            print(f"✗ Migration failed: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == '__main__':
    success = migrate_moderation_system()
    sys.exit(0 if success else 1)
