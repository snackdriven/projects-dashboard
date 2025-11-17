@echo off
REM Check git status of all projects
REM Usage: scripts\check-all-status.bat

cd /d "%~dp0\..\projects"

echo Checking git status of all projects...
echo.

for /d %%d in (*) do (
    echo ========================================
    echo %%d
    echo ========================================
    
    cd "%%d"
    
    if exist ".git" (
        for /f "tokens=*" %%b in ('git branch --show-current 2^>nul') do set branch=%%b
        for /f "tokens=*" %%r in ('git remote get-url origin 2^>nul') do set remote=%%r
        
        echo Branch: !branch!
        echo Remote: !remote!
        
        git status --porcelain >nul 2>&1
        if errorlevel 1 (
            echo Status: Clean
        ) else (
            echo Status: Has uncommitted changes
            git status --short | head -n 5
        )
    ) else (
        echo Status: Not a git repository
    )
    
    echo.
    cd ..
)

echo ========================================
echo Status check complete

