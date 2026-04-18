import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../db/pool';

export const menuConfigRouter = Router();
menuConfigRouter.use(requireAuth);

// Default menu structure — used to seed on first load
const DEFAULT_MENUS = [
  // Proyectos
  { module_id: 'dashboard',      label: 'Dashboard',          href: '/',              icon: 'LayoutDashboard', section: 'proyectos',     sort_order: 0 },
  { module_id: 'projects',       label: 'En Proceso',         href: '/projects',      icon: 'FolderKanban',    section: 'proyectos',     sort_order: 1 },
  { module_id: 'completed',      label: 'Completados',        href: '/completed',     icon: 'CheckCircle2',    section: 'proyectos',     sort_order: 2 },
  { module_id: 'cancelled',      label: 'Cancelados',         href: '/cancelled',     icon: 'XCircle',         section: 'proyectos',     sort_order: 3 },
  { module_id: 'project-costs',  label: 'Costo de Proyectos', href: '/project-costs', icon: 'DollarSign',      section: 'proyectos',     sort_order: 4 },
  // Recursos
  { module_id: 'res-dashboard',  label: 'Dashboard',          href: '/resources/dashboard',   icon: 'LayoutDashboard', section: 'recursos',  sort_order: 0 },
  { module_id: 'res-assignments',label: 'Recursos Asignaciones',href: '/resources/assignments',icon: 'UserCheck',      section: 'recursos',  sort_order: 1 },
  { module_id: 'res-reports',    label: 'Reportes',           href: '/resources/reports',     icon: 'BarChart3',       section: 'recursos',  sort_order: 2 },
  { module_id: 'res-workload',   label: 'Carga de Trabajo',   href: '/resources/workload',    icon: 'Weight',          section: 'recursos',  sort_order: 3 },
  { module_id: 'res-gantt',      label: 'Gantt',              href: '/resources/gantt',       icon: 'CalendarRange',   section: 'recursos',  sort_order: 4 },
  // Presupuesto
  { module_id: 'budget',         label: 'Presupuestos',       href: '/budget',        icon: 'DollarSign',      section: 'presupuesto',   sort_order: 0 },
  { module_id: 'structures',     label: 'Estructuras',        href: '/structures',    icon: 'Building2',       section: 'presupuesto',   sort_order: 1 },
  // Administración
  { module_id: 'activities',     label: 'Catálogo',           href: '/admin/activities',   icon: 'ListChecks',  section: 'administracion', sort_order: 0 },
  { module_id: 'users',          label: 'Usuarios',           href: '/admin/users',        icon: 'Users',       section: 'administracion', sort_order: 1 },
  { module_id: 'participants',   label: 'Líderes',            href: '/admin/participants', icon: 'UserCheck',   section: 'administracion', sort_order: 2 },
  { module_id: 'requestors',     label: 'Solicitantes',       href: '/admin/requestors',   icon: 'UserCheck',   section: 'administracion', sort_order: 3 },
  { module_id: 'resources',      label: 'Recursos',           href: '/admin/resources',    icon: 'HardDrive',   section: 'administracion', sort_order: 4 },
  { module_id: 'companies',      label: 'Empresas',           href: '/admin/companies',    icon: 'Briefcase',   section: 'administracion', sort_order: 5 },
  { module_id: 'edit-menus',     label: 'Editar Menús',       href: '/admin/menus',        icon: 'Settings',    section: 'administracion', sort_order: 6 },
  { module_id: 'trash',          label: 'Papelera',           href: '/admin/trash',        icon: 'Trash2',      section: 'administracion', sort_order: 7 },
];

// GET /api/menu-config — returns current menu structure
menuConfigRouter.get('/', async (_req, res) => {
  const result = await pool.query(
    'SELECT * FROM menu_config ORDER BY section, sort_order'
  );

  // If table is empty, seed with defaults
  if (result.rows.length === 0) {
    for (const item of DEFAULT_MENUS) {
      await pool.query(`
        INSERT INTO menu_config (module_id, label, href, icon, section, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [item.module_id, item.label, item.href, item.icon, item.section, item.sort_order]);
    }
    const seeded = await pool.query('SELECT * FROM menu_config ORDER BY section, sort_order');
    return res.json(seeded.rows);
  }

  res.json(result.rows);
});

// GET /api/menu-config/sections — returns list of unique section names
menuConfigRouter.get('/sections', async (_req, res) => {
  const result = await pool.query(
    'SELECT DISTINCT section FROM menu_config ORDER BY section'
  );
  res.json(result.rows.map(r => r.section));
});

// PUT /api/menu-config/:id — update a single menu item (label, section, sort_order, visible, icon)
menuConfigRouter.put('/:id', requireRole('admin'), async (req, res) => {
  const { label, section, sort_order, visible, icon } = req.body;
  const result = await pool.query(`
    UPDATE menu_config SET
      label = COALESCE($1, label),
      section = COALESCE($2, section),
      sort_order = COALESCE($3, sort_order),
      visible = COALESCE($4, visible),
      icon = COALESCE($5, icon),
      updated_at = now()
    WHERE id = $6 RETURNING *
  `, [label, section, sort_order !== undefined ? sort_order : null, visible, icon, req.params.id]);

  if (!result.rows[0]) return res.status(404).json({ error: 'No encontrado' });
  res.json(result.rows[0]);
});

// PUT /api/menu-config/bulk — bulk update sort_order and section for multiple items
menuConfigRouter.put('/', requireRole('admin'), async (req, res) => {
  const { items } = req.body; // [{ id, label, section, sort_order, visible, icon }]
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items debe ser un array' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of items) {
      await client.query(`
        UPDATE menu_config SET
          label = COALESCE($1, label),
          section = COALESCE($2, section),
          sort_order = COALESCE($3, sort_order),
          visible = COALESCE($4, visible),
          icon = COALESCE($5, icon),
          updated_at = now()
        WHERE id = $6
      `, [item.label, item.section, item.sort_order, item.visible, item.icon, item.id]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const result = await pool.query('SELECT * FROM menu_config ORDER BY section, sort_order');
  res.json(result.rows);
});

// POST /api/menu-config/reset — reset to default menu structure
menuConfigRouter.post('/reset', requireRole('admin'), async (_req, res) => {
  await pool.query('DELETE FROM menu_config');
  for (const item of DEFAULT_MENUS) {
    await pool.query(`
      INSERT INTO menu_config (module_id, label, href, icon, section, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [item.module_id, item.label, item.href, item.icon, item.section, item.sort_order]);
  }
  const result = await pool.query('SELECT * FROM menu_config ORDER BY section, sort_order');
  res.json(result.rows);
});

// POST /api/menu-config/sections — create a new section name
menuConfigRouter.post('/sections', requireRole('admin'), async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  // Section is just a string on items, no separate table needed
  res.json({ section: name.trim().toLowerCase() });
});
