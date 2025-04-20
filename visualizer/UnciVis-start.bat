@echo off
set "MYDIR=%~dp0"
cd /d "%MYDIR%"
title UnciVis

set "DESTRUCT_FILE=%MYDIR%destruct"
echo This is a temporary file used for termination. > "%DESTRUCT_FILE%"
del "%DESTRUCT_FILE%" >nul 2>&1
timeout /t 1 >nul

echo [INFO] Starting local server at http://localhost:8000...
start /B py -m http.server 8000

start "" firefox.exe "http://localhost:8000"
echo [INFO] Server started

:WAIT_FOR_DESTRUCT
if exist "%DESTRUCT_FILE%" (
    echo [INFO] Destruct file detected! Terminating this instance...
    REM Kill the Python HTTP server process
    taskkill /F /IM python.exe >nul 2>&1
    REM Terminate the batch script
    exit /b
)
goto WAIT_FOR_DESTRUCT