@echo off
REM Installe les dependances, prepare la base et seed les donnees de demonstration.
REM Prerequis : scripts\db-init.cmd execute (cluster PostgreSQL demarre).
setlocal
cd /d "%~dp0.."

if not exist ".env" (
  echo [CiteConnect] Creation de .env depuis .env.example...
  copy /y ".env.example" ".env" >nul
)

echo [CiteConnect] Installation des dependances...
call npm install
if errorlevel 1 exit /b 1

echo [CiteConnect] Generation du client Prisma...
call npm run db:generate
if errorlevel 1 exit /b 1

echo [CiteConnect] Application du schema...
call npm run db:push
if errorlevel 1 exit /b 1

echo [CiteConnect] Seed des donnees...
call npm run db:seed
if errorlevel 1 exit /b 1

echo [CiteConnect] Installation terminee. Lancez scripts\dev.cmd
endlocal