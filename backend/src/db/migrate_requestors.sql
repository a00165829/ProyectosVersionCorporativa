-- Ejecutar en DBeaver contra la BD de Azure
CREATE TABLE IF NOT EXISTS requestors (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  email      TEXT,
  company_id UUID REFERENCES companies(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS requestor_id UUID REFERENCES requestors(id);
