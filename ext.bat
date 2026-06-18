@echo off
title Expense Dashboard Launcher
echo ===================================================
echo       Expense Dashboard Launcher
echo ===================================================
echo.
echo Choose startup method:
echo [1] Local Mode (Frontend: Production via npm start)
echo [2] Production Container Mode (Docker Compose)
echo.
set /p choice="Enter choice (1 or 2, default is 1): "

if "%choice%"=="2" (
    echo.
    echo Starting via Docker Compose in detached mode...
    docker-compose up -d --build
    echo.
    echo Waiting for containers to initialize...
    timeout /t 5 >nul
    echo Launching Chrome...
    start chrome http://localhost:3000
    goto end
)

echo.
echo Preparing local production servers...
echo Building frontend for production (npm run build)...
cmd /c "cd frontend && npm run build"
start "Expense Backend Server" cmd /k "cd backend && npm run dev"
start "Expense Frontend Server" cmd /k "cd frontend && npm start"
echo.
echo Waiting 4 seconds for servers to start...
timeout /t 4 >nul
echo Launching Chrome...
start chrome http://localhost:3000

:end
echo.
echo Launcher finished. Enjoy your app!
timeout /t 3 >nul
