-- Migración: agregar campos faltantes a project_budgets
ALTER TABLE project_budgets ADD COLUMN IF NOT EXISTS budget_status TEXT DEFAULT 'Pendiente de autorizar';
ALTER TABLE project_budgets ADD COLUMN IF NOT EXISTS budget_type TEXT DEFAULT 'CAPEX';
ALTER TABLE project_budgets ADD COLUMN IF NOT EXISTS cost_center TEXT DEFAULT 'Pendiente';
ALTER TABLE project_budgets ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- Migración: agregar created_by a resource_assignments para filtro por lider
ALTER TABLE resource_assignments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- ── Permisos por portafolio ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_portfolio_permissions (
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, portfolio_id)
);

-- Migración: agregar resource_id a resource_assignments para cálculo de costos
ALTER TABLE resource_assignments ADD COLUMN IF NOT EXISTS resource_id UUID REFERENCES resources(id);

-- ── Configuración de menús ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_config (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id   UUID REFERENCES menu_config(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  module_id   TEXT NOT NULL,
  href        TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT 'FolderKanban',
  sort_order  INT NOT NULL DEFAULT 0,
  section     TEXT NOT NULL DEFAULT 'proyectos',
  visible     BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
