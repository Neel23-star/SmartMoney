@echo off
echo.
echo ============================================
echo   Starting AI Approval Assistant
echo ============================================
echo.

REM Check if backend folder exists (has been set up)
if not exist "C:\Users\ngadewar\Desktop\Hackathon\backend\node_modules" (
  echo ERROR: Backend not set up. Please run runme.bat first!
  pause
  exit /b 1
)
if not exist "C:\Users\ngadewar\Desktop\Hackathon\frontend\node_modules" (
  echo ERROR: Frontend not set up. Please run runme.bat first!
  pause
  exit /b 1
)

echo Starting Backend on http://localhost:3001 ...
start "AI Approval Backend" cmd /k "cd /d C:\Users\ngadewar\Desktop\Hackathon\backend && node server.js"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend on http://localhost:5173 ...
start "AI Approval Frontend" cmd /k "cd /d C:\Users\ngadewar\Desktop\Hackathon\frontend && npm run dev"

echo.
echo Both servers starting in separate windows.
echo Open your browser at: http://localhost:5173
echo.
pause
