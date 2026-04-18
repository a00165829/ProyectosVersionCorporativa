@echo off
echo =============================================================
echo Script para copiar auth.ts completo del proyecto fallido
echo =============================================================
echo.

set ORIGEN=C:\proyectos\RespaldosPMOPortal\backup_proyecto_17_04_2026_fallando
set DESTINO=C:\proyectos\pmo-portal

echo Origen: %ORIGEN%
echo Destino: %DESTINO%
echo.

echo ===== COPIANDO ARCHIVO auth.ts COMPLETO =====

echo Buscando auth.ts en backend/routes...
if exist "%ORIGEN%\backend\src\routes\auth.ts" (
    echo ✓ Archivo encontrado: %ORIGEN%\backend\src\routes\auth.ts
    copy "%ORIGEN%\backend\src\routes\auth.ts" "%DESTINO%\backend\src\routes\auth.ts" /Y
    echo ✓ auth.ts copiado exitosamente
    echo.
    echo Contenido del archivo copiado:
    echo -----------------------------------
    type "%DESTINO%\backend\src\routes\auth.ts"
    echo -----------------------------------
) else (
    echo ✗ auth.ts no encontrado en backend/src/routes/
    echo.
    echo Buscando en otras ubicaciones...
    dir /S "%ORIGEN%" | findstr "auth.ts"
)

echo.
echo =============================================================
echo Copia completada!
echo =============================================================
echo.
echo SIGUIENTES PASOS:
echo 1. Revisar que el archivo tiene la ruta /dev-signin
echo 2. docker build -t axitapppmo.azurecr.io/pmo-portal:latest .
echo 3. docker push axitapppmo.azurecr.io/pmo-portal:latest
echo 4. Restart en Azure
echo.
pause
