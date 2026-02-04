@echo off
echo ========================================
echo Freedom13 - Повний Запуск
echo ========================================
echo.

echo.
echo [1/6] Перевірка файлів...
echo [1/5] Перевірка файлів...
python CHECK_FILES.py
if errorlevel 1 (
    echo.
    echo [ERROR] Помилка перевірки файлів!
    pause
    exit /b 1
)

echo.
echo [2/5] Встановлення Python залежностей...
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo [WARNING] Деякі залежності не встановилися!
    echo [INFO] Перевірте помилки вище. Проект може працювати без опціональних залежностей.
    echo.
)

echo.
echo [3/5] Встановлення Node залежностей...
cd client
call npm install
if errorlevel 1 (
    echo.
    echo [ERROR] Помилка встановлення Node залежностей!
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [4/5] Ініціалізація бази даних...
python INIT_DB.py
if errorlevel 1 (
    echo.
    echo [ERROR] Помилка ініціалізації БД!
    pause
    exit /b 1
)

echo.
echo [5/5] Запуск сервісів...
start "Flask Backend" cmd /k "python run.py"

timeout /t 3 /nobreak >nul
cd client
start "React Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo [OK] Проект запущено!
echo ========================================
echo.
echo Backend:  http://127.0.0.1:5000
echo Frontend: http://localhost:3000
echo.
echo Натисніть будь-яку клавішу для виходу...
pause >nul
