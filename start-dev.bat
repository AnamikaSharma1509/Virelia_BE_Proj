@echo off
TITLE Virelia Local Development Launcher
echo =======================================================
echo   VIRELIA - Practice. Perform. Grow.
echo   Full-Stack Guided Confidence-Building Platform
echo =======================================================
echo.

REM Verify Python
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not found in PATH. Please install Python 3.11+.
    pause
    exit /b 1
)

REM Verify Node
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not found in PATH. Please install Node.js LTS.
    pause
    exit /b 1
)

echo [1/3] Checking Backend Virtual Environment...
if not exist "backend\venv\Scripts\activate.bat" (
    echo Creating Python virtual environment...
    cd backend
    python -m venv venv
    call venv\Scripts\activate.bat
    python -m pip install --upgrade pip
    pip install -r requirements.txt
    cd ..
)

echo [2/3] Checking Frontend Dependencies...
if not exist "frontend\node_modules" (
    echo Installing frontend npm packages...
    cd frontend
    call npm install
    cd ..
)

echo [3/3] Launching Virelia Services in Dedicated Windows...
echo.
echo Launching FastAPI Backend on http://localhost:8000 (Swagger docs: http://localhost:8000/docs)...
start "Virelia Backend (FastAPI)" cmd /k "cd backend && call venv\Scripts\activate.bat && venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

echo Launching React Frontend on http://localhost:5173...
start "Virelia Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo =======================================================
echo   Virelia is running!
echo   - Web Application: http://localhost:5173
echo   - Backend API:     http://localhost:8000/docs
echo.
echo   Default Seed Logins:
echo   - Admin:   anamika.admin@gmail.com / Admin@Virelia2026!
echo   - Patient: demo.patient@virelia.com  / Patient@Virelia2026!
echo =======================================================
echo.
pause
