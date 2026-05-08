@echo off
cd /d C:\Users\ngadewar\Desktop\Hackathon
echo.
echo ============================================
echo   AI Approval Assistant - Full Setup
echo ============================================
echo.

echo [1/4] Generating all project files...
node run.js
if %errorlevel% neq 0 (
  echo ERROR: node run.js failed. Make sure Node.js is installed.
  pause
  exit /b 1
)

echo.
echo [2/4] Installing backend dependencies...
cd /d C:\Users\ngadewar\Desktop\Hackathon\backend
call npm install
if %errorlevel% neq 0 (
  echo ERROR: npm install in backend failed.
  pause
  exit /b 1
)

echo.
echo [3/4] Installing frontend dependencies...
cd /d C:\Users\ngadewar\Desktop\Hackathon\frontend
call npm install
if %errorlevel% neq 0 (
  echo ERROR: npm install in frontend failed.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo [4/4] To start the app, open TWO terminal windows:
echo.
echo   Terminal 1 (Backend):
echo     cd C:\Users\ngadewar\Desktop\Hackathon\backend
echo     node server.js
echo.
echo   Terminal 2 (Frontend):
echo     cd C:\Users\ngadewar\Desktop\Hackathon\frontend
echo     npm run dev
echo.
echo   Then open: http://localhost:5173
echo.
pause
