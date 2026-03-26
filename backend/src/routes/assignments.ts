import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../db/pool';

export const assignmentsRouter = Router();
assignmentsRouter.use(requireAuth);
assignmentsRouter.use(requireRole('admin', 'director', 'gerente', 'lider'));

// GET /api/assignments?portfolio_id=xxx
// Lider solo ve asignaciones que él creó
assignmentsRouter.get('/', async (req, res) => {
  const { portfolio_id, participant_id } = req.query;
  const isLider = req.user!.role === 'lider';
  let where = 'ra.deleted_at IS NULL';
  const params: any[] = [];
  if (portfolio_id) { params.push(portfolio_id); where += ` AND ra.portfolio_id = $${params.length}`; }
  if (participant_id) { params.push(participant_id); where += ` AND ra.participant_id = $${params.length}`; }
  if (isLider) { params.push(req.user!.id); where += ` AND ra.created_by = $${params.length}`; }

  const result = await pool.query(`
    SELECT ra.*,
           pa.name AS participant_name,
           pa.email AS participant_email,
           p.name AS project_name,
           a.name AS activity_name,
           po.name AS portfolio_name,
           r.name AS resource_name,
           r.cost_usd AS resource_cost_usd
    FROM resource_assignments ra
    LEFT JOIN participants pa ON pa.id = ra.participant_id
    LEFT JOIN projects p ON p.id = ra.project_id
    LEFT JOIN activities a ON a.id = ra.activity_id
    LEFT JOIN portfolios po ON po.id = ra.portfolio_id
    LEFT JOIN resources r ON r.id = ra.resource_id
    WHERE ${where}
    ORDER BY ra.start_date DESC
  `, params);
  res.json(result.rows);
});

// GET /api/assignments/workload
assignmentsRouter.get('/workload', async (req, res) => {
  const { portfolio_id } = req.query;
  let filter = '';
  const params: any[] = [];
  if (portfolio_id) { params.push(portfolio_id); filter = `AND ra.portfolio_id = $${params.length}`; }

  const result = await pool.query(`
    SELECT
      pa.id, pa.name, pa.email,
      COUNT(DISTINCT ra.project_id) AS project_count,
      COUNT(ra.id) AS assignment_count,
      COALESCE(SUM(ra.end_date - ra.start_date + 1), 0) AS total_days,
      COALESCE(MAX(ra.allocation_percentage), 0) AS max_allocation,
      BOOL_OR(ra.has_overlap) AS has_overlap
    FROM participants pa
    LEFT JOIN resource_assignments ra ON ra.participant_id = pa.id AND ra.deleted_at IS NULL ${filter}
    WHERE pa.deleted_at IS NULL
    GROUP BY pa.id, pa.name, pa.email
    ORDER BY pa.name
  `, params);
  res.json(result.rows);
});

// GET /api/assignments/costs — uses resource_id for proper cost lookup
assignmentsRouter.get('/costs', async (req, res) => {
  const { portfolio_id } = req.query;
  const params: any[] = [];
  let portfolioFilter = '';
  if (portfolio_id) {
    params.push(portfolio_id);
    portfolioFilter = `AND p.portfolio_id = $${params.length}`;
  }

  const result = await pool.query(`
    SELECT
      p.id AS project_id, p.name AS project_name,
      po.name AS portfolio_name,
      COUNT(ra.id) AS assignment_count,
      COALESCE(SUM(
        (ra.end_date - ra.start_date + 1) *
        (ra.allocation_percentage::numeric / 100) *
        COALESCE(r.cost_usd, 0)
      ), 0) AS total_cost_usd,
      COALESCE(SUM(ra.end_date - ra.start_date + 1), 0) AS total_days
    FROM projects p
    INNER JOIN resource_assignments ra ON ra.project_id = p.id AND ra.deleted_at IS NULL
    LEFT JOIN resources r ON r.id = ra.resource_id AND r.deleted_at IS NULL
    LEFT JOIN portfolios po ON po.id = p.portfolio_id
    WHERE p.deleted_at IS NULL ${portfolioFilter}
    GROUP BY p.id, p.name, po.name
    ORDER BY total_cost_usd DESC
  `, params);
  res.json(result.rows);
});

// POST /api/assignments
assignmentsRouter.post('/', requireRole('admin','director','gerente','lider'), async (req, res) => {
  const { participant_id, project_id, activity_id, portfolio_id, resource_id,
    start_date, end_date, allocation_percentage, leader_name } = req.body;

  if (!participant_id || !project_id || !start_date || !end_date) {
    return res.status(400).json({ error: 'Participante, proyecto y fechas son requeridos' });
  }

  // Validate overlap
  const validation = await pool.query(
    'SELECT validate_resource_allocation($1, $2, $3, $4) AS result',
    [participant_id, start_date, end_date, allocation_percentage || 100]
  );
  const check = validation.rows[0].result;
  const has_overlap = !check.valid;

  const result = await pool.query(`
    INSERT INTO resource_assignments
      (participant_id, project_id, activity_id, portfolio_id, resource_id,
       start_date, end_date, allocation_percentage, leader_name, has_overlap, created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
  `, [participant_id, project_id, activity_id || null, portfolio_id || null, resource_id || null,
      start_date, end_date, allocation_percentage || 100, leader_name || null, has_overlap, req.user!.id]);

  res.status(201).json(result.rows[0]);
});

// PUT /api/assignments/:id
assignmentsRouter.put('/:id', requireRole('admin','director','gerente','lider'), async (req, res) => {
  // Lider solo puede editar asignaciones que él creó
  if (req.user!.role === 'lider') {
    const check = await pool.query('SELECT created_by FROM resource_assignments WHERE id = $1', [req.params.id]);
    if (!check.rows[0] || check.rows[0].created_by !== req.user!.id) {
      return res.status(403).json({ error: 'Solo puedes editar asignaciones que hayas creado' });
    }
  }

  const { participant_id, project_id, activity_id, portfolio_id, resource_id,
    start_date, end_date, allocation_percentage, leader_name } = req.body;

  let has_overlap = false;
  if (participant_id && start_date && end_date) {
    const validation = await pool.query(
      'SELECT validate_resource_allocation($1, $2, $3, $4, $5) AS result',
      [participant_id, start_date, end_date, allocation_percentage || 100, req.params.id]
    );
    has_overlap = !validation.rows[0].result.valid;
  }

  const result = await pool.query(`
    UPDATE resource_assignments SET
      participant_id=COALESCE($1,participant_id), project_id=COALESCE($2,project_id),
      activity_id=$3, portfolio_id=$4, resource_id=$5,
      start_date=COALESCE($6,start_date), end_date=COALESCE($7,end_date),
      allocation_percentage=COALESCE($8,allocation_percentage),
      leader_name=$9, has_overlap=$10
    WHERE id=$11 AND deleted_at IS NULL RETURNING *
  `, [participant_id, project_id, activity_id||null, portfolio_id||null, resource_id||null,
      start_date, end_date, allocation_percentage, leader_name||null,
      has_overlap, req.params.id]);

  if (!result.rows[0]) return res.status(404).json({ error: 'No encontrado' });
  res.json(result.rows[0]);
});

// DELETE /api/assignments/:id
assignmentsRouter.delete('/:id', requireRole('admin','director','gerente','lider'), async (req, res) => {
  if (req.user!.role === 'lider') {
    const check = await pool.query('SELECT created_by FROM resource_assignments WHERE id = $1', [req.params.id]);
    if (!check.rows[0] || check.rows[0].created_by !== req.user!.id) {
      return res.status(403).json({ error: 'Solo puedes eliminar asignaciones que hayas creado' });
    }
  }
  await pool.query('UPDATE resource_assignments SET deleted_at=now() WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});
