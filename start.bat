@echo off
setlocal EnableDelayedExpansion
title Broken Link Checker
cd /d "%~dp0"

echo.
echo  ==========================================
echo   Broken Link Checker  -  Single Command
echo  ==========================================
echo.

:: ── 1. Check Python ────────────────────────────────────────────────────────
where py >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python not found.
    echo         Install Python 3.11+ from https://python.org and enable "Add to PATH".
    pause & exit /b 1
)

:: ── 2. Check Node / npm ────────────────────────────────────────────────────
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found.
    echo         Install Node.js LTS from https://nodejs.org
    pause & exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm not found. Reinstall Node.js LTS.
    pause & exit /b 1
)

:: ── 3. Create .env if missing ──────────────────────────────────────────────
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env" >nul
    echo [OK] Created backend\.env from .env.example
    echo      Edit it to add your SAFE_BROWSING_API_KEY / VIRUSTOTAL_API_KEY if needed.
)

:: ── 4. Python venv ─────────────────────────────────────────────────────────
if not exist "backend\venv\Scripts\python.exe" (
    echo [SETUP] Creating Python virtual environment...
    py -3 -m venv backend\venv
    if errorlevel 1 (
        echo [ERROR] Could not create Python venv.
        pause & exit /b 1
    )
)

:: ── 5. Python packages ─────────────────────────────────────────────────────
echo [SETUP] Installing / verifying Python packages...
"backend\venv\Scripts\python.exe" -m pip install --upgrade pip -q
if errorlevel 1 ( echo [ERROR] pip upgrade failed. & pause & exit /b 1 )
"backend\venv\Scripts\python.exe" -m pip install -r "backend\requirements.txt" -q
if errorlevel 1 ( echo [ERROR] pip install failed. & pause & exit /b 1 )

:: ── 6. Node packages ───────────────────────────────────────────────────────
if not exist "frontend\node_modules" (
    echo [SETUP] Installing frontend packages (first run only)...
    pushd frontend
    call npm install --silent
    if errorlevel 1 ( popd & echo [ERROR] npm install failed. & pause & exit /b 1 )
    popd
)

:: ── 7. Launch backend in background ───────────────────────────────────────
echo.
echo [START] Backend   ^>  http://127.0.0.1:5001
echo [START] Frontend  ^>  http://localhost:3000
echo.
echo  Both servers run in THIS window.
echo  Press Ctrl+C to stop everything.
echo.
echo  NOTE: MongoDB must be running locally for login / scan history.
echo ──────────────────────────────────────────────────────────────

:: Start Flask in background; pipe output so user can see errors
start /B "BLC-Backend" cmd /c ^
    "cd /d "%~dp0backend" && "..\backend\venv\Scripts\python.exe" app.py 2>&1"

:: Small pause so Flask is up before Vite proxy tries it
timeout /t 3 /nobreak >nul

:: ── 8. Launch frontend (blocks this window) ────────────────────────────────
cd /d "%~dp0frontend"
npm run dev -- --host 127.0.0.1

:: If Vite exits, kill the background Flask process too
taskkill /F /IM python.exe /FI "WINDOWTITLE eq BLC-Backend" >nul 2>nul

echo.
echo  Both servers stopped. Press any key to close.
pause >nul
