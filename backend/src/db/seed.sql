-- ─────────────────────────────────────────────────────────────────────────────
-- PMO Portal — Datos de prueba (solo desarrollo local)
-- ─────────────────────────────────────────────────────────────────────────────

-- Empresa
INSERT INTO companies (id, name) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Mi Empresa S.A. de C.V.');

-- Usuario admin de desarrollo (se crea automáticamente en modo DEV)
INSERT INTO profiles (id, azure_oid, email, display_name) VALUES
  ('22222222-0000-0000-0000-000000000001', 'dev-oid-001', 'admin@empresa.com', 'Administrador (Dev)');

INSERT INTO user_roles (user_id, role) VALUES
  ('22222222-0000-0000-0000-000000000001', 'admin');

INSERT INTO user_company_permissions (user_id, company_id) VALUES
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001');

INSERT INTO user_module_permissions (user_id, module) VALUES
  ('22222222-0000-0000-0000-000000000001', 'budget'),
  ('22222222-0000-0000-0000-000000000001', 'resources'),
  ('22222222-0000-0000-0000-000000000001', 'reports');

-- Portafolio
INSERT INTO portfolios (id, name, company_id) VALUES
  ('33333333-0000-0000-0000-000000000001', 'Portafolio 2026', '11111111-0000-0000-0000-000000000001');

INSERT INTO user_portfolio_permissions (user_id, portfolio_id) VALUES
  ('22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001');

-- Estructura presupuestal
INSERT INTO structures (id, name, total_budget, portfolio_id, created_by) VALUES
  ('44444444-0000-0000-0000-000000000001', 'Presupuesto TI 2026', 5000000.00,
   '33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001');

-- Proyectos de ejemplo
INSERT INTO projects (id, name, portfolio_id, structure_id, stage, description, dev_start_date, go_live_date, planned_go_live_date, created_by) VALUES
  ('55555555-0000-0000-0000-000000000001', 'Portal PMO', '33333333-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 'En Desarrollo', 'Migración del portal PMO a infraestructura corporativa AWS', '2026-01-15', NULL, '2026-06-30', '22222222-0000-0000-0000-000000000001'),
  ('55555555-0000-0000-0000-000000000002', 'ERP Módulo Finanzas', '33333333-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 'En Desarrollo', 'Implementación módulo de finanzas en SAP', '2026-02-01', NULL, '2026-09-30', '22222222-0000-0000-0000-000000000001'),
  ('55555555-0000-0000-0000-000000000003', 'App Móvil Empleados', '33333333-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 'Por Iniciar', 'Aplicación móvil para autoservicio de empleados', NULL, NULL, '2026-12-31', '22222222-0000-0000-0000-000000000001'),
  ('55555555-0000-0000-0000-000000000004', 'Migración Datacenter', '33333333-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 'Completado', 'Migración servidores on-premise a AWS', '2025-06-01', '2026-01-10', '2025-12-31', '22222222-0000-0000-0000-000000000001'),
  ('55555555-0000-0000-0000-000000000005', 'BI Dashboard Ventas', '33333333-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 'En Pausa', 'Dashboard de inteligencia de negocios para ventas', '2026-01-01', NULL, '2026-08-31', '22222222-0000-0000-0000-000000000001');

-- Actividades
INSERT INTO activities (id, name, created_by) VALUES
  ('66666666-0000-0000-0000-000000000001', 'Desarrollo', '22222222-0000-0000-0000-000000000001'),
  ('66666666-0000-0000-0000-000000000002', 'Análisis', '22222222-0000-0000-0000-000000000001'),
  ('66666666-0000-0000-0000-000000000003', 'QA / Pruebas', '22222222-0000-0000-0000-000000000001'),
  ('66666666-0000-0000-0000-000000000004', 'Gestión de Proyecto', '22222222-0000-0000-0000-000000000001');

-- Participantes
INSERT INTO participants (id, name, email, company_id) VALUES
  ('77777777-0000-0000-0000-000000000001', 'Ana García', 'ana.garcia@empresa.com', '11111111-0000-0000-0000-000000000001'),
  ('77777777-0000-0000-0000-000000000002', 'Carlos López', 'carlos.lopez@empresa.com', '11111111-0000-0000-0000-000000000001'),
  ('77777777-0000-0000-0000-000000000003', 'María Torres', 'maria.torres@empresa.com', '11111111-0000-0000-0000-000000000001');

-- Presupuestos
INSERT INTO project_budgets (project_id, structure_id, authorized_amount, spent_amount, authorization_date) VALUES
  ('55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 350000.00, 120000.00, '2026-01-10'),
  ('55555555-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000001', 1200000.00, 450000.00, '2026-01-15');
