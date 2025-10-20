@echo off
REM RumahSubsidi.id - Check Status (Windows CMD wrapper)
REM This calls Git Bash to run status.sh

WHERE bash >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Error: Git Bash not found!
    echo.
    echo Please install Git for Windows or use Git Bash to run:
    echo   bash status.sh
    echo.
    echo Or check status manually:
    echo   netstat -ano ^| findstr ":6000"
    echo   netstat -ano ^| findstr ":6001"
    exit /b 1
)

bash "%~dp0status.sh"
