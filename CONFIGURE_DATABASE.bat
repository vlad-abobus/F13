@echo off
REM Помощь с конфигурацией БД для Freedom13

echo.
echo ========================================
echo Freedom13 - Database Configuration Help
echo ========================================
echo.

echo [1] SQLite (Local Development - Recommended for testing)
echo   - No installation needed
echo   - Just leave DATABASE_URL empty in .env
echo   - Perfect for local development and testing
echo.

echo [2] PostgreSQL (Production)
echo   - Need to install PostgreSQL
echo   - Configure connection in .env
echo.

echo.
echo Which option do you want?
echo.
echo 1 - Use SQLite (fast setup)
echo 2 - Configure PostgreSQL
echo 3 - Exit
echo.

REM Read user input
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo [INFO] Configuring for SQLite...
    echo.
    echo Edit your .env file and ensure:
    echo   DATABASE_URL= (leave empty)
    echo   DB_PASSWORD= (leave empty)
    echo.
    echo Then run: FULL_START.bat
    echo.
    pause
    exit /b 0
)

if "%choice%"=="2" (
    echo.
    echo [INFO] PostgreSQL Configuration...
    echo.
    echo 1. Install PostgreSQL from https://www.postgresql.org/download/
    echo.
    echo 2. Create a database:
    echo    createdb freedom13
    echo.
    echo 3. Edit .env file with your PostgreSQL credentials:
    echo    DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/freedom13
    echo.
    echo    OR use separate variables:
    echo    DB_USER=postgres
    echo    DB_PASSWORD=yourpassword
    echo    DB_HOST=localhost
    echo    DB_PORT=5432
    echo    DB_NAME=freedom13
    echo.
    echo 4. Then run: FULL_START.bat
    echo.
    echo [IMPORTANT] If your password contains special characters, use URL encoding:
    echo   @ = %40
    echo   : = %3A
    echo   / = %2F
    echo.
    pause
    exit /b 0
)

if "%choice%"=="3" (
    exit /b 0
)

echo [ERROR] Invalid choice!
pause
exit /b 1
