@echo off
echo =============================================================
echo Script para copiar archivos de autenticacion y permisos
echo Del proyecto fallido al proyecto recuperado
echo =============================================================
echo.

set ORIGEN=C:\proyectos\RespaldosPMOPortal\backup_proyecto_17_04_2026_fallando
set DESTINO=C:\proyectos\pmo-portal

echo Origen: %ORIGEN%
echo Destino: %DESTINO%
echo.

echo ===== COPIANDO ARCHIVOS DE FRONTEND =====

echo Copiando AuthContext...
if exist "%ORIGEN%\frontend\src\context\AuthContext.tsx" (
    copy "%ORIGEN%\frontend\src\context\AuthContext.tsx" "%DESTINO%\frontend\src\context\" /Y
    echo ✓ AuthContext.tsx copiado
) else (
    echo ✗ AuthContext.tsx no encontrado
)

echo Copiando hooks de auth...
if exist "%ORIGEN%\frontend\src\hooks\useAuth.ts" (
    copy "%ORIGEN%\frontend\src\hooks\useAuth.ts" "%DESTINO%\frontend\src\hooks\" /Y
    echo ✓ useAuth.ts copiado
) else (
    echo ✗ useAuth.ts no encontrado
)

echo Copiando lib de auth...
if exist "%ORIGEN%\frontend\src\lib\auth.ts" (
    copy "%ORIGEN%\frontend\src\lib\auth.ts" "%DESTINO%\frontend\src\lib\" /Y
    echo ✓ auth.ts copiado
) else (
    echo ✗ auth.ts no encontrado
)

echo Copiando ProtectedRoute...
if exist "%ORIGEN%\frontend\src\components\ProtectedRoute.tsx" (
    copy "%ORIGEN%\frontend\src\components\ProtectedRoute.tsx" "%DESTINO%\frontend\src\components\" /Y
    echo ✓ ProtectedRoute.tsx copiado
) else (
    echo ✗ ProtectedRoute.tsx no encontrado
)

echo Copiando carpeta Admin completa...
if exist "%ORIGEN%\frontend\src\pages\Admin" (
    xcopy "%ORIGEN%\frontend\src\pages\Admin\*" "%DESTINO%\frontend\src\pages\Admin\" /E /I /Y
    echo ✓ Carpeta Admin copiada
) else (
    echo ✗ Carpeta Admin no encontrada
)

echo.
echo ===== COPIANDO ARCHIVOS DE BACKEND =====

echo Copiando middleware de auth...
if exist "%ORIGEN%\backend\src\middleware\auth.ts" (
    copy "%ORIGEN%\backend\src\middleware\auth.ts" "%DESTINO%\backend\src\middleware\" /Y
    echo ✓ auth.ts middleware copiado
) else (
    echo ✗ auth.ts middleware no encontrado
)

echo Copiando rutas de auth...
if exist "%ORIGEN%\backend\src\routes\auth.ts" (
    copy "%ORIGEN%\backend\src\routes\auth.ts" "%DESTINO%\backend\src\routes\" /Y
    echo ✓ auth.ts routes copiado
) else (
    echo ✗ auth.ts routes no encontrado
)

echo Copiando rutas de users...
if exist "%ORIGEN%\backend\src\routes\users.ts" (
    copy "%ORIGEN%\backend\src\routes\users.ts" "%DESTINO%\backend\src\routes\" /Y
    echo ✓ users.ts routes copiado
) else (
    echo ✗ users.ts routes no encontrado
)

echo.
echo =============================================================
echo Script completado!
echo =============================================================
echo.
echo SIGUIENTES PASOS:
echo 1. Revisar que los archivos se copiaron correctamente
echo 2. Hacer build de frontend: cd frontend && npm run build
echo 3. Si hay errores, revisar dependencias faltantes
echo 4. Si todo OK, hacer docker build y deploy
echo.
pause
