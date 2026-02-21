#!/usr/bin/env python3
"""
Migration script to add missing user columns required by models
Run: python migrations/migrate_add_user_columns.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from sqlalchemy import inspect, text
from config import Config


def migrate_add_user_columns():
    os.environ['SKIP_INIT_DB'] = '1'
    app = create_app(Config)
    with app.app_context():
        inspector = inspect(db.engine)
        existing_tables = inspector.get_table_names()
        if 'users' not in existing_tables:
            print('Users table does not exist; run INIT_DB.py first')
            return False

        users_columns = [col['name'] for col in inspector.get_columns('users')]
        print('Existing user columns:', users_columns)

        columns_to_add = {
            'premium_tag': 'VARCHAR(3)',
            'activity_status': "VARCHAR(3) DEFAULT ''",
            'activity_data': 'VARCHAR(200)',
            'language': "VARCHAR(10) DEFAULT 'ru'",
            'ban_until': 'TIMESTAMP NULL',
            'muted_until': 'TIMESTAMP NULL'
        }

        success = True
        for col_name, col_def in columns_to_add.items():
            if col_name not in users_columns:
                print(f'Adding column: {col_name} {col_def}')
                try:
                    db.session.execute(text(f'ALTER TABLE users ADD COLUMN {col_name} {col_def};'))
                    db.session.commit()
                    print(f'  ✓ {col_name} added')
                except Exception as e:
                    db.session.rollback()
                    print(f'  ✗ Failed to add {col_name}: {e}')
                    success = False
            else:
                print(f'  ✓ {col_name} exists')

        return success


if __name__ == '__main__':
    ok = migrate_add_user_columns()
    sys.exit(0 if ok else 1)
