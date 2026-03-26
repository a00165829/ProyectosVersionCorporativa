# PMO Portal — Guía de Despliegue en Azure

## Arquitectura

Todo en Microsoft Azure:
- **Azure Web App** — contenedor Docker (Node.js + React, puerto 8080)
- **Azure Database for PostgreSQL** — Flexible Server
- **Microsoft Enterprise Application** — SSO + grupos de seguridad para roles
- **Azure Container Registry** — almacén de imágenes Docker

## Variables de entorno en Azure Web App

Configurar en Portal → Web App → Configuration → Application Settings:

| Variable | Valor | Origen |
|----------|-------|--------|
| DATABASE_URL | postgresql://user:pass@server.postgres.database.azure.com:5432/pmo_portal?sslmode=require | DBA |
| AZURE_TENANT_ID | (Directory/Tenant ID) | Identidad |
| AZURE_CLIENT_ID | (Application/Client ID de la Enterprise App) | Identidad |
| JWT_SECRET | (openssl rand -hex 32) | Generar |
| NODE_ENV | production | Fijo |
| PORT | 8080 | Fijo |
| WEBSITES_PORT | 8080 | Fijo |
| FRONTEND_URL | https://pmo.tudominio.com | DNS |
| GROUP_ID_ADMINS | (Object ID del grupo PMO-Admins) | Identidad |
| GROUP_ID_DIRECTORES | (Object ID del grupo PMO-Directores) | Identidad |
| GROUP_ID_GERENTES | (Object ID del grupo PMO-Gerentes) | Identidad |
| GROUP_ID_LIDERES | (Object ID del grupo PMO-Lideres) | Identidad |
| GROUP_ID_USUARIOS | (Object ID del grupo PMO-Usuarios) | Identidad |

## Paso 1: Construir imagen

```bash
docker build \
  --build-arg VITE_API_URL=/api \
  --build-arg VITE_AZURE_TENANT_ID=tu-tenant-id \
  --build-arg VITE_AZURE_CLIENT_ID=tu-client-id \
  -t pmo-portal:latest .
```

## Paso 2: Probar localmente

```bash
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://pmo_user:pmo_password_local@host.docker.internal:5432/pmo_portal" \
  -e AZURE_TENANT_ID=placeholder \
  -e AZURE_CLIENT_ID=placeholder \
  -e JWT_SECRET=test123 \
  -e NODE_ENV=production \
  pmo-portal:latest
```

## Paso 3: Subir a ACR

```bash
az acr login --name turegistro
docker tag pmo-portal:latest turegistro.azurecr.io/pmo-portal:latest
docker push turegistro.azurecr.io/pmo-portal:latest
```

## Paso 4: Inicializar BD

```bash
psql "postgresql://user:pass@server.postgres.database.azure.com:5432/pmo_portal?sslmode=require"
\i backend/src/db/schema.sql
\i backend/src/db/seed.sql
\i backend/src/db/migrate_budget.sql
```

## Paso 5: Configurar variables en Web App

Todas las variables de la tabla de arriba en Application Settings.

## Verificación

1. `https://tu-app/api/health` → `{"status":"ok","db":"connected"}`
2. `https://tu-app/` → Pantalla de login con SSO corporativo
3. Login → Rol asignado según grupo de Enterprise App
