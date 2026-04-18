@echo off
REM Script para sustituir archivos del frontend corregidos
echo Sustituyendo archivos del frontend...

REM Verificar que existe el ZIP con archivos corregidos
if not exist "frontend-auth-files-corregidos.zip" (
    echo ❌ ERROR: No se encuentra frontend-auth-files-corregidos.zip
    echo.
    echo Asegúrate de que el ZIP con archivos corregidos esté en esta carpeta
    echo con el nombre exacto: frontend-auth-files-corregidos.zip
    pause
    exit /b 1
)

REM Crear directorio temporal para extraer
if not exist "frontend-corregidos-temp" mkdir "frontend-corregidos-temp"

REM Extraer ZIP con archivos corregidos
powershell "Expand-Archive -Path 'frontend-auth-files-corregidos.zip' -DestinationPath 'frontend-corregidos-temp' -Force"

echo Sustituyendo archivos...

REM Sustituir archivos del frontend
if exist "frontend-corregidos-temp\api.ts" (
    copy "frontend-corregidos-temp\api.ts" "frontend\src\lib\api.ts"
    echo ✅ api.ts sustituido
)

if exist "frontend-corregidos-temp\AuthContext.tsx" (
    copy "frontend-corregidos-temp\AuthContext.tsx" "frontend\src\context\AuthContext.tsx"
    echo ✅ AuthContext.tsx sustituido
)

if exist "frontend-corregidos-temp\Login.tsx" (
    copy "frontend-corregidos-temp\Login.tsx" "frontend\src\pages\Login.tsx"
    echo ✅ Login.tsx sustituido
)

if exist "frontend-corregidos-temp\Header.tsx" (
    copy "frontend-corregidos-temp\Header.tsx" "frontend\src\components\layout\Header.tsx"
    echo ✅ Header.tsx sustituido
)

if exist "frontend-corregidos-temp\useAuth.ts" (
    copy "frontend-corregidos-temp\useAuth.ts" "frontend\src\hooks\useAuth.ts"
    echo ✅ useAuth.ts sustituido
)

REM Limpiar directorio temporal
rmdir /s /q "frontend-corregidos-temp"

echo.
echo ✅ Archivos del frontend sustituidos exitosamente
echo.
echo Próximos pasos:
echo 1. Compilar frontend: cd frontend && npm run build && cd ..
echo 2. Build Docker: docker build --no-cache -t axitapppmo.azurecr.io/pmo-portal:fix-v6 .
echo 3. Push Docker: docker push axitapppmo.azurecr.io/pmo-portal:fix-v6
echo 4. Deployment Center: cambiar tag a fix-v6 y restart
echo.
pause