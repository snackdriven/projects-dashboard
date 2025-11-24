@echo off
echo Launching Projects Dashboard in WSL for better performance...
echo.

REM Get the Windows path and convert to WSL path
set "WINDOWS_PATH=%~dp0"
REM Remove trailing backslash
set "WINDOWS_PATH=%WINDOWS_PATH:~0,-1%"

REM Launch in WSL - this will use the launch.sh script
wsl bash -c "cd '%WINDOWS_PATH%' && bash launch.sh"

