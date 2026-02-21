#!/usr/bin/env python3
"""
Migration script to add premium_tag column to users table
Run this script to apply the migration: python migrations/migrate_premium_tag.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, String, Column, create_engine, text
from config import Config

def migrate_premium_tag():
    """Add premium_tag column to users table"""
    try:
        # Create engine directly without full app initialization
        engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)
        
        inspector = inspect(engine)
        users_table = inspector.get_columns('users')
        column_names = [col['name'] for col in users_table]
        
        if 'premium_tag' not in column_names:
            print("Adding premium_tag column to users table...")
            with engine.begin() as conn:
                conn.execute(text('ALTER TABLE users ADD COLUMN premium_tag VARCHAR(3) NULL'))
            print("✓ premium_tag column added successfully")
        else:
            print("✓ premium_tag column already exists")
        
        print("\nMigration completed successfully!")
        print("\nNew Features Enabled:")
        print("- Premium tag system (3 unique letters per user)")
        print("- Premium status management in admin panel")
        return True
    except Exception as e:
        print(f"✗ Error during migration: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = migrate_premium_tag()
    sys.exit(0 if success else 1)
