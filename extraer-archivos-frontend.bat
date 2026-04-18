@echo off
REM Script para extraer archivos del frontend para revisión
echo Creando ZIP con archivos del frontend...

REM Crear directorio temporal
if not exist "frontend-files-temp" mkdir "frontend-files-temp"

REM Copiar archivos críticos del frontend
copy "frontend\src\lib\api.ts" "frontend-files-temp\api.ts"
copy "frontend\src\context\AuthContext.tsx" "frontend-files-temp\AuthContext.tsx"
copy "frontend\src\pages\Login.tsx" "frontend-files-temp\Login.tsx"
copy "frontend\src\components\layout\Header.tsx" "frontend-files-temp\Header.tsx" 2>nul
copy "frontend\src\hooks\useAuth.ts" "frontend-files-temp\useAuth.ts" 2>nul

REM Crear ZIP
powershell "Compress-Archive -Path 'frontend-files-temp\*' -DestinationPath 'frontend-auth-files.zip' -Force"

REM Limpiar directorio temporal
rmdir /s /q "frontend-files-temp"

echo.
echo ✅ ZIP creado: frontend-auth-files.zip
echo.
echo Archivos incluidos:
echo - api.ts (manejo de requests)
echo - AuthContext.tsx (contexto de autenticación)
echo - Login.tsx (componente de login)
echo - Header.tsx (si existe)
echo - useAuth.ts (si existe)
echo.
pause