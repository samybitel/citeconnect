@echo off
REM Demarre le serveur PostgreSQL local de CiteConnect (portable).
setlocal
cd /d "%~dp0.."
set "PGDATA=%CD%\tools\pgdata"
if not exist "%PGDATA%\PG_VERSION" (
  echo [CiteConnect] Cluster introuvable. Lancez d'abord scripts\db-init.cmd
  exit /b 1
)
tools\pgsql\bin\pg_ctl.exe -D "%PGDATA%" -l "%PGDATA%\server.log" -w start
endlocal