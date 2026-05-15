@echo off
setlocal enabledelayedexpansion

:: 1. Detect Maven
set "MVN_EXE=mvn"
where mvn >nul 2>&1
if %errorlevel% neq 0 (
    set "INTEL_PATH=c:\Program Files\JetBrains\IntelliJ IDEA 2025.2.5\plugins\maven\lib\maven3\bin\mvn.cmd"
    if exist "!INTEL_PATH!" (
        set "MVN_EXE=!INTEL_PATH!"
    ) else (
        echo [ERROR] Maven not found! Please install Maven and add it to PATH.
        pause
        exit /b 1
    )
)

cls
echo ============================================================
echo      نظام حجز الفعاليات - جامعة باديا (النسخة النهائية)
echo      Badya University Event Booking (Final Version)
echo ============================================================
echo.

:: 2. Start Database
echo [+] Attempting to start MySQL...
net start MySQL80 >nul 2>&1 || net start MySQL >nul 2>&1
echo [OK] Done.

echo.

:: 3. Start Backend
echo [+] Starting Backend Server (MySQL Mode)...
echo [+] Please wait, this may take a minute...
echo.

cd /d "%~dp0"
if exist "PROJECT2\backend" ( cd "PROJECT2\backend" ) else if exist "backend" ( cd "backend" )

:: Run Maven
start "Badya_Backend" cmd /k ""%MVN_EXE%" spring-boot:run"

echo.
echo [+] Waiting 15 seconds for system startup...
timeout /t 15 /nobreak > nul

echo.

:: 4. Open Frontend
echo [+] Opening Frontend...
cd /d "%~dp0"
if exist "PROJECT2\index.html" ( start "" "PROJECT2\index.html" ) else if exist "index.html" ( start "" "index.html" )

echo.
echo ============================================================
echo   الآن النظام يعمل!
echo   1. تأكد من تشغيل ملف database_schema.sql في MySQL.
echo   2. اترك نافذة الباك إند مفتوحة دائماً.
echo ============================================================
pause
