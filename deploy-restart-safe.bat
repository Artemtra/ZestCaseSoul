@echo off
setlocal
cd /d "%~dp0"

echo Deploying ZestCaseSoul code and restarting the server.
echo Database, .env, uploads, node_modules and .git will not be changed.
echo.

python -c "import paramiko" >nul 2>nul
if errorlevel 1 (
  echo Python package paramiko is required.
  echo Install it with: python -m pip install paramiko
  pause
  exit /b 1
)

python scripts\deploy_restart_safe.py
if errorlevel 1 (
  echo.
  echo Deploy failed.
  pause
  exit /b 1
)

echo.
echo Done.
pause
