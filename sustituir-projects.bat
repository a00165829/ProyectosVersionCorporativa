@echo off
echo Sustituyendo projects.ts corregido (sin companies JOIN)...

REM Verificar que existe el archivo corregido
if not exist "projects-sin-companies.ts" (
    echo ❌ ERROR: No se encuentra projects-sin-companies.ts
    echo.
    echo Descarga el archivo del chat de Claude primero
    pause
    exit /b 1
)

REM Backup del archivo actual
copy "backend\src\routes\projects.ts" "projects-backup.ts"
echo 🛡️ Backup creado: projects-backup.ts

REM Sustituir archivo
copy "projects-sin-companies.ts" "backend\src\routes\projects.ts"
echo ✅ projects.ts sustituido (removido company_id JOIN)

echo.
echo Cambios realizados:
echo - Removido LEFT JOIN companies (causaba error column not exist)
echo - Removido company_id de INSERT/UPDATE
echo - Mantenido portfolio_name JOIN (funciona)
echo.
echo Próximos pasos:
echo 1. Build Docker: docker build --no-cache -t axitapppmo.azurecr.io/pmo-portal:fix-v9 .
echo 2. Push Docker: docker push axitapppmo.azurecr.io/pmo-portal:fix-v9  
echo 3. Deployment Center: cambiar tag a fix-v9 y restart
echo 4. ¡PMO Portal debería funcionar 100%%!
echo.
pause