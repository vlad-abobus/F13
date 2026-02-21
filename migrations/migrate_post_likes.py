#!/usr/bin/env python3
"""
Migration script to create post_likes table
Run this script to apply the migration: python migrations/migrate_post_likes.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from sqlalchemy import inspect
from config import Config

def migrate_post_likes():
    """Create post_likes table for toggle like system"""
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
        
        # Check if post_likes table exists
        if 'post_likes' not in existing_tables:
            print("Creating post_likes table...")
            try:
                from app.models.post_like import PostLike
                db.create_all()
                print("✓ post_likes table created successfully")
            except Exception as e:
                print(f"✗ Error creating post_likes table: {e}")
                return False
        else:
            print("✓ post_likes table already exists")
        
        print("\nMigration completed successfully!")
        print("\nNew Features Enabled:")
        print("- Post like toggle system")
        print("- One like per user per post")
        print("- Unique constraint on (post_id, user_id)")
        return True

if __name__ == '__main__':
    success = migrate_post_likes()
    sys.exit(0 if success else 1)
