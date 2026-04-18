# ── Stage 1: Build frontend ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
# Las variables de Vite se inyectan en build time
ARG VITE_API_URL
ARG VITE_AZURE_CLIENT_ID
ARG VITE_AZURE_TENANT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AZURE_CLIENT_ID=$VITE_AZURE_CLIENT_ID
ENV VITE_AZURE_TENANT_ID=$VITE_AZURE_TENANT_ID
RUN npm run build

# ── Stage 2: Runtime con ts-node (sin compilar backend) ──────────────────────────
FROM node:20-alpine
WORKDIR /app

# Copiar package.json del backend
COPY backend/package*.json ./
RUN npm ci --production

# Instalar ts-node y TypeScript para runtime
RUN npm install ts-node typescript @types/node --save

# Copiar código fuente del backend SIN COMPILAR
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Copiar frontend buildado a /app/public (donde el backend lo busca)
COPY --from=frontend-builder /frontend/dist ./public

# Crear directorios necesarios
RUN mkdir -p logs temp

# Puerto
EXPOSE 8080

# Ejecutar con ts-node directamente (sin compilar)
CMD ["npx", "ts-node", "--transpile-only", "src/index.ts"]
