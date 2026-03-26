-- ─────────────────────────────────────────────────────────────────────────────
-- PMO Portal — Schema PostgreSQL
-- Sin dependencias de Supabase auth.users
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Empresas ──────────────────────────────────────────────────────────────────
CREATE TABLE companies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Usuarios (perfiles — se crean al hacer login con Azure AD) ────────────────
CREATE TABLE profiles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  azure_oid    TEXT UNIQUE,                    -- Object ID de Azure AD
  email        TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Roles ─────────────────────────────────────────────────────────────────────
CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  role    TEXT NOT NULL DEFAULT 'pending'
            CHECK (role IN ('admin','director','gerente','lider','usuario','pending'))
);

-- ── Permisos por módulo ───────────────────────────────────────────────────────
CREATE TABLE user_module_permissions (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  module  TEXT NOT NULL,
  PRIMARY KEY (user_id, module)
);

-- ── Permisos por empresa ──────────────────────────────────────────────────────
CREATE TABLE user_company_permissions (
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, company_id)
);

-- ── Invitaciones ──────────────────────────────────────────────────────────────
CREATE TABLE user_invitations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email        TEXT UNIQUE NOT NULL,
  display_name TEXT,
  invited_by   UUID REFERENCES profiles(id),
  status       TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','accepted')),
  resent_at    TIMESTAMPTZ,
  resend_count INT DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Portafolios ───────────────────────────────────────────────────────────────
CREATE TABLE portfolios (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  company_id UUID REFERENCES companies(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_portfolio_permissions (
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, portfolio_id)
);

-- ── Estructuras presupuestales ────────────────────────────────────────────────
CREATE TABLE structures (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  total_budget  NUMERIC(15,2) DEFAULT 0,
  portfolio_id  UUID REFERENCES portfolios(id),
  created_by    UUID REFERENCES profiles(id),
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Proyectos ─────────────────────────────────────────────────────────────────
CREATE TABLE projects (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 TEXT NOT NULL,
  portfolio_id         UUID REFERENCES portfolios(id),
  structure_id         UUID REFERENCES structures(id),
  classification       TEXT DEFAULT 'Proyecto' CHECK (classification IN ('Proyecto','Mejora')),
  priority             INTEGER,
  progress             INTEGER NOT NULL DEFAULT 0,
  stage                TEXT NOT NULL DEFAULT 'Backlog'
                         CHECK (stage IN ('Backlog','Análisis / Diseño','Sprint Planning','En Desarrollo',
                                          'Code Review','QA / Pruebas','UAT','Pre-Producción','Go Live',
                                          'Completado','Cancelado','En Pausa','Por Iniciar')),
  scrum_stage          TEXT NOT NULL DEFAULT 'Backlog'
                         CHECK (scrum_stage IN ('Backlog','Análisis / Diseño','Sprint Planning','En Desarrollo',
                                                'Code Review','QA / Pruebas','UAT','Pre-Producción','Go Live',
                                                'Completado','Cancelado','En Pausa','Por Iniciar')),
  responsible_id       UUID,
  description          TEXT DEFAULT '',
  dev_start_date       DATE,
  dev_end_date         DATE,
  test_start_date      DATE,
  test_end_date        DATE,
  go_live_date         DATE,
  planned_go_live_date DATE,
  project_start_date   DATE,
  created_by           UUID REFERENCES profiles(id),
  deleted_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Comentarios de proyecto ───────────────────────────────────────────────────
CREATE TABLE project_comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id),
  content    TEXT NOT NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Archivos de proyecto ──────────────────────────────────────────────────────
CREATE TABLE project_files (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  s3_key     TEXT NOT NULL,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Imágenes de proyecto ──────────────────────────────────────────────────────
CREATE TABLE project_images (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  s3_key     TEXT NOT NULL,
  caption    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Presupuesto ───────────────────────────────────────────────────────────────
CREATE TABLE project_budgets (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id         UUID UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  structure_id       UUID REFERENCES structures(id),
  authorized_amount  NUMERIC(15,2),
  spent_amount       NUMERIC(15,2) DEFAULT 0,
  authorization_date DATE,
  comments           TEXT DEFAULT '',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE budget_files (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id  UUID REFERENCES project_budgets(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  s3_key     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Participantes ─────────────────────────────────────────────────────────────
CREATE TABLE participants (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  email      TEXT,
  company_id UUID REFERENCES companies(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Actividades ───────────────────────────────────────────────────────────────
CREATE TABLE activities (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Habilidades ───────────────────────────────────────────────────────────────
CREATE TABLE skills (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE participant_skills (
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  skill_id       UUID REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (participant_id, skill_id)
);

-- ── Recursos ──────────────────────────────────────────────────────────────────
CREATE TABLE resources (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  cost_usd   NUMERIC(10,2) DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE resource_skills (
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  skill_id    UUID REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, skill_id)
);

-- ── Asignaciones de recursos ──────────────────────────────────────────────────
CREATE TABLE resource_assignments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id        UUID REFERENCES participants(id),
  project_id            UUID REFERENCES projects(id),
  activity_id           UUID REFERENCES activities(id),
  portfolio_id          UUID REFERENCES portfolios(id),
  resource_id           UUID REFERENCES resources(id),
  start_date            DATE NOT NULL,
  end_date              DATE NOT NULL,
  allocation_percentage INT NOT NULL CHECK (allocation_percentage BETWEEN 1 AND 100),
  leader_name           TEXT,
  has_overlap           BOOLEAN DEFAULT false,
  deleted_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Función: validar solapamiento de asignaciones ─────────────────────────────
CREATE OR REPLACE FUNCTION validate_resource_allocation(
  _resource_id UUID, _start_date DATE, _end_date DATE,
  _allocation_percentage INT, _exclude_assignment_id UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  total_allocated INT;
  result JSON;
BEGIN
  SELECT COALESCE(SUM(allocation_percentage), 0) INTO total_allocated
  FROM resource_assignments
  WHERE participant_id = _resource_id
    AND deleted_at IS NULL
    AND (_exclude_assignment_id IS NULL OR id != _exclude_assignment_id)
    AND daterange(start_date, end_date, '[]') && daterange(_start_date, _end_date, '[]');

  IF (total_allocated + _allocation_percentage) > 100 THEN
    result := json_build_object(
      'valid', false,
      'error', format('Solapamiento: %s%% ya asignado en ese período', total_allocated),
      'current_allocation', total_allocated
    );
  ELSE
    result := json_build_object('valid', true, 'current_allocation', total_allocated);
  END IF;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ── Trigger: updated_at automático ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Campos adicionales en projects (clasificación, avance, etapa scrum)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS progress        INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS classification  TEXT DEFAULT 'Proyecto' CHECK (classification IN ('Proyecto','Mejora')),
  ADD COLUMN IF NOT EXISTS priority        INT,
  ADD COLUMN IF NOT EXISTS responsible_id  UUID REFERENCES participants(id),
  ADD COLUMN IF NOT EXISTS scrum_stage     TEXT NOT NULL DEFAULT 'Backlog'
    CHECK (scrum_stage IN ('Backlog','Análisis / Diseño','Sprint Planning','En Desarrollo',
      'Code Review','QA / Pruebas','UAT','Pre-Producción','Go Live','Completado','Cancelado')),
  ADD COLUMN IF NOT EXISTS dev_end_date    DATE,
  ADD COLUMN IF NOT EXISTS test_start_date DATE,
  ADD COLUMN IF NOT EXISTS test_end_date   DATE;

-- ── Historial de estatus de proyectos ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_status_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES profiles(id),
  description TEXT NOT NULL,
  stage       TEXT,
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agregar updated_at a structures si no existe
ALTER TABLE structures ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Agregar deleted_at a project_budgets si no existe  
ALTER TABLE project_budgets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Campos adicionales de presupuesto (estatus, tipo, centro de costos)
ALTER TABLE project_budgets ADD COLUMN IF NOT EXISTS budget_status TEXT NOT NULL DEFAULT 'Pendiente de autorizar'
  CHECK (budget_status IN ('Pendiente de autorizar','Autorizado'));
ALTER TABLE project_budgets ADD COLUMN IF NOT EXISTS budget_type TEXT NOT NULL DEFAULT 'CAPEX'
  CHECK (budget_type IN ('CAPEX','OPEX'));
ALTER TABLE project_budgets ADD COLUMN IF NOT EXISTS cost_center TEXT DEFAULT 'Pendiente';
