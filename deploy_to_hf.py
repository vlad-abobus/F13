#!/usr/bin/env python3
"""
Скрипт для завантаження всіх файлів з папки на Hugging Face Space
Використовує huggingface_hub для API запитів (без git)
"""
import os
import sys
from pathlib import Path

try:
    from huggingface_hub import HfApi
except ImportError:
    print("ERROR: huggingface_hub не встановлено")
    print("Встановіть: pip install huggingface-hub")
    sys.exit(1)


def deploy_to_hf_space():
    """Завантажить всі файли з папки F13 на HF Space"""
    
    # Параметри Space
    SPACE_ID = "VladislavMorgan/freedom13"
    SOURCE_DIR = Path("c:\\Users\\vladi\\Documents\\GitHub\\F13")
    HF_TOKEN = os.environ.get('HF_TOKEN')
    
    if not HF_TOKEN:
        print("ERROR: Змінна середовища HF_TOKEN не встановлена")
        print("Виконайте: $env:HF_TOKEN='your_token_here'")
        sys.exit(1)
    
    if not SOURCE_DIR.exists():
        print(f"ERROR: Папка не знайдена: {SOURCE_DIR}")
        sys.exit(1)
    
    # Список папок/файлів, що ПРОПУСКАЄМО
    SKIP_PATTERNS = {
        '.git', '__pycache__', '.pytest_cache', 'node_modules',
        '.env', '.env.local', '.venv', 'venv',
        '*.pyc', '*.pyo', '.DS_Store',
        'client/dist',  # Вже збудований фронтенд
        'uploads',  # Користувацькі файли
        '.cursor', '.vscode',  # IDE файли
    }
    
    # Ініціалізуйте API
    api = HfApi(token=HF_TOKEN)
    
    print(f"🚀 Завантаження всіх файлів з {SOURCE_DIR} на {SPACE_ID}...")
    print(f"Token: {HF_TOKEN[:10]}...")
    print()
    
    # Зберіть список файлів для завантаження
    files_to_upload = []
    
    for local_file in SOURCE_DIR.rglob('*'):
        if not local_file.is_file():
            continue
        
        # Перевірьте, чи потрібно пропустити файл
        skip = False
        for pattern in SKIP_PATTERNS:
            if pattern in str(local_file):
                skip = True
                break
        
        if skip:
            continue
        
        # Обчисліть шлях відносно SOURCE_DIR
        relative_path = local_file.relative_to(SOURCE_DIR)
        files_to_upload.append((local_file, str(relative_path)))
    
    print(f"📋 Знайдено {len(files_to_upload)} файлів для завантаження\n")
    
    uploaded_count = 0
    failed_count = 0
    
    # Upload with size check and retries
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
    import time

    for local_file, relative_path in sorted(files_to_upload):
        try:
            file_size = local_file.stat().st_size
        except Exception:
            file_size = 0

        path_in_repo = relative_path.replace("\\", "/")

        if file_size > MAX_FILE_SIZE:
            print(f"⏭️ Пропускаю {path_in_repo} (розмір {file_size/1024/1024:.1f} MB) — занадто великий для API upload.")
            failed_count += 1
            continue

        success = False
        attempts = 0
        while not success and attempts < 3:
            attempts += 1
            try:
                print(f"📤 {path_in_repo} (attempt {attempts})...", end=" ", flush=True)
                api.upload_file(
                    path_or_fileobj=str(local_file),
                    path_in_repo=path_in_repo,
                    repo_id=SPACE_ID,
                    repo_type="space",
                    commit_message=f"Deploy: Add {relative_path}",
                )
                print("✅")
                uploaded_count += 1
                success = True
            except Exception as e:
                err_text = str(e)
                print(f"❌ {type(e).__name__}: {err_text[:120]}")
                if attempts < 3:
                    backoff = 2 ** attempts
                    print(f"   → Повтор через {backoff}s...")
                    time.sleep(backoff)
                else:
                    failed_count += 1
                    print("   → Не вдалось завантажити після кількох спроб.")
    
    print(f"\n{'='*60}")
    print(f"✨ Завантаження завершено!")
    print(f"   ✅ Успішно: {uploaded_count}")
    print(f"   ❌ Помилок: {failed_count}")
    print(f"{'='*60}")
    print(f"\n🔗 Перевірте Space: https://huggingface.co/spaces/{SPACE_ID}")
    print("   Space повинен перестартувати за кілька хвилин.")
    
    return failed_count == 0


if __name__ == '__main__':
    success = deploy_to_hf_space()
    sys.exit(0 if success else 1)
