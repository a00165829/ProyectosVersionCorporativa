import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../db/pool';

export const budgetRouter = Router();
budgetRouter.use(requireAuth);

// Bloquear acceso a usuarios — solo admin, director, gerente, lider
budgetRouter.use(requireRole('admin', 'director', 'gerente', 'lider'));

// GET /api/budget?portfolio_id=xxx
// Lider solo ve los presupuestos que él creó
budgetRouter.get('/', async (req, res) => {
  const { portfolio_id } = req.query;
  const isLider = req.user!.role === 'lider';

  let query = `
    SELECT pb.*,
           p.name  AS project_name,
           p.portfolio_id,
           s.name  AS structure_name,
           po.name AS portfolio_name
    FROM project_budgets pb
    JOIN projects p       ON p.id  = pb.project_id
    LEFT JOIN structures s  ON s.id  = pb.structure_id
    LEFT JOIN portfolios po ON po.id = p.portfolio_id
    WHERE pb.deleted_at IS NULL
  `;
  const params: any[] = [];

  if (portfolio_id) {
    params.push(portfolio_id);
    query += ` AND p.portfolio_id = $${params.length}`;
  }

  if (isLider) {
    params.push(req.user!.id);
    query += ` AND pb.created_by = $${params.length}`;
  }

  query += ' ORDER BY pb.created_at DESC';

  const result = await pool.query(query, params);
  res.json(result.rows);
});

// POST /api/budget
budgetRouter.post('/', requireRole('admin','director','gerente','lider'), async (req, res) => {
  const {
    project_id, structure_id, authorized_amount,
    authorization_date, comments, budget_status, budget_type, cost_center
  } = req.body;
  if (!project_id) return res.status(400).json({ error: 'project_id requerido' });

  const result = await pool.query(`
    INSERT INTO project_budgets
      (project_id, structure_id, authorized_amount, authorization_date, comments,
       budget_status, budget_type, cost_center, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    project_id, structure_id || null, authorized_amount || 0,
    authorization_date || null, comments || '',
    budget_status || 'Pendiente de autorizar', budget_type || 'CAPEX',
    cost_center || 'Pendiente', req.user!.id
  ]);
  res.status(201).json(result.rows[0]);
});

// PUT /api/budget/:id
// Lider solo puede editar presupuestos que él creó
budgetRouter.put('/:id', requireRole('admin','director','gerente','lider'), async (req, res) => {
  const { authorized_amount, spent_amount, authorization_date, comments,
          structure_id, budget_status, budget_type, cost_center } = req.body;

  // Si es lider, verificar que sea el creador
  if (req.user!.role === 'lider') {
    const check = await pool.query('SELECT created_by FROM project_budgets WHERE id = $1', [req.params.id]);
    if (!check.rows[0] || check.rows[0].created_by !== req.user!.id) {
      return res.status(403).json({ error: 'Solo puedes editar presupuestos que hayas creado' });
    }
  }

  const result = await pool.query(`
    UPDATE project_budgets SET
      authorized_amount  = COALESCE($1, authorized_amount),
      spent_amount       = COALESCE($2, spent_amount),
      authorization_date = COALESCE($3, authorization_date),
      comments           = COALESCE($4, comments),
      structure_id       = COALESCE($5, structure_id),
      budget_status      = COALESCE($6, budget_status),
      budget_type        = COALESCE($7, budget_type),
      cost_center        = COALESCE($8, cost_center)
    WHERE id = $9 AND deleted_at IS NULL RETURNING *
  `, [authorized_amount, spent_amount, authorization_date, comments,
      structure_id, budget_status, budget_type, cost_center, req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Presupuesto no encontrado' });
  res.json(result.rows[0]);
});

// DELETE /api/budget/:id — solo admin
budgetRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  await pool.query('UPDATE project_budgets SET deleted_at = now() WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});
