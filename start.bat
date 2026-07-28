@echo off
setlocal EnableExtensions

set "PROJECT_DIR=%~dp0"
set "PORT=3000"
set "LOCAL_URL=http://localhost:%PORT%"
set "CHECK_URL=http://127.0.0.1:%PORT%"
set "PUBLIC_URL=https://zestcasesoul.ru"
set "APP_URL=%PUBLIC_URL%"
set "NPM_CMD="

cd /d "%PROJECT_DIR%"

echo.
echo === CaseLab launcher ===
echo Project: %PROJECT_DIR%
echo Local URL: %LOCAL_URL%
echo Public URL: %PUBLIC_URL%
echo.

where node.exe >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js was not found.
  echo Install Node.js, then run this file again.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm.cmd was not found.
  echo Reinstall Node.js and enable npm during installation.
  pause
  exit /b 1
)
for /f "delims=" %%N in ('where npm.cmd 2^>nul') do (
  if not defined NPM_CMD set "NPM_CMD=%%N"
)

if not exist ".env" (
  echo ERROR: .env file was not found.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  call "%NPM_CMD%" install
  if errorlevel 1 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
  )
)

echo Running database migrations...
call "%NPM_CMD%" run migrate
if errorlevel 1 (
  echo.
  echo ERROR: migrations failed.
  echo Check that MariaDB is running and .env database settings are correct.
  pause
  exit /b 1
)

echo.
echo Freeing port %PORT% if this project already uses it...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$port=%PORT%; $items=Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue; foreach($item in $items){ $proc=Get-Process -Id $item.OwningProcess -ErrorAction SilentlyContinue; if($proc -and $proc.ProcessName -eq 'node'){ Stop-Process -Id $proc.Id -Force } }" >nul 2>nul
timeout /t 1 /nobreak >nul

echo Starting Node server...
start "CaseLab server" /D "%PROJECT_DIR%" cmd /k ""%NPM_CMD%" start"

echo Waiting for server...
set "SERVER_READY=0"
for /L %%I in (1,1,30) do (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $response = Invoke-WebRequest -UseBasicParsing '%CHECK_URL%/api/models' -TimeoutSec 4; if ($response.StatusCode -eq 200) { exit 0 }; exit 1 } catch { exit 1 }" >nul 2>nul
  if not errorlevel 1 (
    set "SERVER_READY=1"
    goto server_ready
  )
  timeout /t 1 /nobreak >nul
)

:server_ready
if not "%SERVER_READY%"=="1" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $tcp = Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue; if ($tcp) { exit 0 }; exit 1 } catch { exit 1 }" >nul 2>nul
  if not errorlevel 1 (
    echo.
    echo Server port %PORT% is open, but health check was slow.
    echo Try opening %LOCAL_URL% in the browser.
    goto server_ready_ok
  )
  echo.
  echo ERROR: server did not answer at %CHECK_URL%/api/models.
  echo Check the "CaseLab server" window to see the exact error.
  pause
  exit /b 1
)

:server_ready_ok
echo.
echo Server is running: %LOCAL_URL%
echo Public domain configured in app: %PUBLIC_URL%
echo.
echo To open %PUBLIC_URL% without ":3000", point DNS to this server
echo and forward HTTP port 80 to local port %PORT% with a reverse proxy.
echo.
pause
