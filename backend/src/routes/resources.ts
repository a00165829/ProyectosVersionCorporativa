import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../db/pool';

export const resourcesRouter = Router();
resourcesRouter.use(requireAuth);

resourcesRouter.get('/', async (_req, res) => {
  const result = await pool.query(
    'SELECT * FROM resources WHERE deleted_at IS NULL ORDER BY name'
  );
  res.json(result.rows);
});

resourcesRouter.post('/', requireRole('admin','director','gerente'), async (req, res) => {
  const { name, cost_usd } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  const result = await pool.query(
    'INSERT INTO resources (name, cost_usd) VALUES ($1, $2) RETURNING *',
    [name.trim(), cost_usd || 0]
  );
  res.status(201).json(result.rows[0]);
});

resourcesRouter.put('/:id', requireRole('admin','director','gerente'), async (req, res) => {
  const { name, cost_usd } = req.body;
  const result = await pool.query(
    'UPDATE resources SET name=COALESCE($1,name), cost_usd=COALESCE($2,cost_usd) WHERE id=$3 AND deleted_at IS NULL RETURNING *',
    [name, cost_usd, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'No encontrado' });
  res.json(result.rows[0]);
});

resourcesRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  await pool.query('UPDATE resources SET deleted_at=now() WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});
