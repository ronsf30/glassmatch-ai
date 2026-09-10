@echo off
title GlassMatch AI - Caribbean Sea Glass Launcher
color 0B
echo.
echo  ======================================================
echo     GLASSMATCH AI - Caribbean Sea Glass Edition
echo     Asistente Inteligente de Match Laboral y CRM
echo  ======================================================
echo.

cd /d "%~dp0"

echo  [*] Verificando estado del servidor...
netstat -ano | findstr /R /C:":3000.*LISTENING" >nul
if %errorlevel% equ 0 (
    echo  [!] El servidor ya se encuentra en ejecucion en el puerto 3000.
    echo  [*] Abriendo GlassMatch AI en tu navegador...
    start http://localhost:3000
    timeout /t 3 >nul
    exit
)

echo  [*] Iniciando servidor local Next.js con Turbopack...
start "" /b cmd /c "npm.cmd run dev"

echo  [*] Esperando inicializacion del servidor...
:wait_loop
timeout /t 2 /nobreak >nul
netstat -ano | findstr /R /C:":3000.*LISTENING" >nul
if %errorlevel% neq 0 (
    echo  [*] Cargando modulos...
    goto wait_loop
)

echo.
echo  [OK] Servidor listo. Abriendo GlassMatch AI en tu navegador...
start http://localhost:3000

echo.
echo  ======================================================
echo   GlassMatch AI esta activo en: http://localhost:3000
echo   Puedes minimizar esta ventana. Para cerrar la app,
echo   simplemente cierra esta ventana.
echo  ======================================================
echo.
pause
