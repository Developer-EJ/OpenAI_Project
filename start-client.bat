@echo off
setlocal
cd /d %~dp0
set PATH=%~dp0..\node-v22.14.0-win-x64;%PATH%
set npm_config_cache=%~dp0.npm-cache

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
  echo Stopping existing process on port 5173: %%a
  taskkill /PID %%a /F >nul 2>nul
)

timeout /t 1 >nul
call ..\node-v22.14.0-win-x64\npm.cmd run dev:client -- --host 127.0.0.1
if errorlevel 1 (
  echo.
  echo Client failed to start.
  pause
)
