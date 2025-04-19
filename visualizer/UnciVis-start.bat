@echo off
REM Get folder where this script is located
set "MYDIR=%~dp0"
cd /d "%MYDIR%"
title UnciVis

REM Define the destruct file path
set "DESTRUCT_FILE=%MYDIR%destruct"

REM Step 1: Create a temporary destruct file and delete it immediately
echo [INFO] Creating destruct file...
echo This is a temporary file used for termination. > "%DESTRUCT_FILE%"
echo [INFO] Destruct file created at: %DESTRUCT_FILE%
timeout /t 2 >nul

echo [INFO] Deleting destruct file...
del "%DESTRUCT_FILE%" >nul 2>&1
echo [INFO] Destruct file deleted at: %DESTRUCT_FILE%

echo [INFO] Destruct file created and deleted successfully.

REM Step 2: Start the server
echo [INFO] Starting local server at http://localhost:8000...
start /B py -m http.server 8000
timeout /t 2 >nul
start "" "http://localhost:8000"
echo [INFO] Server started. Waiting for destruct file...

REM Step 3: Listen indefinitely for the destruct file created by another instance
:WAIT_FOR_DESTRUCT
echo [INFO] Listening for destruct file at: %DESTRUCT_FILE%...
if exist "%DESTRUCT_FILE%" (
    echo [INFO] Destruct file detected! Terminating this instance...
    REM Kill the Python HTTP server process
    taskkill /F /IM python.exe >nul 2>&1
    REM Terminate the batch script
    exit /b
)

REM Continue checking for the destruct file
timeout /t 1 >nul
goto WAIT_FOR_DESTRUCT
