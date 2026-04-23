@echo off
setlocal

REM Sirve el frontend compilado en modo local (vite preview)
REM URL: http://localhost:5173/

cd /d "%~dp0frontend" || exit /b 1

start "Core Avicola Frontend" cmd /k "npm run preview -- --port 5173"
timeout /t 2 >nul
start http://localhost:5173/
