@echo off
echo Sustituyendo middleware auth.ts corregido...

REM Verificar que existe el archivo corregido
if not exist "middleware-auth-corregido.ts" (
    echo ❌ ERROR: No se encuentra middleware-auth-corregido.ts
    echo.
    echo Descarga el archivo del chat de Claude primero
    pause
    exit /b 1
)

REM Backup del archivo actual
copy "backend\src\middleware\auth.ts" "auth-backup.ts"
echo 🛡️ Backup creado: auth-backup.ts

REM Sustituir archivo
copy "middleware-auth-corregido.ts" "backend\src\middleware\auth.ts"
echo ✅ Middleware auth.ts sustituido

echo.
echo Próximos pasos:
echo 1. Build Docker: docker build --no-cache -t axitapppmo.azurecr.io/pmo-portal:fix-v7 .
echo 2. Push Docker: docker push axitapppmo.azurecr.io/pmo-portal:fix-v7
echo 3. Deployment Center: cambiar tag a fix-v7 y restart
echo 4. Probar login: debería funcionar sin errores 401
echo.
pause