@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title JARCAR R25 - FRONTEND INDEPENDIENTE

echo.
echo =====================================================
echo   JARCAR MOTORS R25 - SOLO FRONTEND
echo   http://127.0.0.1:4631/jarcar
echo =====================================================
echo.
where node >nul 2>&1
if errorlevel 1 goto no_node
where npm >nul 2>&1
if errorlevel 1 goto no_npm
if not exist "package.json" goto no_files
if not exist "src\jarcar-v4\rebirth.css" goto no_files
if not exist "src\jarcar-v4\Home.tsx" goto no_files
if not exist "src\jarcar-v4\RouteFinder.tsx" goto no_files
if not exist "src\jarcar-v4\SavedPage.tsx" goto no_files
if not exist "src\jarcar-v4\compare-r16.css" goto no_files
if not exist "scripts\verificar-r16.cjs" goto no_files
if not exist "src\jarcar-v4\Conocenos.tsx" goto no_files
if not exist "src\jarcar-v4\Visit.tsx" goto no_files
if not exist "src\jarcar-v4\about-r17.css" goto no_files
if not exist "src\jarcar-v4\visit-r17.css" goto no_files
if not exist "scripts\verificar-r17.cjs" goto no_files
if not exist "scripts\verificar-r18.cjs" goto no_files
if not exist "src\jarcar-v4\r18-polish.css" goto no_files
if not exist "src\jarcar-v4\r20-mobile-showroom.css" goto no_files
if not exist "src\jarcar-v4\r23-detail.css" goto no_files
if not exist "src\jarcar-v4\r24-home-mobile.css" goto no_files
if not exist "src\jarcar-v4\r25-pinned-header.css" goto no_files
if not exist "vercel.json" goto no_files
if not exist "scripts\verificar-r23.cjs" goto no_files
if not exist "scripts\verificar-r20.cjs" goto no_files
if not exist "src\jarcar-v4\about-r9.css" goto no_files
if not exist "src\jarcar-v4\r9.css" goto no_files
if not exist "src\jarcar-v4\r10.css" goto no_files
if not exist "src\jarcar-v4\r12-home.css" goto no_files
if not exist "src\jarcar-v4\r12-design.css" goto no_files
if not exist "src\jarcar-v4\r13-catalog.css" goto no_files
if not exist "src\jarcar-v4\r14-detail.css" goto no_files
if not exist "src\jarcar-v4\route-r15.css" goto no_files
if not exist "scripts\verificar-r15.cjs" goto no_files
if not exist "scripts\verificar-r14.cjs" goto no_files
if not exist "src\jarcar-v4\Catalog.tsx" goto no_files
if not exist "public\jarcar-v4\design\editorial-journey.svg" goto no_files
if not exist "src\jarcar-v4\CommandPalette.tsx" goto no_files
if not exist "node_modules\.bin\vite.cmd" goto install
if not exist "node_modules\.bin\tsc.cmd" goto install
goto run

:install
echo Instalando dependencias de React, TypeScript y Vite...
echo Este paso requiere internet la primera vez.
call npm install --no-audit --no-fund
if errorlevel 1 goto install_error

:run
echo.
echo Abriendo Jarcar R25 en el puerto 4631...
echo Si el puerto esta ocupado, NO se abrira la version vieja.
echo Para cerrar, presiona Ctrl+C.
echo.
call npm run dev
if errorlevel 1 goto run_error
exit /b 0

:no_node
echo ERROR: Instala Node.js 20.19 o superior (recomendado Node 22/24).
goto end_error
:no_npm
echo ERROR: npm no esta instalado o no esta en PATH.
goto end_error
:no_files
echo ERROR: Faltan archivos del frontend. Descomprime el ZIP completo.
goto end_error
:install_error
echo ERROR: No se pudo instalar. Revisa internet y el error mostrado.
goto end_error
:run_error
echo ERROR: El servidor no pudo iniciar, posiblemente puerto 4631 ocupado.
goto end_error
:end_error
pause
exit /b 1
