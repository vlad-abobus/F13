#!/usr/bin/env python3
"""
Migration script to add missing columns (ban_until, muted_until) to users table
Run this script to apply the migration: python migrations/migrate_missing_columns.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from sqlalchemy import inspect, text
from config import Config

def migrate_missing_columns():
    """Add missing columns to users table"""
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
            
            print("Adding missing columns to users table...")
            
            # Columns to add
            columns_to_add = {
                'ban_until': "TIMESTAMP NULL",
                'muted_until': "TIMESTAMP NULL"
            }
            
            for col_name, col_type in columns_to_add.items():
                if col_name not in users_columns:
                    print(f"  Adding column: {col_name}")
                    try:
                        # Use raw SQL to add column
                        query = f"ALTER TABLE users ADD COLUMN {col_name} {col_type};"
                        db.session.execute(text(query))
                        db.session.commit()
                        print(f"  ✓ Column {col_name} added successfully")
                    except Exception as e:
                        db.session.rollback()
                        print(f"  ✗ Error adding {col_name}: {e}")
                        return False
                else:
                    print(f"  ✓ Column {col_name} already exists")
            
            print("\nMigration completed successfully!")
            return True
            
        except Exception as e:
            print(f"Migration failed: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == '__main__':
    success = migrate_missing_columns()
    sys.exit(0 if success else 1)
