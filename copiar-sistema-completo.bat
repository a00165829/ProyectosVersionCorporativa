@echo off
echo =============================================================
echo Script para copiar TODO el sistema de login del proyecto fallido
echo =============================================================
echo.

set ORIGEN=C:\proyectos\RespaldosPMOPortal\backup_proyecto_17_04_2026_fallando
set DESTINO=C:\proyectos\pmo-portal

echo Origen: %ORIGEN%
echo Destino: %DESTINO%
echo.

echo ===== COPIANDO FRONTEND COMPLETO DE AUTH =====

echo Copiando src/context completa...
if exist "%ORIGEN%\frontend\src\context" (
    xcopy "%ORIGEN%\frontend\src\context\*" "%DESTINO%\frontend\src\context\" /E /I /Y
    echo ✓ Context copiado
)

echo Copiando src/hooks completa...
if exist "%ORIGEN%\frontend\src\hooks" (
    xcopy "%ORIGEN%\frontend\src\hooks\*" "%DESTINO%\frontend\src\hooks\" /E /I /Y
    echo ✓ Hooks copiados
)

echo Copiando src/lib completa...
if exist "%ORIGEN%\frontend\src\lib" (
    xcopy "%ORIGEN%\frontend\src\lib\*" "%DESTINO%\frontend\src\lib\" /E /I /Y
    echo ✓ Lib copiada
)

echo Copiando src/components completos...
if exist "%ORIGEN%\frontend\src\components" (
    xcopy "%ORIGEN%\frontend\src\components\*" "%DESTINO%\frontend\src\components\" /E /I /Y
    echo ✓ Components copiados
)

echo Copiando src/pages completas...
if exist "%ORIGEN%\frontend\src\pages" (
    xcopy "%ORIGEN%\frontend\src\pages\*" "%DESTINO%\frontend\src\pages\" /E /I /Y
    echo ✓ Pages copiadas
)

echo Copiando main.tsx y App.tsx...
if exist "%ORIGEN%\frontend\src\main.tsx" (
    copy "%ORIGEN%\frontend\src\main.tsx" "%DESTINO%\frontend\src\" /Y
    echo ✓ main.tsx copiado
)
if exist "%ORIGEN%\frontend\src\App.tsx" (
    copy "%ORIGEN%\frontend\src\App.tsx" "%DESTINO%\frontend\src\" /Y
    echo ✓ App.tsx copiado
)

echo.
echo ===== COPIANDO BACKEND COMPLETO =====

echo Copiando todas las rutas...
if exist "%ORIGEN%\backend\src\routes" (
    xcopy "%ORIGEN%\backend\src\routes\*" "%DESTINO%\backend\src\routes\" /E /I /Y
    echo ✓ Routes copiadas
)

echo Copiando middleware completo...
if exist "%ORIGEN%\backend\src\middleware" (
    xcopy "%ORIGEN%\backend\src\middleware\*" "%DESTINO%\backend\src\middleware\" /E /I /Y
    echo ✓ Middleware copiado
)

echo Copiando controllers...
if exist "%ORIGEN%\backend\src\controllers" (
    xcopy "%ORIGEN%\backend\src\controllers\*" "%DESTINO%\backend\src\controllers\" /E /I /Y
    echo ✓ Controllers copiados
)

echo Copiando index.ts del backend...
if exist "%ORIGEN%\backend\src\index.ts" (
    copy "%ORIGEN%\backend\src\index.ts" "%DESTINO%\backend\src\" /Y
    echo ✓ index.ts copiado
)

echo Copiando archivos de configuración...
if exist "%ORIGEN%\backend\src\config" (
    xcopy "%ORIGEN%\backend\src\config\*" "%DESTINO%\backend\src\config\" /E /I /Y
    echo ✓ Config copiado
)

echo.
echo =============================================================
echo Copia COMPLETA terminada!
echo =============================================================
echo.
echo SIGUIENTES PASOS:
echo 1. cd frontend && npm run build
echo 2. cd .. && docker build -t axitapppmo.azurecr.io/pmo-portal:latest .
echo 3. docker push axitapppmo.azurecr.io/pmo-portal:latest
echo 4. Restart en Azure
echo.
pause
