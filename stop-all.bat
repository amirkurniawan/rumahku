@echo off
REM RumahSubsidi.id - Stop All Services (Windows CMD wrapper)

WHERE bash >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Error: Git Bash not found!
    echo Please install Git for Windows or use Git Bash to run:
    echo   bash stop-all.sh
    exit /b 1
)

bash "%~dp0stop-all.sh"
