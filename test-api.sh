#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# PMO Portal — Test automático de todos los endpoints
# Ejecutar: docker exec -i pmo-backend sh < test-api.sh
# O desde Windows: bash test-api.sh (si tienes curl disponible)
# ═══════════════════════════════════════════════════════════════════════════════

API="http://localhost:3000"
PASS=0
FAIL=0
WARN=0
ERRORS=""

# Colors (si el terminal las soporta)
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'

check() {
  local method="$1"
  local path="$2"
  local desc="$3"
  local body="$4"
  local expect_status="${5:-200}"

  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$API$path" -H "Content-Type: application/json" 2>/dev/null)
  elif [ "$method" = "POST" ]; then
    response=$(curl -s -w "\n%{http_code}" -X POST "$API$path" -H "Content-Type: application/json" -d "$body" 2>/dev/null)
  elif [ "$method" = "PUT" ]; then
    response=$(curl -s -w "\n%{http_code}" -X PUT "$API$path" -H "Content-Type: application/json" -d "$body" 2>/dev/null)
  elif [ "$method" = "DELETE" ]; then
    response=$(curl -s -w "\n%{http_code}" -X DELETE "$API$path" -H "Content-Type: application/json" -d "$body" 2>/dev/null)
  fi

  status=$(echo "$response" | tail -1)
  body_resp=$(echo "$response" | sed '$d')

  if [ "$status" = "$expect_status" ]; then
    echo -e "  ${GREEN}✓${NC} $desc ($method $path) → $status"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $desc ($method $path) → $status (esperaba $expect_status)"
    echo -e "    Response: $(echo "$body_resp" | head -c 200)"
    FAIL=$((FAIL + 1))
    ERRORS="$ERRORS\n  ✗ $desc: $method $path → $status"
  fi
}

check_json_array() {
  local path="$1"
  local desc="$2"

  response=$(curl -s "$API$path" -H "Content-Type: application/json" 2>/dev/null)
  
  if echo "$response" | head -c 1 | grep -q '\['; then
    count=$(echo "$response" | grep -o '"id"' | wc -l)
    echo -e "  ${GREEN}✓${NC} $desc → array con $count elementos"
    PASS=$((PASS + 1))
  elif echo "$response" | grep -q '"error"'; then
    error=$(echo "$response" | grep -o '"error":"[^"]*"')
    echo -e "  ${RED}✗${NC} $desc → $error"
    FAIL=$((FAIL + 1))
    ERRORS="$ERRORS\n  ✗ $desc: $error"
  else
    echo -e "  ${YELLOW}?${NC} $desc → respuesta inesperada: $(echo "$response" | head -c 100)"
    WARN=$((WARN + 1))
  fi
}

check_json_object() {
  local path="$1"
  local desc="$2"

  response=$(curl -s "$API$path" -H "Content-Type: application/json" 2>/dev/null)
  
  if echo "$response" | head -c 1 | grep -q '{'; then
    echo -e "  ${GREEN}✓${NC} $desc → objeto válido"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $desc → respuesta inesperada"
    FAIL=$((FAIL + 1))
    ERRORS="$ERRORS\n  ✗ $desc: respuesta no es objeto JSON"
  fi
}

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  PMO Portal — Test Automático de API${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# ── Health ─────────────────────────────────────────────────────────────────────
echo -e "${BOLD}▸ Health Check${NC}"
check GET "/api/health" "Health check"

# ── Auth ───────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}▸ Autenticación${NC}"
check_json_object "/api/auth/me" "GET /api/auth/me (usuario actual)"

# ── Portfolios ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}▸ Portafolios${NC}"
check_json_array "/api/portfolios" "GET /api/portfolios"

# Obtener primer portfolio_id para usar en tests
PORTFOLIO_ID=$(curl -s "$API/api/portfolios" 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "    (usando portfolio_id: $PORTFOLIO_ID)"

# ── Projects ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}▸ Proyectos${NC}"
check_json_array "/api/projects?portfolio_id=$PORTFOLIO_ID" "GET /api/projects (por portafolio)"
check_json_array "/api/projects/participants/list" "GET /api/projects/participants/list"

# Obtener primer project_id
PROJECT_ID=$(curl -s "$API/api/projects?portfolio_id=$PORTFOLIO_ID" 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "    (usando project_id: $PROJECT_ID)"

if [ -n "$PROJECT_ID" ]; then
  check_json_object "/api/projects/$PROJECT_ID" "GET /api/projects/:id (detalle)"
  check_json_array "/api/projects/$PROJECT_ID/comments" "GET /api/projects/:id/comments"
  check_json_array "/api/projects/$PROJECT_ID/status-history" "GET /api/projects/:id/status-history"
  check_json_array "/api/projects/$PROJECT_ID/files" "GET /api/projects/:id/files"
else
  echo -e "  ${YELLOW}⚠${NC} Sin proyectos para probar endpoints de detalle"
  WARN=$((WARN + 1))
fi

# ── Budget ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}▸ Presupuesto${NC}"
check_json_array "/api/budget?portfolio_id=$PORTFOLIO_ID" "GET /api/budget"

# ── Structures ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}▸ Estructuras${NC}"
check_json_array "/api/structures?portfolio_id=$PORTFOLIO_ID" "GET /api/structures"

# ── Participants ───────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}▸ Participantes${NC}"
check_json_array "/api/participants" "GET /api/participants"

# ── Activities ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}▸ Actividades${NC}"
check_json_array "/api/activities" "GET /api/activities"

# ── Resources ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}▸ Recursos (catálogo)${NC}"
check_json_array "/api/resources" "GET /api/resources"

# ── Companies ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}▸ Empresas${NC}"
check_json_array "/api/companies" "GET /api/companies"

# ── Assignments ────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}▸ Asignaciones${NC}"
check_json_array "/api/assignments?portfolio_id=$PORTFOLIO_ID" "GET /api/assignments"
check_json_array "/api/assignments/workload?portfolio_id=$PORTFOLIO_ID" "GET /api/assignments/workload"
check_json_array "/api/assignments/costs?portfolio_id=$PORTFOLIO_ID" "GET /api/assignments/costs"

# ── Users ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}▸ Usuarios${NC}"
check_json_array "/api/users" "GET /api/users"

# ── Trash ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}▸ Papelera${NC}"
check_json_object "/api/trash" "GET /api/trash"

# ── Menu Config ────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}▸ Configuración de Menús${NC}"
check_json_array "/api/menu-config" "GET /api/menu-config"

# ── CRUD Tests (Create, Update, Delete) ────────────────────────────────────────
echo ""
echo -e "${BOLD}▸ Tests CRUD — Comentarios${NC}"
if [ -n "$PROJECT_ID" ]; then
  # Create comment
  COMMENT_RESP=$(curl -s -X POST "$API/api/projects/$PROJECT_ID/comments" \
    -H "Content-Type: application/json" \
    -d '{"content":"Test automático - comentario de prueba"}' 2>/dev/null)
  COMMENT_ID=$(echo "$COMMENT_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -n "$COMMENT_ID" ]; then
    echo -e "  ${GREEN}✓${NC} POST comentario creado ($COMMENT_ID)"
    PASS=$((PASS + 1))
    # Delete it
    DEL_RESP=$(curl -s -X DELETE "$API/api/projects/$PROJECT_ID/comments/$COMMENT_ID" 2>/dev/null)
    if echo "$DEL_RESP" | grep -q '"success"'; then
      echo -e "  ${GREEN}✓${NC} DELETE comentario eliminado"
      PASS=$((PASS + 1))
    else
      echo -e "  ${RED}✗${NC} DELETE comentario falló"
      FAIL=$((FAIL + 1))
    fi
  else
    echo -e "  ${RED}✗${NC} POST comentario falló: $COMMENT_RESP"
    FAIL=$((FAIL + 1))
  fi
fi

echo ""
echo -e "${BOLD}▸ Tests CRUD — Status History${NC}"
if [ -n "$PROJECT_ID" ]; then
  STATUS_RESP=$(curl -s -X POST "$API/api/projects/$PROJECT_ID/status-history" \
    -H "Content-Type: application/json" \
    -d '{"description":"Test automático - actualización de prueba","stage":"En Desarrollo","notes":"nota test"}' 2>/dev/null)
  STATUS_ID=$(echo "$STATUS_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -n "$STATUS_ID" ]; then
    echo -e "  ${GREEN}✓${NC} POST status-history creado ($STATUS_ID)"
    PASS=$((PASS + 1))
    DEL_RESP=$(curl -s -X DELETE "$API/api/projects/$PROJECT_ID/status-history/$STATUS_ID" 2>/dev/null)
    if echo "$DEL_RESP" | grep -q '"success"'; then
      echo -e "  ${GREEN}✓${NC} DELETE status-history eliminado"
      PASS=$((PASS + 1))
    else
      echo -e "  ${RED}✗${NC} DELETE status-history falló"
      FAIL=$((FAIL + 1))
    fi
  else
    echo -e "  ${RED}✗${NC} POST status-history falló: $STATUS_RESP"
    FAIL=$((FAIL + 1))
  fi
fi

echo ""
echo -e "${BOLD}▸ Tests CRUD — Actividad${NC}"
ACT_RESP=$(curl -s -X POST "$API/api/activities" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Activity Automático"}' 2>/dev/null)
ACT_ID=$(echo "$ACT_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$ACT_ID" ]; then
  echo -e "  ${GREEN}✓${NC} POST actividad creada ($ACT_ID)"
  PASS=$((PASS + 1))
  # Update
  UPD_RESP=$(curl -s -X PUT "$API/api/activities/$ACT_ID" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Activity Updated"}' 2>/dev/null)
  if echo "$UPD_RESP" | grep -q '"Test Activity Updated"'; then
    echo -e "  ${GREEN}✓${NC} PUT actividad actualizada"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} PUT actividad falló"
    FAIL=$((FAIL + 1))
  fi
  # Delete
  DEL_RESP=$(curl -s -X DELETE "$API/api/activities/$ACT_ID" 2>/dev/null)
  if echo "$DEL_RESP" | grep -q '"success"'; then
    echo -e "  ${GREEN}✓${NC} DELETE actividad eliminada (soft)"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} DELETE actividad falló"
    FAIL=$((FAIL + 1))
  fi
else
  echo -e "  ${RED}✗${NC} POST actividad falló: $ACT_RESP"
  FAIL=$((FAIL + 1))
fi

echo ""
echo -e "${BOLD}▸ Tests CRUD — Empresa${NC}"
COMP_RESP=$(curl -s -X POST "$API/api/companies" \
  -H "Content-Type: application/json" \
  -d '{"name":"Empresa Test Automático"}' 2>/dev/null)
COMP_ID=$(echo "$COMP_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$COMP_ID" ]; then
  echo -e "  ${GREEN}✓${NC} POST empresa creada ($COMP_ID)"
  PASS=$((PASS + 1))
  DEL_RESP=$(curl -s -X DELETE "$API/api/companies/$COMP_ID" 2>/dev/null)
  if echo "$DEL_RESP" | grep -q '"success"'; then
    echo -e "  ${GREEN}✓${NC} DELETE empresa eliminada (soft)"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} DELETE empresa falló"
    FAIL=$((FAIL + 1))
  fi
else
  echo -e "  ${RED}✗${NC} POST empresa falló: $COMP_RESP"
  FAIL=$((FAIL + 1))
fi

echo ""
echo -e "${BOLD}▸ Tests — Validaciones${NC}"
# Empty content should return 400
check POST "/api/projects/$PROJECT_ID/comments" "POST comentario vacío (debe dar 400)" '{"content":""}' "400"
check POST "/api/activities" "POST actividad sin nombre (debe dar 400)" '{}' "400"
check GET "/api/projects/00000000-0000-0000-0000-000000000000" "GET proyecto inexistente (debe dar 404)" "" "404"

# ── Frontend Routes Check ──────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}▸ Frontend — Verificación de rutas${NC}"
FRONTEND="http://localhost:5173"
for route in "/" "/projects" "/completed" "/cancelled" "/project-costs" \
  "/resources/dashboard" "/resources/assignments" "/resources/reports" \
  "/resources/workload" "/resources/gantt" \
  "/budget" "/structures" \
  "/admin/users" "/admin/participants" "/admin/activities" \
  "/admin/resources" "/admin/companies" "/admin/trash" "/admin/menus"; do
  
  status=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND$route" 2>/dev/null)
  if [ "$status" = "200" ]; then
    echo -e "  ${GREEN}✓${NC} $route → $status"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $route → $status"
    FAIL=$((FAIL + 1))
    ERRORS="$ERRORS\n  ✗ Frontend $route → $status"
  fi
done

# ── Results ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  RESULTADOS${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo ""
TOTAL=$((PASS + FAIL + WARN))
echo -e "  Total tests:  $TOTAL"
echo -e "  ${GREEN}Pasaron:    $PASS${NC}"
echo -e "  ${RED}Fallaron:   $FAIL${NC}"
echo -e "  ${YELLOW}Warnings:   $WARN${NC}"
echo ""

if [ $FAIL -gt 0 ]; then
  echo -e "${RED}${BOLD}  ERRORES ENCONTRADOS:${NC}"
  echo -e "$ERRORS"
  echo ""
fi

if [ $FAIL -eq 0 ]; then
  echo -e "  ${GREEN}${BOLD}✓ Todos los tests pasaron correctamente${NC}"
else
  echo -e "  ${RED}${BOLD}✗ Hay $FAIL tests fallidos que necesitan atención${NC}"
fi
echo ""
