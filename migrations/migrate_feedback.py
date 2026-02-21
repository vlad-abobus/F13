#!/usr/bin/env python3
"""
Migration script to create feedback table
Run this script to apply the migration: python migrations/migrate_feedback.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from sqlalchemy import inspect
from config import Config

def migrate_feedback():
    """Create feedback table for bug reports and feature suggestions"""
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
        
        # Check if feedback table exists
        if 'feedback' not in existing_tables:
            print("Creating feedback table...")
            try:
                from app.models.feedback import Feedback
                db.create_all()
                print("✓ feedback table created successfully")
            except Exception as e:
                print(f"✗ Error creating feedback table: {e}")
                return False
        else:
            print("✓ feedback table already exists")
        
        print("\nMigration completed successfully!")
        print("\nNew Features Enabled:")
        print("- Bug report submission")
        print("- Feature suggestion submission")
        print("- No authentication required")
        print("- Optional email for follow-up")
        return True

if __name__ == '__main__':
    success = migrate_feedback()
    sys.exit(0 if success else 1)
