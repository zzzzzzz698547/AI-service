@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

set "OLLAMA_HOST=http://127.0.0.1:11434"
set "OLLAMA_MODEL=qwen2.5:7b"

echo ==========================================
echo  Ollama One Click Setup
echo ==========================================
echo Model: %OLLAMA_MODEL%
echo Host : %OLLAMA_HOST%
echo.

where ollama >nul 2>nul
if errorlevel 1 (
  echo Ollama CLI was not found.
  echo Please install Ollama first: https://ollama.com/download
  pause
  exit /b 1
)

powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 '%OLLAMA_HOST%/api/version' | Out-Null; exit 0 } catch { exit 1 }" >nul 2>nul
if errorlevel 1 (
  echo Starting Ollama server in a visible window...
  start "Ollama Server" cmd /k ollama serve
) else (
  echo Ollama server is already running.
)

echo Waiting for Ollama to become ready...
set /a RETRIES=0
:wait_for_server
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 '%OLLAMA_HOST%/api/version' | Out-Null; exit 0 } catch { exit 1 }" >nul 2>nul
if not errorlevel 1 goto server_ready
set /a RETRIES+=1
if !RETRIES! geq 30 goto server_timeout
timeout /t 2 /nobreak >nul
goto wait_for_server

:server_ready
echo Ollama is ready.
echo.
echo Checking whether %OLLAMA_MODEL% is installed...
ollama list | findstr /i /c:"%OLLAMA_MODEL%" >nul 2>nul
if errorlevel 1 (
  echo Pulling model %OLLAMA_MODEL% ...
  call ollama pull %OLLAMA_MODEL%
  if errorlevel 1 (
    echo Model download failed.
    pause
    exit /b 1
  )
) else (
  echo Model already installed.
)

echo.
echo Ollama setup complete.
pause
exit /b 0

:server_timeout
echo Ollama did not become ready in time.
echo If the server is still starting, wait a moment and run this file again.
pause
exit /b 1
