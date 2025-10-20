@echo off
REM RumahSubsidi.id - Start Production (Local Testing) - Windows Wrapper

WHERE bash >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Error: Git Bash not found!
    echo Please install Git for Windows from: https://git-scm.com/download/win
    echo Or run this script from Git Bash terminal
    pause
    exit /b 1
)

bash "%~dp0start-prod-local.sh"
