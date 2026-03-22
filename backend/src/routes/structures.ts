import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../db/pool';

export const structuresRouter = Router();
structuresRouter.use(requireAuth);

const fmtMoney = (n: number) => n;

// GET /api/structures
structuresRouter.get('/', async (_req, res) => {
  const result = await pool.query(`
    SELECT s.*,
      COALESCE((
        SELECT SUM(pb.authorized_amount)
        FROM project_budgets pb
        WHERE pb.structure_id = s.id
      ), 0) as used_amount
    FROM structures s
    WHERE s.deleted_at IS NULL
    ORDER BY s.name
  `);
  res.json(result.rows);
});

// POST /api/structures
structuresRouter.post('/', requireRole('admin','director','gerente'), async (req, res) => {
  const { name, description, total_budget, portfolio_id } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  const result = await pool.query(`
    INSERT INTO structures (name, total_budget, portfolio_id, created_by)
    VALUES ($1, $2, $3, $4) RETURNING *
  `, [name.trim(), total_budget || 0, portfolio_id || null, req.user!.id]);
  res.status(201).json(result.rows[0]);
});

// PUT /api/structures/:id
structuresRouter.put('/:id', requireRole('admin','director','gerente'), async (req, res) => {
  const { name, description, total_budget } = req.body;
  const result = await pool.query(`
    UPDATE structures SET
      name = COALESCE($1, name),
      total_budget = COALESCE($2, total_budget),
      updated_at = now()
    WHERE id = $3 AND deleted_at IS NULL RETURNING *
  `, [name, total_budget, req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Estructura no encontrada' });
  res.json(result.rows[0]);
});

// DELETE /api/structures/:id
structuresRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  await pool.query('UPDATE structures SET deleted_at = now() WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});
