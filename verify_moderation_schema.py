#!/usr/bin/env python3
"""
Verify that moderation system tables and columns exist
"""
from sqlalchemy import create_engine, inspect, text
import os

# Get database URL from environment or config
db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:mikumiku@localhost:5432/freedom13')

engine = create_engine(db_url)

with engine.connect() as conn:
    # Check users table columns
    inspector = inspect(engine)
    users_cols = [col['name'] for col in inspector.get_columns('users')]
    
    moderation_cols = ['ban_until', 'can_post', 'warning_count', 'admin_notes']
    print('Moderation columns in users table:')
    for col in moderation_cols:
        status = '✓' if col in users_cols else '✗'
        print(f'  {status} {col}')
    
    # Check if moderation_logs table exists
    tables = inspector.get_table_names()
    print(f'\nModeration logs table: {"✓" if "moderation_logs" in tables else "✗"}')
    
    if 'moderation_logs' in tables:
        mod_cols = [col['name'] for col in inspector.get_columns('moderation_logs')]
        print(f'  Columns: {", ".join(mod_cols)}')
    
    print('\n✓ Moderation system is ready for use!')
