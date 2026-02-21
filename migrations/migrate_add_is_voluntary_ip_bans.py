#!/usr/bin/env python3
"""
Migration script to add `is_voluntary` column to `ip_bans` table.
Run: python migrations/migrate_add_is_voluntary_ip_bans.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from sqlalchemy import inspect, text
from config import Config


def migrate_add_column():
    os.environ['SKIP_INIT_DB'] = '1'
    app = create_app(Config)
    with app.app_context():
        try:
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            if 'ip_bans' not in tables:
                print('Table ip_bans does not exist, aborting')
                return False

            cols = [c['name'] for c in inspector.get_columns('ip_bans')]
            if 'is_voluntary' in cols:
                print('Column is_voluntary already exists')
                return True

            print('Adding column is_voluntary to ip_bans...')
            # Use SQL that works on Postgres/MySQL/SQLite (SQLite accepts ALTER TABLE ADD COLUMN)
            try:
                query = 'ALTER TABLE ip_bans ADD COLUMN is_voluntary BOOLEAN DEFAULT 0 NOT NULL;'
                db.session.execute(text(query))
                db.session.commit()
                print('Column added')
            except Exception as e:
                db.session.rollback()
                # Fallback for SQLite where BOOLEAN may be INTEGER 0/1
                try:
                    query = 'ALTER TABLE ip_bans ADD COLUMN is_voluntary INTEGER DEFAULT 0 NOT NULL;'
                    db.session.execute(text(query))
                    db.session.commit()
                    print('Column added with INTEGER fallback')
                except Exception as e2:
                    db.session.rollback()
                    print('Failed to add column:', e2)
                    return False

            return True
        except Exception as e:
            import traceback
            traceback.print_exc()
            return False


if __name__ == '__main__':
    ok = migrate_add_column()
    sys.exit(0 if ok else 1)
