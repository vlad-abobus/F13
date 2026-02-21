"""
Комплексна перевірка налаштування проекту
"""
import sys
import os
from pathlib import Path

# Fix encoding for Windows
if sys.platform == 'win32':
    import io
    import codecs
    # Reopen stdout with UTF-8 encoding
    if hasattr(sys.stdout, 'buffer'):
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def check_setup():
    """Комплексна перевірка"""
    print("="*60)
    print("F13 - Комплексна Перевірка Налаштування")
    print("="*60)
    print()
    
    all_ok = True
    
    # 1. Перевірка файлів
    print("[1/5] Перевірка файлів...")
    from CHECK_FILES import check_files
    if not check_files():
        all_ok = False
    print()
    
    # 2. Перевірка .env
    print("[2/5] Перевірка .env...")
    env_file = Path('.env')
    if not env_file.exists():
        print("  [WARNING] Файл .env не існує")
        print("  [INFO] Створіть .env з .env.example")
        all_ok = False
    else:
        print("  [OK] Файл .env знайдено")
        
        # Перевірка важливих змінних
        try:
            from dotenv import load_dotenv
            load_dotenv()
            required_vars = ['SECRET_KEY', 'JWT_SECRET_KEY']
            missing_vars = []
            for var in required_vars:
                if not os.environ.get(var):
                    missing_vars.append(var)
            if missing_vars:
                print(f"  [WARNING] Відсутні змінні: {', '.join(missing_vars)}")
            else:
                print("  [OK] Всі важливі змінні налаштовані")
        except ImportError:
            print("  [WARNING] python-dotenv не встановлено")
    print()
    
    # 3. Перевірка Python залежностей
    print("[3/5] Перевірка Python залежностей...")
    try:
        import flask
        import flask_sqlalchemy
        import flask_jwt_extended
        import g4f
        print("  [OK] Основні залежності встановлені")
    except ImportError as e:
        print(f"  [ERROR] Відсутня залежність: {e.name}")
        print("  [INFO] Запустіть: pip install -r requirements.txt")
        all_ok = False
    print()
    
    # 4. Перевірка Node залежностей
    print("[4/5] Перевірка Node залежностей...")
    node_modules = Path('client/node_modules')
    if not node_modules.exists():
        print("  [WARNING] node_modules не знайдено")
        print("  [INFO] Запустіть: cd client && npm install")
        all_ok = False
    else:
        print("  [OK] Node залежності встановлені")
    print()
    
    # 5. Перевірка БД (якщо можливо)
    print("[5/5] Перевірка бази даних...")
    try:
        from app import create_app, db
        from config import Config
        
        app = create_app(Config)
        with app.app_context():
            try:
                db.session.execute(db.text('SELECT 1'))
                print("  [OK] Підключення до БД успішне")
                print(f"  [INFO] БД: {app.config['SQLALCHEMY_DATABASE_URI'].split('@')[-1] if '@' in app.config['SQLALCHEMY_DATABASE_URI'] else 'SQLite'}")
            except Exception as e:
                print(f"  [ERROR] Помилка підключення до БД: {e}")
                all_ok = False
    except Exception as e:
        print(f"  [WARNING] Не вдалося перевірити БД: {e}")
    print()
    
    # Підсумок
    print("="*60)
    if all_ok:
        print("✅ Всі перевірки пройдені успішно!")
        print()
        print("Можете запускати проект:")
        print("  python run.py          # Backend")
        print("  cd client && npm run dev  # Frontend")
        print()
        print("Або використайте: FULL_START.bat")
    else:
        print("⚠️  Виявлені проблеми. Виправте їх перед запуском.")
    print("="*60)
    
    return all_ok

if __name__ == '__main__':
    try:
        success = check_setup()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"Помилка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
