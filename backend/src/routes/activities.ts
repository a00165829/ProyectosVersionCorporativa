import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../db/pool';

export const activitiesRouter = Router();
activitiesRouter.use(requireAuth);

activitiesRouter.get('/', async (_req, res) => {
  const result = await pool.query(
    'SELECT * FROM activities WHERE deleted_at IS NULL ORDER BY name'
  );
  res.json(result.rows);
});

activitiesRouter.post('/', requireRole('admin','director','gerente'), async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  const result = await pool.query(
    'INSERT INTO activities (name, created_by) VALUES ($1, $2) RETURNING *',
    [name.trim(), req.user!.id]
  );
  res.status(201).json(result.rows[0]);
});

activitiesRouter.put('/:id', requireRole('admin','director','gerente'), async (req, res) => {
  const { name } = req.body;
  const result = await pool.query(
    'UPDATE activities SET name=COALESCE($1,name) WHERE id=$2 AND deleted_at IS NULL RETURNING *',
    [name, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'No encontrado' });
  res.json(result.rows[0]);
});

activitiesRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  await pool.query('UPDATE activities SET deleted_at=now() WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});
