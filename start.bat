@echo off
REM Get folder where this script is located
set "MYDIR=%~dp0"
cd /d "%MYDIR%"

echo Running from: %CD%
echo Starting local server at http://localhost:8000

start /B py -m http.server 8000
timeout /t 2 >nul
start "" "http://localhost:8000"
pause
