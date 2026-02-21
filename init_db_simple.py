#!/usr/bin/env python3
"""
Simple database initialization without depending on config.py dotenv loading
"""
import os
import sys
from pathlib import Path

# Read .env manually to avoid dotenv issues
env_path = Path('.env')
if env_path.exists():
    env_content = env_path.read_text(encoding='utf-8', errors='replace')
    for line in env_content.split('\n'):
        line = line.strip()
        if line and not line.startswith('#'):
            if '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()
                print(f"[ENV] {key.strip()}=***" if 'PASSWORD' in key.upper() or 'SECRET' in key.upper() else f"[ENV] {key.strip()}={value.strip()}")

# Now import Flask app
try:
    from app import create_app, db
    from config import Config
    from app.database import init_db

    print("\n[INFO] Creating Flask app...")
    app = create_app(Config)
    
    with app.app_context():
        print("[INFO] Initializing database...")
        print(f"[INFO] Database URI: {app.config.get('SQLALCHEMY_DATABASE_URI', 'NOT SET')}")
        
        init_db()
        print("[OK] Database initialized successfully!")
        
except Exception as e:
    print(f"\n[ERROR] Failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
