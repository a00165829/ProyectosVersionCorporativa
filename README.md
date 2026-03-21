# PMO Portal

Stack: React 18 + TypeScript · Node.js/Express · PostgreSQL · Docker · Azure AD · AWS

---

## Levantar en local (desarrollo)

### Requisitos
- Docker Desktop corriendo
- Node.js 20 LTS

### 1. Copiar variables de entorno
```bash
cp .env.example .env
```
El archivo `.env` ya viene listo para desarrollo local. No necesitas cambiar nada todavía.

### 2. Levantar todo con Docker
```bash
docker compose up --build
```

Esto levanta automáticamente:
- **PostgreSQL** en puerto 5432 (con schema + datos de prueba ya cargados)
- **Backend API** en http://localhost:3000
- **Frontend** en http://localhost:5173

### 3. Abrir la app
Ve a **http://localhost:5173**

En modo desarrollo (sin Azure AD configurado) entras automáticamente como administrador.

---

## Estructura del proyecto

```
pmo-portal/
├── frontend/          # React + TypeScript + Vite
│   └── src/
│       ├── pages/     # Páginas de la app
│       ├── context/   # AuthContext (Azure AD)
│       ├── lib/       # api.ts, msal.ts, utils.ts
│       └── components/
├── backend/           # Node.js + Express + TypeScript
│   └── src/
│       ├── routes/    # API endpoints
│       ├── middleware/ # Auth JWT Azure AD
│       └── db/        # schema.sql, seed.sql, pool.ts
├── nginx/             # Config para producción
├── docker-compose.yml          # Local
├── docker-compose.prod.yml     # Producción (EC2)
└── .env                        # Variables locales
```

---

## Comandos útiles

```bash
# Ver logs en tiempo real
docker compose logs -f

# Solo el backend
docker compose logs -f backend

# Reiniciar un servicio
docker compose restart backend

# Parar todo
docker compose down

# Parar y borrar la BD (reset completo)
docker compose down -v

# Reconstruir después de cambios en package.json
docker compose up --build
```

---

## Conectar Azure AD (cuando IT lo tenga listo)

Edita `.env` con los datos que te dé el admin de Azure:

```env
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

También actualiza en `frontend/`:
```env
VITE_AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Luego reconstruye:
```bash
docker compose up --build
```

---

## Health check del backend

```
GET http://localhost:3000/api/health
```

Respuesta esperada:
```json
{ "status": "ok", "db": "connected" }
```

---

## Despliegue en producción (EC2)

```bash
# En el servidor EC2
docker compose -f docker-compose.prod.yml up -d
```

Requiere las variables de entorno de producción configuradas (RDS, Azure AD real, S3).
