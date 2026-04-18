@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

echo ==========================================
echo  Loan Smart Intake CRM - One Click Runner
echo ==========================================

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Please install Node.js 20+ first.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Please reinstall Node.js with npm included.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

if not exist ".env.local" (
  if exist ".env.example" (
    copy ".env.example" ".env.local" >nul
    echo Created .env.local from .env.example.
  )
)

if not exist ".env" (
  if exist ".env.local" (
    copy ".env.local" ".env" >nul
    echo Created .env from .env.local for Prisma compatibility.
  )
)

echo Generating Prisma client...
call npm run prisma:generate
if errorlevel 1 (
  echo Prisma generate failed.
  pause
  exit /b 1
)

set "HAS_DATABASE_URL="
if exist ".env.local" (
  findstr /i /r "^DATABASE_URL=" ".env.local" >nul 2>nul
  if not errorlevel 1 set "HAS_DATABASE_URL=1"
)

set "DATABASE_IS_SAMPLE="
if defined HAS_DATABASE_URL (
  findstr /i /c:"postgresql://postgres:password@localhost:5432/loan_crm" ".env.local" >nul 2>nul
  if not errorlevel 1 set "DATABASE_IS_SAMPLE=1"
)

if defined HAS_DATABASE_URL if not defined DATABASE_IS_SAMPLE (
  echo Applying Prisma schema...
  call npm run prisma:push
  if errorlevel 1 (
    echo Prisma db push failed, continuing with demo data only.
  )

  echo Seeding database...
  call npm run seed
  if errorlevel 1 (
    echo Seed failed, continuing without seed.
  )
) else (
  if defined DATABASE_IS_SAMPLE (
    echo DATABASE_URL is still using the sample placeholder.
    echo Skipping Prisma db push and seed until you replace it with a real database URL.
  ) else (
    echo DATABASE_URL was not found in .env.local.
  )
  echo Skipping Prisma db push and seed.
  echo If you want real database data, edit .env.local and set DATABASE_URL.
)

echo Starting Next.js development servers...
call node scripts\run-dual-dev.mjs
if errorlevel 1 goto :startup_failed

echo Press Ctrl+C to stop this window.
pause
exit /b 0

:startup_failed
echo Next.js did not become ready.
echo Check the console output above for details.
pause
exit /b 1
