@echo off
cd /d %~dp0
echo Starting local server at http://localhost:8000
start /B py -m http.server 8000
start "" "server.url"
pause
