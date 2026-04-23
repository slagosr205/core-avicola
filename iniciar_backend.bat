@echo off
REM Script para iniciar Core Avicola

echo ========================================
echo   CORE AVICOLA - Sistema Avicola ERP
echo ========================================
echo.

cd /d "%~dp0backend"

echo [1] Activando entorno virtual...
call venv\Scripts\activate.bat

echo.
echo [2] Iniciando Backend (FastAPI)...
echo    El backend estara disponible en: http://localhost:8000
echo    Documentacion API: http://localhost:8000/docs
echo.
python -m uvicorn app.main:app --reload --port 8000

pause
