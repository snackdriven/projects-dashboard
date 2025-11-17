@echo off
cd /d "%~dp0"

REM Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
)

REM Start the dashboard
echo Starting Projects Dashboard...
call npm run dev

