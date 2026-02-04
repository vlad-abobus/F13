"""
Скрипт для ініціалізації бази даних
"""
from app import create_app, db
from config import Config
from app.database import init_db

if __name__ == '__main__':
    app = create_app(Config)
    with app.app_context():
        print("[INFO] Initializing database...")
        init_db()
        print("[OK] Database initialized successfully!")
        print(f"[INFO] Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
