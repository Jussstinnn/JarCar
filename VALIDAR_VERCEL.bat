@echo off
setlocal
cd /d "%~dp0"
title JARCAR R25 - Validar Vercel

echo =============================================
echo    JARCAR R25 - Verificacion antes de Vercel
echo =============================================

where node >nul 2>&1 || goto missing
where npm >nul 2>&1 || goto missing

node scripts\verificar-r25-vercel.cjs || goto failure
node scripts\verificar-assets.cjs || goto failure

if not exist "node_modules\.bin\vite.cmd" (
  echo Instalando dependencias...
  call npm install --no-audit --no-fund || goto failure
)

echo Compilando TypeScript y Vite...
call npm run build || goto failure

echo.
echo OK: dist/ compilada. Revisar visualmente antes de enviar.
pause
exit /b 0
:missing
echo ERROR: se necesita Node.js y npm.
goto failure
:failure
echo La version no ha superado la certificacion local.
pause
exit /b 1
