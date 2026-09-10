@echo off
title GlassMatch AI - Centinela Daemon Launcher
color 0A
echo.
echo  ======================================================
echo     GLASSMATCH AI - Centinela Autonomo (Fase 6)
echo     Escaneo en Segundo Plano y Alertas por Webhook
echo  ======================================================
echo.

cd /d "%~dp0"

echo  [*] Verificando que el servidor principal este activo...
netstat -ano | findstr /R /C:":3000.*LISTENING" >nul
if %errorlevel% neq 0 (
    echo  [!] El servidor web en puerto 3000 no esta activo.
    echo  [*] Iniciando servidor web primero...
    start "" /b cmd /c "npm.cmd run dev"
    timeout /t 5 /nobreak >nul
)

echo  [OK] Servidor detectado.
echo  [*] Iniciando Centinela Daemon en segundo plano...
echo  [*] Presiona Ctrl+C en esta ventana para pausar el Centinela.
echo.

node scripts/worker.mjs
pause
