@echo off
echo Starting Smart Money Screener...
echo.
echo Starting Backend (Node.js)...
cd /d "%~dp0backend"
start "SmartMoney Backend" cmd /k "npm install && node server.js"
echo.
timeout /t 5 >nul
echo Starting Frontend (React)...
cd /d "%~dp0frontend"
start "SmartMoney Frontend" cmd /k "npm install && npm run dev"
echo.
echo Done! Open http://localhost:5173 in your browser.
echo.
pause
