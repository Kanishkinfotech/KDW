@echo off
echo =======================================
echo Kanishk Digital World - Startup Script
echo =======================================

echo Starting Backend Server (port 5000)...
start "KDW Backend" cmd /k "cd server && npm run dev"

echo Starting Frontend Server (port 5173)...
start "KDW Frontend" cmd /k "cd ""front end"" && npm run dev"

echo Both servers are starting up in separate windows.
echo You can access the app at http://localhost:5173 once it's ready.
pause
