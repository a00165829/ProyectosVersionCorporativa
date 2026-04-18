@echo off
echo =============================================================
echo Comprimiendo archivos que necesitan corrección
echo =============================================================

cd /d C:\proyectos\pmo-portal

echo Creando carpeta temporal...
mkdir temp_files_to_fix 2>nul

echo Copiando archivos problemáticos...

echo ✓ Copiando api.ts...
copy "frontend\src\lib\api.ts" "temp_files_to_fix\api.ts" /Y

echo ✓ Copiando tsconfig.json...
copy "frontend\tsconfig.json" "temp_files_to_fix\tsconfig.json" /Y

echo ✓ Copiando AuthContext.tsx...
copy "frontend\src\context\AuthContext.tsx" "temp_files_to_fix\AuthContext.tsx" /Y

echo ✓ Copiando ProjectFormDialog.tsx (si existe)...
copy "frontend\src\components\ProjectFormDialog.tsx" "temp_files_to_fix\ProjectFormDialog.tsx" /Y 2>nul

echo ✓ Copiando Login.tsx...
copy "frontend\src\pages\Login.tsx" "temp_files_to_fix\Login.tsx" /Y

echo ✓ Copiando App.tsx...
copy "frontend\src\App.tsx" "temp_files_to_fix\App.tsx" /Y

echo ✓ Copiando main.tsx...
copy "frontend\src\main.tsx" "temp_files_to_fix\main.tsx" /Y

echo ✓ Copiando package.json del frontend...
copy "frontend\package.json" "temp_files_to_fix\package.json" /Y

echo.
echo Comprimiendo archivos...
powershell Compress-Archive -Path "temp_files_to_fix\*" -DestinationPath "archivos-para-corregir.zip" -Force

echo Limpiando archivos temporales...
rmdir /S /Q temp_files_to_fix

echo =============================================================
echo ¡ZIP CREADO! 
echo Archivo: archivos-para-corregir.zip
echo =============================================================
echo.
echo CONTENIDO DEL ZIP:
echo - api.ts (fix export)
echo - tsconfig.json (más permisivo)  
echo - AuthContext.tsx (fix imports)
echo - ProjectFormDialog.tsx (fix UI components)
echo - Login.tsx (fix funcionalidad)
echo - App.tsx (fix routing)
echo - main.tsx (fix providers)
echo - package.json (dependencias)
echo.
echo Sube este ZIP y te doy los archivos corregidos!
echo.
pause
