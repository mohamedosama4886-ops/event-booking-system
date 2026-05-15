@echo off
set "NODE_EXE=C:\Program Files\nodejs\node.exe"
set "PROJECT_DIR=%~dp0PROJECT2\whatsapp-service"
if not exist "%PROJECT_DIR%" set "PROJECT_DIR=%~dp0whatsapp-service"

echo Current Directory: %~dp0
echo Project Directory: %PROJECT_DIR%
echo.

if exist "%PROJECT_DIR%" (
    echo [OK] Found WhatsApp folder.
    cd /d "%PROJECT_DIR%"
    "%NODE_EXE%" index.js
) else (
    echo [ERROR] Could not find whatsapp-service folder.
)
pause
