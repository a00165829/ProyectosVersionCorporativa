@echo off
echo ========================================
echo  PMO Portal - Deploy a produccion
echo ========================================
echo.

if "%~1"=="" (
    echo ERROR: Falta el mensaje de commit
    echo Uso: deploy.bat "descripcion del cambio"
    echo Ejemplo: deploy.bat "feat: nuevo catalogo de solicitantes"
    pause
    exit /b 1
)

echo [1/5] Commit a GitHub...
git add .
git commit -m "%~1"
git push --force origin main
if errorlevel 1 (
    echo ERROR en Git push. Verifica tu conexion.
    pause
    exit /b 1
)

echo.
echo [2/5] Docker build...
docker build --no-cache --build-arg VITE_AZURE_TENANT_ID=f3134160-5a73-4fa3-800f-2c274653fae1 --build-arg VITE_AZURE_CLIENT_ID=62489a58-204b-4522-a91e-0967dcb6a436 --build-arg VITE_API_URL="" -t axitapppmo.azurecr.io/pmo-portal:latest .
if errorlevel 1 (
    echo ERROR en Docker build. Revisa los errores arriba.
    pause
    exit /b 1
)

echo.
echo [3/5] Docker push a Azure Container Registry...
docker push axitapppmo.azurecr.io/pmo-portal:latest
if errorlevel 1 (
    echo ERROR en Docker push. Verifica login: az acr login --name axitapppmo
    pause
    exit /b 1
)

echo.
echo [4/5] Reiniciando Web App en Azure...
az webapp restart --name pmo-app-prod --resource-group pmo-portal-rg
if errorlevel 1 (
    echo AVISO: No se pudo reiniciar automaticamente.
    echo Reinicia manualmente desde Azure Portal.
    echo O instala Azure CLI: winget install Microsoft.AzureCLI
)

echo.
echo [5/5] Listo!
echo ========================================
echo  Deploy completado exitosamente
echo  Commit: %~1
echo  Imagen: axitapppmo.azurecr.io/pmo-portal:latest
echo  Web App: pmo-app-prod
echo ========================================
echo.
echo Espera 1-2 minutos y abre:
echo https://proyectosit.axtel.com.mx
echo.
pause
