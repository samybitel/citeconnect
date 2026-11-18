@echo off
REM Initialise le cluster PostgreSQL portable de CiteConnect (premiere installation uniquement).
REM Auth "trust" limitee a localhost : reserve au developpement local, jamais a la production.
setlocal
cd /d "%~dp0.."
set "PGDATA=%CD%\tools\pgdata"
set "PGBIN=%CD%\tools\pgsql\bin"

if not exist "%PGDATA%\PG_VERSION" (
  echo [CiteConnect] Initialisation du cluster PostgreSQL...
  "%PGBIN%\initdb.exe" -D "%PGDATA%" -U postgres -E UTF8 --locale=C -A trust
  if errorlevel 1 exit /b 1
)

echo [CiteConnect] Demarrage de PostgreSQL...
"%PGBIN%\pg_ctl.exe" -D "%PGDATA%" -l "%PGDATA%\server.log" -w start
if errorlevel 1 exit /b 1

echo [CiteConnect] Creation du role et de la base...
"%PGBIN%\psql.exe" -U postgres -h localhost -p 5432 -d postgres -v ON_ERROR_STOP=1 -c "DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='citeconnect') THEN CREATE ROLE citeconnect LOGIN PASSWORD 'citeconnect_dev_2026'; END IF; END $$;"
if errorlevel 1 exit /b 1
"%PGBIN%\psql.exe" -U postgres -h localhost -p 5432 -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='citeconnect'" | findstr /c:"1" >nul
if errorlevel 1 (
  "%PGBIN%\psql.exe" -U postgres -h localhost -p 5432 -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE citeconnect OWNER citeconnect;"
  if errorlevel 1 exit /b 1
)

echo [CiteConnect] Base prete. Lancez scripts\setup.cmd pour installer et seeders.
endlocal