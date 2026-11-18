@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title JARCAR R25 - VERIFICACION FRONTEND
echo.
echo JARCAR R25 - VALIDACION PARA VERCEL
echo.
where node >nul 2>&1 || goto nonode
where npm >nul 2>&1 || goto nonode

echo [1/5] Datos, rutas y fotografias...
node scripts\verificar-assets.cjs || goto fail
node scripts\verificar-ruta.cjs || goto fail

echo [2/5] Pruebas offline vigentes de continuidad...
node scripts\verificar-r9.cjs || goto fail
node scripts\verificar-r10.cjs || goto fail
node scripts\verificar-r11.cjs || goto fail
node scripts\verificar-r14.cjs || goto fail
node scripts\verificar-r15.cjs || goto fail
node scripts\verificar-r16.cjs || goto fail
node scripts\verificar-r17.cjs || goto fail
node scripts\verificar-r18.cjs || goto fail
node scripts\verificar-r23.cjs || goto fail
node scripts\verificar-r24.cjs || goto fail
node scripts\verificar-r25-vercel.cjs || goto fail

echo [3/5] Instalacion de dependencias (si hace falta)...
if not exist "node_modules\.bin\vite.cmd" call npm install --no-audit --no-fund
if errorlevel 1 goto fail

echo [4/5] TypeScript completo...
call npm run check || goto fail

echo [5/5] Build Vite...
call npm run build || goto fail

echo.
echo PASS: todas las verificaciones terminaron correctamente.
echo PENDIENTE: pruebas manuales en navegador y dispositivos.
pause
exit /b 0
:nonode
echo ERROR: Node.js o npm no encontrados.
goto fail
:fail
echo.
echo FALLÓ: revisa el mensaje anterior. No se certifica esta version.
pause
exit /b 1
