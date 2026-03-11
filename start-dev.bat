@echo off
setlocal
cd /d %~dp0

echo Starting Jungle Campus server and client...
start "Jungle Campus Server" cmd /k start-server.bat
start "Jungle Campus Client" cmd /k start-client.bat

echo.
echo If your browser does not open automatically, visit http://localhost:5173
pause
