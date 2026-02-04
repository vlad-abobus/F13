"""
Скрипт для перевірки наявності всіх необхідних файлів
"""
from pathlib import Path
import sys

# Fix encoding for Windows
if sys.platform == 'win32':
    import io
    # Reopen stdout with UTF-8 encoding
    if hasattr(sys.stdout, 'buffer'):
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def check_files():
    """Перевірка наявності файлів"""
    errors = []
    warnings = []
    
    # Перевірка Ruffle
    ruffle_dir = Path('ruffle')
    if not ruffle_dir.exists():
        errors.append("[ERROR] Папка 'ruffle/' не існує")
    else:
        required_ruffle = ['ruffle.js']
        for file in required_ruffle:
            if not (ruffle_dir / file).exists():
                errors.append(f"[ERROR] Файл 'ruffle/{file}' не існує")
        
        wasm_files = list(ruffle_dir.glob('*.wasm'))
        if not wasm_files:
            warnings.append("[WARNING] Не знайдено .wasm файлів в ruffle/")
        else:
            print(f"[OK] Знайдено {len(wasm_files)} WASM файлів в ruffle/")
    
    # Перевірка ігор
    games_dir = Path('games')
    if not games_dir.exists():
        warnings.append("[WARNING] Папка 'games/' не існує")
    else:
        swf_files = list(games_dir.glob('*.swf'))
        if not swf_files:
            warnings.append("[WARNING] Не знайдено .swf файлів в games/")
        else:
            print(f"[OK] Знайдено {len(swf_files)} ігор: {[f.name for f in swf_files]}")
    
    # Перевірка MikuGPT емоцій
    emotions_dir = Path('MikuGPT_ver_1.0/emotions')
    if not emotions_dir.exists():
        errors.append("[ERROR] Папка 'MikuGPT_ver_1.0/emotions/' не існує")
    else:
        set_a = emotions_dir / 'A'
        set_b = emotions_dir / 'B'
        
        if not set_a.exists():
            errors.append("[ERROR] Папка 'MikuGPT_ver_1.0/emotions/A/' не існує")
        else:
            png_files = list(set_a.glob('*.png'))
            if not png_files:
                warnings.append("[WARNING] Не знайдено PNG файлів в emotions/A/")
            else:
                print(f"[OK] Знайдено {len(png_files)} емоцій в наборі A")
        
        if not set_b.exists():
            errors.append("[ERROR] Папка 'MikuGPT_ver_1.0/emotions/B/' не існує")
        else:
            jpg_files = list(set_b.glob('*.jpg'))
            if not jpg_files:
                warnings.append("[WARNING] Не знайдено JPG файлів в emotions/B/")
            else:
                print(f"[OK] Знайдено {len(jpg_files)} емоцій в наборі B")
    
    # Перевірка логотипу
    logo = Path('logo.png')
    if not logo.exists():
        warnings.append("[WARNING] Файл 'logo.png' не існує")
    else:
        print("[OK] Логотип знайдено")
    
    # Перевірка .env
    env_file = Path('.env')
    if not env_file.exists():
        warnings.append("[WARNING] Файл '.env' не існує (створіть з .env.example)")
    else:
        print("[OK] Файл .env знайдено")
    
    # Виведення результатів
    print("\n" + "="*50)
    if errors:
        print("\nКРИТИЧНІ ПОМИЛКИ:")
        for error in errors:
            print(f"  {error}")
        print("\nПроект не зможе працювати без цих файлів!")
        return False
    
    if warnings:
        print("\nПОПЕРЕДЖЕННЯ:")
        for warning in warnings:
            print(f"  {warning}")
        print("\nДеякі функції можуть не працювати.")
    
    if not errors and not warnings:
        print("\nВсі файли на місці!")
    
    return len(errors) == 0

if __name__ == '__main__':
    try:
        print("Перевірка файлів проекту...\n")
        success = check_files()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"Помилка: {e}")
        sys.exit(1)
