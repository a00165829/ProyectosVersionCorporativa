# ═══════════════════════════════════════════════════════════════════════════════
# PMO Portal — Dockerfile único para Azure Web App (Linux)
# Backend (Node.js) + Frontend (React static) en un solo contenedor
# ═══════════════════════════════════════════════════════════════════════════════

# ── Stage 1: Build frontend ──────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
# Las variables de Vite se inyectan en build time
ARG VITE_API_URL=/api
ARG VITE_AZURE_TENANT_ID=placeholder
ARG VITE_AZURE_CLIENT_ID=placeholder
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AZURE_TENANT_ID=$VITE_AZURE_TENANT_ID
ENV VITE_AZURE_CLIENT_ID=$VITE_AZURE_CLIENT_ID
RUN npm run build

# ── Stage 2: Build backend ───────────────────────────────────────────────────
FROM node:20-alpine AS backend-builder
WORKDIR /backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build

# ── Stage 3: Production runtime ──────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Install production dependencies only
COPY backend/package*.json ./
RUN npm ci --production

# Copy compiled backend
COPY --from=backend-builder /backend/dist ./dist

# Copy SQL schemas (for migrations)
COPY backend/src/db ./src/db

# Copy built frontend to serve as static files
COPY --from=frontend-builder /frontend/dist ./public

# Azure Web App uses port 8080 by default, but we allow override
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Health check for Azure
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/api/health || exit 1

CMD ["node", "dist/index.js"]
