@echo off
setlocal

REM Ejecuta la API en modo "servicio" (sin consola) a traves del Programador de tareas.
REM Logs: backend\logs\api.log

set "BACKEND_DIR=%~dp0.."
cd /d "%BACKEND_DIR%" || exit /b 1

if not exist "%BACKEND_DIR%\logs" mkdir "%BACKEND_DIR%\logs"

REM Usar el python del venv (no depende de activate).
"%BACKEND_DIR%\venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 >> "%BACKEND_DIR%\logs\api.log" 2>&1
