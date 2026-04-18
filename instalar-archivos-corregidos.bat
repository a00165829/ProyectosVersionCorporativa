@echo off
echo =============================================================
echo Instalando archivos corregidos en el proyecto
echo =============================================================

cd /d C:\proyectos\pmo-portal

echo Verificando que existe el ZIP de archivos corregidos...
if not exist "archivos-corregidos.zip" (
    echo ✗ ERROR: No se encuentra archivos-corregidos.zip
    echo    Descarga el ZIP de archivos corregidos primero
    pause
    exit /b 1
)

echo ✓ ZIP encontrado: archivos-corregidos.zip

echo.
echo Creando backup de archivos actuales...
mkdir backup_antes_correccion_%date:~-4,4%_%date:~-7,2%_%date:~-10,2% 2>nul
copy "frontend\src\lib\api.ts" "backup_antes_correccion_%date:~-4,4%_%date:~-7,2%_%date:~-10,2%\" 2>nul
copy "frontend\tsconfig.json" "backup_antes_correccion_%date:~-4,4%_%date:~-7,2%_%date:~-10,2%\" 2>nul
copy "frontend\src\context\AuthContext.tsx" "backup_antes_correccion_%date:~-4,4%_%date:~-7,2%_%date:~-10,2%\" 2>nul
echo ✓ Backup creado

echo.
echo Extrayendo archivos corregidos...
powershell Expand-Archive -Path "archivos-corregidos.zip" -DestinationPath "archivos_corregidos_temp" -Force

echo.
echo Instalando archivos corregidos...

if exist "archivos_corregidos_temp\api.ts" (
    copy "archivos_corregidos_temp\api.ts" "frontend\src\lib\api.ts" /Y
    echo ✓ api.ts instalado
)

if exist "archivos_corregidos_temp\tsconfig.json" (
    copy "archivos_corregidos_temp\tsconfig.json" "frontend\tsconfig.json" /Y
    echo ✓ tsconfig.json instalado
)

if exist "archivos_corregidos_temp\AuthContext.tsx" (
    copy "archivos_corregidos_temp\AuthContext.tsx" "frontend\src\context\AuthContext.tsx" /Y
    echo ✓ AuthContext.tsx instalado
)

if exist "archivos_corregidos_temp\ProjectFormDialog.tsx" (
    copy "archivos_corregidos_temp\ProjectFormDialog.tsx" "frontend\src\components\ProjectFormDialog.tsx" /Y
    echo ✓ ProjectFormDialog.tsx instalado
)

if exist "archivos_corregidos_temp\Login.tsx" (
    copy "archivos_corregidos_temp\Login.tsx" "frontend\src\pages\Login.tsx" /Y
    echo ✓ Login.tsx instalado
)

if exist "archivos_corregidos_temp\App.tsx" (
    copy "archivos_corregidos_temp\App.tsx" "frontend\src\App.tsx" /Y
    echo ✓ App.tsx instalado
)

if exist "archivos_corregidos_temp\main.tsx" (
    copy "archivos_corregidos_temp\main.tsx" "frontend\src\main.tsx" /Y
    echo ✓ main.tsx instalado
)

if exist "archivos_corregidos_temp\package.json" (
    copy "archivos_corregidos_temp\package.json" "frontend\package.json" /Y
    echo ✓ package.json instalado
)

echo.
echo Limpiando archivos temporales...
rmdir /S /Q archivos_corregidos_temp

echo.
echo =============================================================
echo ¡ARCHIVOS CORREGIDOS INSTALADOS!
echo =============================================================
echo.
echo SIGUIENTES PASOS:
echo 1. cd frontend
echo 2. npm install (por si hay nuevas dependencias)
echo 3. npm run build
echo 4. cd .. && docker build -t axitapppmo.azurecr.io/pmo-portal:latest .
echo 5. docker push axitapppmo.azurecr.io/pmo-portal:latest
echo 6. Restart en Azure
echo.
echo Si hay problemas, los archivos originales están en:
echo backup_antes_correccion_%date:~-4,4%_%date:~-7,2%_%date:~-10,2%\
echo.
pause
