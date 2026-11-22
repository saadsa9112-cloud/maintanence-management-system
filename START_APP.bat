@echo off
title Al Mustafa Heights Maintenance ERP System
echo ========================================================
echo   Al Mustafa Heights Building Maintenance System
echo ========================================================
echo.

if exist "%~dp001-web-application" (
    cd /d "%~dp001-web-application"
) else if exist "%~dp0app" (
    cd /d "%~dp0app"
) else (
    echo [ERROR] Web application folder not found!
    pause
    exit /b 1
)

echo Starting Development Server...
start "" http://localhost:5173
npm run dev
pause
