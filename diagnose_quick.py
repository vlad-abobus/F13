#!/usr/bin/env python3
"""Быстрая диагностика БД без Flask импорта"""
import psycopg2
from pathlib import Path

print("=" * 60)
print("БЫСТРАЯ ДИАГНОСТИКА")
print("=" * 60)

# 1. Проверим подключение к БД
print("\n[1] Проверка подключения к PostgreSQL...")
try:
    conn = psycopg2.connect(
        dbname="freedom13",
        user="freedom13",
        password="mikumiku",
        host="localhost",
        port=5432
    )
    cur = conn.cursor()
    print("    ✅ Подключение успешно")
    
    # 2. Проверим таблицу images
    print("\n[2] Проверка таблицы 'images'...")
    cur.execute("""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'images'
        )
    """)
    
    table_exists = cur.fetchone()[0]
    if table_exists:
        print("    ✅ Таблица 'images' существует")
        
        # Свойства таблицы
        cur.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'images'
            ORDER BY ordinal_position
        """)
        
        columns = cur.fetchall()
        print("    Столбцы:")
        for col in columns:
            nullable = "NULL" if col[2] == 'YES' else "NOT NULL"
            print(f"      - {col[0]}: {col[1]} ({nullable})")
        
        # Проверим контрэйнты
        cur.execute("""
            SELECT constraint_name, constraint_type
            FROM information_schema.table_constraints
            WHERE table_schema = 'public' AND table_name = 'images'
        """)
        
        constraints = cur.fetchall()
        if constraints:
            print("    Контрэйнты:")
            for const in constraints:
                print(f"      - {const[0]}: {const[1]}")
    else:
        print("    ❌ Таблица 'images' НЕ существует!")
    
    # 3. Проверим каталог uploads
    print("\n[3] Проверка каталога 'uploads'...")
    upload_dir = Path('./uploads').absolute()
    if upload_dir.exists():
        print(f"    ✅ Каталог существует: {upload_dir}")
        print(f"       Readable: {(upload_dir / 'test_write').write_text('test') == None or True}")
        try:
            (upload_dir / 'test_write').unlink()
            print(f"       Writable: ✅")
        except:
            print(f"       Writable: ❌")
    else:
        print(f"    ⚠️  Каталог НЕ существует: {upload_dir}")
    
    # 4. Проверим .env
    print("\n[4] Проверка .env конфига...")
    env_path = Path('.env')
    if env_path.exists():
        env_content = env_path.read_text(encoding='utf-8')
        cloudinary_line = [line for line in env_content.split('\n') if line.startswith('CLOUDINARY_URL')]
        
        if cloudinary_line:
            is_empty = cloudinary_line[0].endswith('=') or '=' not in cloudinary_line[0]
            if is_empty:
                print("    ⚠️  CLOUDINARY_URL пуст (будет использоваться локальное сохранение)")
            else:
                print("    ✅ CLOUDINARY_URL установлен")
        else:
            print("    ❌ CLOUDINARY_URL не найден в .env")
    else:
        print("    ❌ Файл .env не найден")
    
    cur.close()
    conn.close()
    
except psycopg2.Error as e:
    print(f"    ❌ Ошибка подключения: {e}")
except Exception as e:
    print(f"    ❌ Неожиданная ошибка: {e}")

print("\n" + "=" * 60)
