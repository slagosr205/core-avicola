@echo off
start "Frontend Dev Server" cmd /k "cd /d C:\Users\suamy\Documents\Proyectos\core-avicola\frontend && npm run dev"
start "Backend Server" cmd /k "cd /d C:\Users\suamy\Documents\Proyectos\core-avicola\backend && call venv\Scripts\activate.bat && python -m uvicorn app.main:app --port 8000"
echo Core Avicola iniciado
echo Frontend: http://localhost:5173
echo Backend: http://localhost:8000
pause