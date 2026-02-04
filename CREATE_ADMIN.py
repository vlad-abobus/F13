"""
Скрипт для створення адмін акаунта
"""
import sys
from pathlib import Path

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app import create_app, db
from app.models.user import User
from app.utils.password import hash_password
from config import Config
import uuid

def create_admin():
    """Створити адмін акаунт"""
    app = create_app(Config)
    
    with app.app_context():
        print("=" * 50)
        print("Створення адмін акаунта")
        print("=" * 50)
        
        # Запитати дані
        username = input("Введіть username адміна: ").strip()
        if not username:
            print("❌ Username не може бути порожнім!")
            return
        
        email = input("Введіть email адміна: ").strip()
        if not email:
            print("❌ Email не може бути порожнім!")
            return
        
        password = input("Введіть пароль адміна: ").strip()
        if not password:
            print("❌ Пароль не може бути порожнім!")
            return
        
        confirm_password = input("Підтвердіть пароль: ").strip()
        if password != confirm_password:
            print("❌ Паролі не співпадають!")
            return
        
        # Перевірити чи існує користувач
        existing_user = User.query.filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing_user:
            print(f"⚠️  Користувач з username '{username}' або email '{email}' вже існує!")
            update = input("Оновити до адміна? (y/n): ").strip().lower()
            if update == 'y':
                existing_user.status = 'admin'
                existing_user.password_hash = hash_password(password)
                db.session.commit()
                print(f"✅ Користувач '{username}' оновлено до адміна!")
            else:
                print("❌ Скасовано")
            return
        
        # Створити нового адміна
        admin = User(
            id=str(uuid.uuid4()),
            username=username,
            email=email,
            password_hash=hash_password(password),
            status='admin',
            verification_type='red',  # Red badge for admin
            verification_badge='ADM'
        )
        
        db.session.add(admin)
        db.session.commit()
        
        print("=" * 50)
        print(f"✅ Адмін акаунт '{username}' успішно створено!")
        print(f"   Email: {email}")
        print(f"   Status: admin")
        print(f"   Verification: red badge (ADM)")
        print("=" * 50)

if __name__ == '__main__':
    try:
        create_admin()
    except KeyboardInterrupt:
        print("\n❌ Скасовано користувачем")
    except Exception as e:
        print(f"❌ Помилка: {e}")
        import traceback
        traceback.print_exc()
