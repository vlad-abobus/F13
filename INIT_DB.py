"""
Скрипт для ініціалізації бази даних
"""
import os
import sys
from pathlib import Path

# PostgreSQL configuration (required)
db_url = os.environ.get('DATABASE_URL', '').strip()
db_user = os.environ.get('DB_USER', 'postgres').strip()
db_password = os.environ.get('DB_PASSWORD', 'postgres').strip()  # Default: postgres
db_host = os.environ.get('DB_HOST', 'localhost').strip()
db_port = os.environ.get('DB_PORT', '5432').strip()
db_name = os.environ.get('DB_NAME', 'freedom13').strip()

# Verify PostgreSQL configuration
if not db_url and not db_password:
    from urllib.parse import quote
    db_password = quote('postgres', safe='')
    db_url = f'postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'
    os.environ['DATABASE_URL'] = db_url

from app import create_app, db
from config import Config
from app.database import init_db

if __name__ == '__main__':
    try:
        app = create_app(Config)
        with app.app_context():
            print("[INFO] Initializing database...")
            print(f"[INFO] Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
            
            init_db()
            print("[OK] Database initialized successfully!")
            
    except Exception as e:
        # Improve error messaging for encoding issues in environment files
        print(f"\n[ERROR] Database initialization failed: {e}")
        if isinstance(e, UnicodeDecodeError):
            print("[ERROR] Detected UnicodeDecodeError while reading configuration. Attempting to repair .env encoding (cp1251 -> utf-8)...")
            try:
                env_path = Path(__file__).parent / '.env'
                if env_path.exists():
                    raw = env_path.read_bytes()
                    try:
                        text = raw.decode('utf-8')
                    except UnicodeDecodeError:
                        text = raw.decode('cp1251')
                    env_path.write_text(text, encoding='utf-8')
                    print('[INFO] Rewrote .env as UTF-8. Retry INIT_DB.py')
                else:
                    print('[INFO] .env not present; nothing to repair')
            except Exception as repair_err:
                print(f'[WARNING] Failed to repair .env: {repair_err}')
            sys.exit(1)
        print("\n[⚠️  POSTGRESQL CONFIGURATION ERROR]")
        print("\nPostgreSQL is required. Please configure in .env:")
        print("\nOption 1: Single DATABASE_URL line:")
        print("  DATABASE_URL=postgresql://user:password@host:port/dbname")
        print("\nOption 2: Individual variables (all required):")
        print("  DB_USER=postgres")
        print("  DB_PASSWORD=yourpassword")
        print("  DB_HOST=localhost")
        print("  DB_PORT=5432")
        print("  DB_NAME=freedom13")
        print("\n[HELP] Start PostgreSQL service and try again.")
        sys.exit(1)
