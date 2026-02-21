#!/usr/bin/env python3
"""Диагностика проблемы загрузки файлов"""
import os
import sys
from pathlib import Path

# Загрузить конфиг
os.environ.setdefault('FLASK_ENV', 'development')

from app import create_app, db
from config import Config
from app.models.image import Image

app = create_app(Config)

with app.app_context():
    print("=" * 60)
    print("ДИАГНОСТИКА ЗАГРУЗКИ ФАЙЛОВ")
    print("=" * 60)
    
    # 1. Проверим таблицу в БД
    print("\n[1] Проверка таблицы 'images' в БД...")
    try:
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        
        if 'images' in tables:
            print("    ✅ Таблица 'images' существует")
            
            # Проверим столбцы
            columns = inspector.get_columns('images')
            print("    Столбцы таблицы:")
            for col in columns:
                print(f"      - {col['name']}: {col['type']} (nullable={col['nullable']})")
        else:
            print("    ❌ Таблица 'images' НЕ существует!")
            print(f"    Существующие таблицы: {tables}")
    except Exception as e:
        print(f"    ❌ Ошибка при проверке таблицы: {e}")
    
    # 2. Проверим config
    print("\n[2] Проверка конфига...")
    print(f"    UPLOAD_DIR: {app.config.get('UPLOAD_DIR')}")
    print(f"    MAX_FILE_SIZE: {app.config.get('MAX_FILE_SIZE')} bytes ({app.config.get('MAX_FILE_SIZE', 0) / 1024 / 1024:.1f}MB)")
    print(f"    ALLOWED_EXTENSIONS: {app.config.get('ALLOWED_EXTENSIONS')}")
    
    cloudinary_url = app.config.get('CLOUDINARY_URL')
    cloud_name = app.config.get('CLOUDINARY_CLOUD_NAME')
    api_key = app.config.get('CLOUDINARY_API_KEY')
    api_secret = app.config.get('CLOUDINARY_API_SECRET')
    
    print(f"    CLOUDINARY_URL: {'✅ SET' if cloudinary_url else '❌ NOT SET'}")
    print(f"    CLOUDINARY_CLOUD_NAME: {'✅ SET' if cloud_name else '❌ NOT SET'}")
    print(f"    CLOUDINARY_API_KEY: {'✅ SET' if api_key else '❌ NOT SET'}")
    print(f"    CLOUDINARY_API_SECRET: {'✅ SET' if api_secret else '❌ NOT SET'}")
    
    # 3. Проверим UPLOAD_DIR
    print("\n[3] Проверка каталога загрузок...")
    upload_dir = Path(app.config.get('UPLOAD_DIR', './uploads'))
    if upload_dir.exists():
        print(f"    ✅ Каталог существует: {upload_dir.absolute()}")
        print(f"       Статус: readable={os.access(upload_dir, os.R_OK)}, writable={os.access(upload_dir, os.W_OK)}")
    else:
        print(f"    ⚠️  Каталог НЕ существует: {upload_dir.absolute()}")
        print(f"       Попытка создать...")
        try:
            upload_dir.mkdir(parents=True, exist_ok=True)
            print(f"       ✅ Создана успешно")
        except Exception as e:
            print(f"       ❌ Ошибка создания: {e}")
    
    # 4. Попытка вставить тестовый Image
    print("\n[4] Тест записи в БД (Image)...")
    try:
        from datetime import datetime
        test_image = Image(
            url='http://test.example.com/test.jpg',
            public_id=f'test_public_id_{int(datetime.utcnow().timestamp())}'
        )
        db.session.add(test_image)
        db.session.commit()
        print(f"    ✅ Успешно создана запись: Image(id={test_image.id})")
        
        # Удалим тестовую запись
        db.session.delete(test_image)
        db.session.commit()
        print(f"    ✅ Тестовая запись удалена")
        
    except Exception as e:
        db.session.rollback()
        print(f"    ❌ Ошибка при работе с БД: {e}")
    
    print("\n" + "=" * 60)
    print("ДИАГНОСТИКА ЗАВЕРШЕНА")
    print("=" * 60)
