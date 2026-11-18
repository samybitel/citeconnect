@echo off
REM Demarre PostgreSQL puis le serveur de developpement Next.js (http://localhost:3000).
setlocal
cd /d "%~dp0.."

call "%~dp0db-start.cmd"
if errorlevel 1 exit /b 1

echo [CiteConnect] Serveur de developpement sur http://localhost:3000
call npm run dev
endlocal