-- Migración: campos adicionales en projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS progress          INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS classification    TEXT DEFAULT 'Proyecto' CHECK (classification IN ('Proyecto', 'Mejora')),
  ADD COLUMN IF NOT EXISTS priority          INT,
  ADD COLUMN IF NOT EXISTS responsible_id    UUID REFERENCES participants(id),
  ADD COLUMN IF NOT EXISTS scrum_stage       TEXT NOT NULL DEFAULT 'Backlog'
    CHECK (scrum_stage IN (
      'Backlog','Análisis / Diseño','Sprint Planning','En Desarrollo',
      'Code Review','QA / Pruebas','UAT','Pre-Producción','Go Live',
      'Completado','Cancelado'
    )),
  ADD COLUMN IF NOT EXISTS dev_end_date      DATE,
  ADD COLUMN IF NOT EXISTS test_start_date   DATE,
  ADD COLUMN IF NOT EXISTS test_end_date     DATE;

-- Actualizar datos de prueba con los nuevos campos
UPDATE projects SET
  progress = 34, classification = 'Proyecto', priority = 1,
  scrum_stage = 'En Desarrollo'
WHERE id = '55555555-0000-0000-0000-000000000001';

UPDATE projects SET
  progress = 43, classification = 'Proyecto', priority = 2,
  scrum_stage = 'En Desarrollo'
WHERE id = '55555555-0000-0000-0000-000000000002';

UPDATE projects SET
  progress = 0, classification = 'Mejora', priority = 3,
  scrum_stage = 'Backlog'
WHERE id = '55555555-0000-0000-0000-000000000003';

UPDATE projects SET
  progress = 100, classification = 'Proyecto', priority = NULL,
  scrum_stage = 'Completado'
WHERE id = '55555555-0000-0000-0000-000000000004';

UPDATE projects SET
  progress = 30, classification = 'Mejora', priority = 4,
  scrum_stage = 'QA / Pruebas'
WHERE id = '55555555-0000-0000-0000-000000000005';
