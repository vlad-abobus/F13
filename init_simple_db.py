#!/usr/bin/env python3
"""
Minimal database initialization without loading all routes/services
"""
import os
import sys
from pathlib import Path
import warnings

# Suppress flask_limiter warning
warnings.filterwarnings("ignore", category=UserWarning)

# Read .env file manually
env_path = Path('.env')
if env_path.exists():
    for line in env_path.read_text(encoding='utf-8').split('\n'):
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            os.environ[key.strip()] = value.strip()

print("[INFO] Initializing database...")

try:
    from flask import Flask
    from flask_sqlalchemy import SQLAlchemy
    
    # Create minimal Flask app
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://freedom13:mikumiku@localhost:5432/freedom13')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize SQLAlchemy
    db = SQLAlchemy(app)
    
    # Import all models
    from app.models import *
    
    with app.app_context():
        print(f"[INFO] Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
        
        # Create all tables
        db.create_all()
        print("[OK] Database schema created successfully!")
        
except Exception as e:
    print(f"[ERROR] Database initialization failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
