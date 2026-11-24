@echo off
echo Starting Government AI Operating System...
echo.
echo Starting Backend (port 5000)...
start cmd /k "cd backend && npm run dev"
timeout /t 3
echo Starting Frontend (port 3000)...
start cmd /k "cd frontend && npm start"
echo.
echo Open http://localhost:3000 in your browser
echo Admin login: admin@gov.in / Admin@123
pause
