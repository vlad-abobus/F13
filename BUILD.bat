@echo off
echo ========================================
echo Freedom13 - Збірка для Production
echo ========================================
echo.

echo [1/2] Збірка React Frontend...
cd client
call npm run build
if errorlevel 1 (
    echo.
    echo ❌ Помилка збірки фронтенду!
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [2/2] Перевірка структури...
python CHECK_FILES.py

echo.
echo ========================================
echo ✅ Збірка завершена!
echo ========================================
echo.
echo Запустіть: python run.py
echo.
pause
