#!/usr/bin/env python3
"""
Migration script to create comment_likes table
Run this script to apply the migration: python migrations/migrate_comment_likes.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from sqlalchemy import inspect
from config import Config

def migrate_comment_likes():
    """Create comment_likes table for toggle like system"""
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
        
        # Check if comment_likes table exists
        if 'comment_likes' not in existing_tables:
            print("Creating comment_likes table...")
            try:
                from app.models.comment_like import CommentLike
                db.create_all()
                print("✓ comment_likes table created successfully")
            except Exception as e:
                print(f"✗ Error creating comment_likes table: {e}")
                return False
        else:
            print("✓ comment_likes table already exists")
        
        print("\nMigration completed successfully!")
        print("\nNew Features Enabled:")
        print("- Comment like toggle system")
        print("- One like per user per comment")
        print("- Unique constraint on (comment_id, user_id)")
        return True

if __name__ == '__main__':
    success = migrate_comment_likes()
    sys.exit(0 if success else 1)
