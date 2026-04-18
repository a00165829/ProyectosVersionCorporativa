import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../db/pool';

export const companiesRouter = Router();
companiesRouter.use(requireAuth);

companiesRouter.get('/', async (_req, res) => {
  const result = await pool.query(
    'SELECT * FROM companies WHERE deleted_at IS NULL ORDER BY name'
  );
  res.json(result.rows);
});

companiesRouter.post('/', requireRole('admin'), async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  const result = await pool.query(
    'INSERT INTO companies (name) VALUES ($1) RETURNING *',
    [name.trim()]
  );
  res.status(201).json(result.rows[0]);
});

companiesRouter.put('/:id', requireRole('admin'), async (req, res) => {
  const { name } = req.body;
  const result = await pool.query(
    'UPDATE companies SET name=COALESCE($1,name) WHERE id=$2 AND deleted_at IS NULL RETURNING *',
    [name, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'No encontrada' });
  res.json(result.rows[0]);
});

companiesRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  await pool.query('UPDATE companies SET deleted_at=now() WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});
