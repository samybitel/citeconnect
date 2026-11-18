@echo off
REM Arrete le serveur PostgreSQL local de CiteConnect.
setlocal
cd /d "%~dp0.."
set "PGDATA=%CD%\tools\pgdata"
tools\pgsql\bin\pg_ctl.exe -D "%PGDATA%" -m fast -w stop
endlocal