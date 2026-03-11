@echo off
setlocal
cd /d %~dp0
set PATH=%~dp0..\node-v22.14.0-win-x64;%PATH%
set npm_config_cache=%~dp0.npm-cache

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
  echo Stopping existing process on port 3001: %%a
  taskkill /PID %%a /F >nul 2>nul
)

timeout /t 1 >nul
call ..\node-v22.14.0-win-x64\node.exe server\index.js
if errorlevel 1 (
  echo.
  echo Server failed to start.
  pause
)
