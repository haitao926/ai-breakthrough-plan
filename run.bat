@echo off
echo Starting AI Course Platform...

:: Check Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed.
    pause
    exit /b 1
)

:: Navigate to platform directory
cd platform

:: Check dependencies
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

:: Start server
echo Starting server...
echo Opening browser in 3 seconds...

:: Start browser in background
start "" "http://localhost:8080"

:: Start server
node server.js
pause