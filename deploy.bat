@echo off
REM ========================================
REM DEPLOY PMO PORTAL - CON FIX DE FECHAS
REM Automatiza el proceso completo de deployment
REM ========================================

echo ==========================================
echo 🚀 INICIANDO DEPLOYMENT PMO PORTAL
echo ==========================================

if "%~1"=="" (
    echo ❌ Error: Debe proporcionar un mensaje de commit
    echo Uso: deploy.bat "mensaje del commit"
    pause
    exit /b 1
)

set COMMIT_MESSAGE=%~1
set TIMESTAMP=%date:~-4,4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

echo 📝 Commit message: %COMMIT_MESSAGE%
echo 🕐 Timestamp: %TIMESTAMP%
echo.

REM ========================================
REM 1. VERIFICAR ESTADO DEL REPOSITORIO
REM ========================================

echo 🔍 1. Verificando estado del repositorio...
git status

echo.
echo ¿Continuar con el deployment? (Y/N)
set /p CONFIRM=
if /i not "%CONFIRM%"=="Y" (
    echo ❌ Deployment cancelado
    pause
    exit /b 0
)

REM ========================================
REM 2. COMMIT Y PUSH
REM ========================================

echo.
echo 📦 2. Haciendo commit y push...
git add .
git commit -m "%COMMIT_MESSAGE% - %TIMESTAMP%"

if %ERRORLEVEL% neq 0 (
    echo ❌ Error en git commit
    pause
    exit /b 1
)

git push origin main

if %ERRORLEVEL% neq 0 (
    echo ❌ Error en git push
    pause
    exit /b 1
)

echo ✅ Código subido a GitHub exitosamente

REM ========================================
REM 3. AZURE CONTAINER REGISTRY BUILD
REM ========================================

echo.
echo 🐳 3. Iniciando build en Azure Container Registry...

az acr build --registry axtelitacr --image pmo-portal:latest --image pmo-portal:%TIMESTAMP% .

if %ERRORLEVEL% neq 0 (
    echo ❌ Error en Azure Container Registry build
    pause
    exit /b 1
)

echo ✅ Imagen Docker creada exitosamente

REM ========================================
REM 4. RESTART AZURE WEB APP
REM ========================================

echo.
echo 🔄 4. Reiniciando Azure Web App...

az webapp restart --name proyectosit --resource-group AXTEL_IT_RG

if %ERRORLEVEL% neq 0 (
    echo ❌ Error al reiniciar Web App
    echo ℹ️  La aplicación puede seguir funcionando con la imagen anterior
    pause
    exit /b 1
)

echo ✅ Web App reiniciada exitosamente

REM ========================================
REM 5. VERIFICACIÓN DE DEPLOYMENT
REM ========================================

echo.
echo 🧪 5. Verificando deployment...
echo.
echo 🌐 URL: https://proyectosit.axtel.com.mx
echo.
echo Verificaciones automáticas:
echo - ✅ Código commitado y subido a GitHub
echo - ✅ Imagen Docker buildeada en Azure Container Registry  
echo - ✅ Azure Web App reiniciada
echo.

REM Verificar que el sitio responda
echo 🔍 Probando conectividad...
curl -s -o nul -w "%%{http_code}" https://proyectosit.axtel.com.mx > temp_status.txt
set /p HTTP_STATUS=<temp_status.txt
del temp_status.txt

if "%HTTP_STATUS%"=="200" (
    echo ✅ Sitio web respondiendo correctamente (HTTP %HTTP_STATUS%^)
) else (
    echo ⚠️  Sitio web respondiendo con código: %HTTP_STATUS%
    echo ℹ️  Puede tomar unos minutos en cargar completamente
)

REM ========================================
REM 6. RESUMEN Y SIGUIENTES PASOS
REM ========================================

echo.
echo ==========================================
echo ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE
echo ==========================================
echo.
echo 📊 Resumen:
echo   • Commit: %COMMIT_MESSAGE%
echo   • Timestamp: %TIMESTAMP%
echo   • Imagen Docker: axtelitacr.azurecr.io/pmo-portal:latest
echo   • URL: https://proyectosit.axtel.com.mx
echo.
echo 📋 Siguientes pasos:
echo   1. Verificar que la aplicación funcione correctamente
echo   2. Probar las fechas en modo edición y lectura
echo   3. Confirmar que no se requiere Shift+F5 para ver cambios
echo   4. Validar que las fechas sean consistentes entre modos
echo.
echo 🔧 En caso de problemas:
echo   • Revisar logs: az webapp log tail --name proyectosit --resource-group AXTEL_IT_RG
echo   • Verificar variables de entorno en Azure Portal
echo   • Comprobar que VITE_API_URL esté configurada correctamente
echo.

REM ========================================
REM 7. LOGS OPCIONALES
REM ========================================

echo ¿Desea ver los logs en tiempo real? (Y/N)
set /p SHOW_LOGS=
if /i "%SHOW_LOGS%"=="Y" (
    echo.
    echo 📋 Mostrando logs en tiempo real (Ctrl+C para salir)...
    az webapp log tail --name proyectosit --resource-group AXTEL_IT_RG
)

echo.
echo 🎉 ¡Deployment completado!
pause