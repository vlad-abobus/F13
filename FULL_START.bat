@echo off
echo ========================================
echo Freedom13 - Full Startup
echo ========================================
echo.

echo [1/6] Checking PostgreSQL Configuration...
if not exist ".env" (
    echo [INFO] Creating .env with defaults...
    (
        echo # Freedom13 environment file
        echo # Edit these values before running the app
        echo.
        echo # Application
        echo SECRET_KEY=freedom13-secret-key-change-in-production
        echo JWT_SECRET_KEY=freedom13-jwt-secret-key-change-in-production
        echo FLASK_ENV=development
        echo.
        echo # PostgreSQL (required^)
        echo DATABASE_URL=postgresql://freedom13:mikumiku@localhost:5432/freedom13
        echo DB_USER=freedom13
        echo DB_PASSWORD=mikumiku
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=freedom13
        echo.
        echo # Redis (optional^)
        echo REDIS_URL=redis://localhost:6379
        echo.
        echo # Cloudinary (optional^)
        echo CLOUDINARY_URL=
    ) > .env
    echo [OK] .env created!
    echo.
    echo [IMPORTANT] PostgreSQL is REQUIRED:
    echo   - Must be running on localhost:5432
    echo   - Database: freedom13
    echo   - User: freedom13 / Password: mikumiku
    echo.
    pause
) else (
    echo [OK] .env already exists
)

echo.
echo [2/6] Installing system dependencies...
choco install redis-64 -y >nul 2>&1
if not errorlevel 1 (
    echo [OK] Redis installed/updated
) else (
    echo [WARN] Redis installation skipped
)

echo.
echo [3/6] Installing Python dependencies...
call venv\Scripts\pip.exe install -q -r requirements.txt
call venv\Scripts\pip.exe install -q user-agents redis PyJWT cryptography python-dotenv psycopg2-binary
if errorlevel 1 (
    echo [ERROR] Python dependencies installation failed!
    pause
    exit /b 1
) else (
    echo [OK] Python dependencies installed
)

echo.
echo [4/6] Installing Node dependencies...
cd client
call npm install -q >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node dependencies installation failed!
    cd ..
    pause
    exit /b 1
) else (
    echo [OK] Node dependencies installed
)
cd ..

echo.
echo [5/6] Initializing PostgreSQL database...
call venv\Scripts\python.exe INIT_DB.py >nul 2>&1
if errorlevel 1 (
    echo [WARN] Database initialization: attempting retry...
    call venv\Scripts\python.exe INIT_DB.py
    if errorlevel 1 (
        echo [ERROR] Database initialization failed!
        echo [HELP] Ensure PostgreSQL is running and .env credentials are correct
        pause
        exit /b 1
    )
)
echo [OK] Database initialized

echo.
echo [6/6] Starting services...
echo [INFO] Flask Backend: http://127.0.0.1:5000
echo [INFO] React Frontend: http://localhost:3000
echo.

start "Flask Backend" cmd /k "title Flask Backend && venv\Scripts\python.exe run.py"
timeout /t 2 >nul

cd client
start "React Frontend" cmd /k "title React Frontend && npm run dev"
cd ..

echo.
echo ========================================
echo [OK] Services started!
echo ========================================
echo.
echo Press any key to close this window...
pause
start "React Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo [OK] Project started successfully!
echo ========================================
echo.
echo Backend:  http://127.0.0.1:5000
echo Frontend: http://localhost:3000
echo Database: PostgreSQL (required)
echo.
pause
