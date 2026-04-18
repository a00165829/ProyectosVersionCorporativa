@echo off
REM ========================================
REM DEPLOY PMO PORTAL - CON AZURE AD LOGIN
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

REM ── Variables Azure AD (Enterprise App) ──────────────────────────
REM Configura estos valores una vez — los toma del Enterprise App Registration
set AZURE_TENANT_ID=f3134160-5a73-4fa3-800f-2c274653fae1
set AZURE_CLIENT_ID=62489a58-204b-4522-a91e-0967dcb6a436
set VITE_API_URL=https://proyectosit.axtel.com.mx

if "%AZURE_TENANT_ID%"=="PEGAR_AQUI_TU_TENANT_ID" (
    echo ❌ Error: Debes configurar AZURE_TENANT_ID y AZURE_CLIENT_ID en este archivo
    pause
    exit /b 1
)

set COMMIT_MESSAGE=%~1
set TIMESTAMP=%date:~-4,4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

echo 📝 Commit: %COMMIT_MESSAGE%
echo 🕐 Timestamp: %TIMESTAMP%
echo 🔐 Tenant: %AZURE_TENANT_ID%
echo 🔐 Client: %AZURE_CLIENT_ID%
echo.

REM ── 1. Estado del repo ──────────────────────────
echo 🔍 1. Verificando estado del repositorio...
git status
echo.
echo ¿Continuar? (Y/N)
set /p CONFIRM=
if /i not "%CONFIRM%"=="Y" exit /b 0

REM ── 2. Commit y push ──────────────────────────
echo.
echo 📦 2. Commit y push...
git add .
git commit -m "%COMMIT_MESSAGE% - %TIMESTAMP%"
git push origin main
if %ERRORLEVEL% neq 0 ( echo ❌ Error en git push & pause & exit /b 1 )

REM ── 3. Build en Azure Container Registry con build-args ─────────
echo.
echo 🐳 3. Build en ACR con variables Azure AD inyectadas...

az acr build --registry axtelitacr ^
    --image pmo-portal:latest ^
    --image pmo-portal:%TIMESTAMP% ^
    --build-arg VITE_API_URL=%VITE_API_URL% ^
    --build-arg VITE_AZURE_TENANT_ID=%AZURE_TENANT_ID% ^
    --build-arg VITE_AZURE_CLIENT_ID=%AZURE_CLIENT_ID% ^
    .

if %ERRORLEVEL% neq 0 ( echo ❌ Error en ACR build & pause & exit /b 1 )

REM ── 4. Restart Web App ──────────────────────────
echo.
echo 🔄 4. Reiniciando Web App...
az webapp restart --name proyectosit --resource-group AXTEL_IT_RG
if %ERRORLEVEL% neq 0 ( echo ⚠️ Error al reiniciar & pause & exit /b 1 )

REM ── 5. Verificación ──────────────────────────
echo.
echo 🧪 5. Verificando...
curl -s -o nul -w "%%{http_code}" https://proyectosit.axtel.com.mx/api/health > temp_status.txt
set /p HTTP_STATUS=<temp_status.txt
del temp_status.txt

if "%HTTP_STATUS%"=="200" (
    echo ✅ /api/health responde HTTP 200
) else (
    echo ⚠️ /api/health responde: %HTTP_STATUS%
)

echo.
echo ==========================================
echo ✅ DEPLOYMENT COMPLETADO
echo ==========================================
echo URL: https://proyectosit.axtel.com.mx
echo.
echo Verifica en el browser (Ctrl+Shift+F5):
echo   1. El botón ya NO dice "Entrar como Admin (Dev)"
echo   2. Debe decir "Iniciar sesión con cuenta corporativa"
echo   3. Al darle click, redirige a login.microsoftonline.com
echo.

echo ¿Ver logs en tiempo real? (Y/N)
set /p SHOW_LOGS=
if /i "%SHOW_LOGS%"=="Y" (
    az webapp log tail --name proyectosit --resource-group AXTEL_IT_RG
)

pause
