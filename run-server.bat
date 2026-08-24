@echo off
cd /d "%~dp0"
call npm root -g >nul 2>&1
if errorlevel 1 (
  echo Node.js/NPM is not installed.
  pause
  exit /b
)

echo Starting KWD Backend Server...
cd server
node dist/server.js
pause
