@echo off
title Expense Dashboard Launcher
echo ===================================================
echo       Expense Dashboard Launcher
echo ===================================================
echo.
echo Verification: Checking if Docker is running...
docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Docker is not running or not installed.
    echo Please start Docker Desktop and run this launcher again.
    echo.
    pause
    exit /b 1
)

echo.
echo Checking database container "expense_db"...
docker ps -a --format "{{.Names}}" | findstr /x "expense_db" >nul
if errorlevel 1 (
    echo Database container "expense_db" not found. Installing and starting it...
    docker-compose up -d database
) else (
    echo Database container "expense_db" found. Starting it...
    docker start expense_db >nul 2>&1
    docker port expense_db 27017 >nul 2>&1
    if errorlevel 1 (
        echo Database container "expense_db" is not exposing port 27017. Recreating it...
        docker rm -f expense_db >nul
        docker-compose up -d database
    )
)
echo.

echo Choose startup method:
echo [1] Local Mode (Frontend: Production via npm start)
echo [2] Production Container Mode (Docker Compose)
echo.
set /p choice="Enter choice (1 or 2, default is 1): "

if "%choice%"=="2" (
    echo.
    :: If expense_db exists but wasn't created by compose, remove it to avoid compose name conflicts
    docker ps -a --format "{{.Names}}" | findstr /x "expense_db" >nul
    if not errorlevel 1 (
        docker inspect --format "{{index .Config.Labels \"com.docker.compose.project\"}}" expense_db 2>nul | findstr /r "." >nul
        if errorlevel 1 (
            echo Removing non-compose "expense_db" container to avoid Docker Compose conflicts...
            docker rm -f expense_db >nul
        )
    )
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
