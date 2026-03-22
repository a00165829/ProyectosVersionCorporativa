import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../db/pool';

export const budgetRouter = Router();
budgetRouter.use(requireAuth);

// GET /api/budget?portfolio_id=xxx
budgetRouter.get('/', async (req, res) => {
  const { portfolio_id } = req.query;
  const result = await pool.query(`
    SELECT pb.*,
           p.name  AS project_name,
           p.portfolio_id,
           s.name  AS structure_name,
           po.name AS portfolio_name
    FROM project_budgets pb
    JOIN projects p       ON p.id  = pb.project_id
    LEFT JOIN structures s  ON s.id  = pb.structure_id
    LEFT JOIN portfolios po ON po.id = p.portfolio_id
    WHERE ($1::uuid IS NULL OR p.portfolio_id = $1)
      AND pb.deleted_at IS NULL
    ORDER BY pb.created_at DESC
  `, [portfolio_id || null]);
  res.json(result.rows);
});

// POST /api/budget
budgetRouter.post('/', requireRole('admin','director','gerente'), async (req, res) => {
  const {
    project_id, structure_id, authorized_amount, spent_amount,
    authorization_date, comments, budget_type, budget_status, cost_center
  } = req.body;
  if (!project_id) return res.status(400).json({ error: 'Proyecto requerido' });

  const result = await pool.query(`
    INSERT INTO project_budgets
      (project_id, structure_id, authorized_amount, spent_amount,
       authorization_date, comments)
    VALUES ($1,$2,$3,$4,$5,$6)
    ON CONFLICT (project_id) DO UPDATE SET
      structure_id = EXCLUDED.structure_id,
      authorized_amount = EXCLUDED.authorized_amount,
      authorization_date = EXCLUDED.authorization_date,
      comments = EXCLUDED.comments
    RETURNING *
  `, [project_id, structure_id||null, authorized_amount||0, spent_amount||0,
      authorization_date||null, comments||'']);
  res.status(201).json(result.rows[0]);
});

// PUT /api/budget/:id
budgetRouter.put('/:id', requireRole('admin','director','gerente'), async (req, res) => {
  const { authorized_amount, spent_amount, authorization_date, comments, structure_id } = req.body;
  const result = await pool.query(`
    UPDATE project_budgets SET
      authorized_amount  = COALESCE($1, authorized_amount),
      spent_amount       = COALESCE($2, spent_amount),
      authorization_date = COALESCE($3, authorization_date),
      comments           = COALESCE($4, comments),
      structure_id       = COALESCE($5, structure_id)
    WHERE id = $6 RETURNING *
  `, [authorized_amount, spent_amount, authorization_date, comments, structure_id, req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Presupuesto no encontrado' });
  res.json(result.rows[0]);
});

// DELETE /api/budget/:id
budgetRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  await pool.query('UPDATE project_budgets SET deleted_at = now() WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});
