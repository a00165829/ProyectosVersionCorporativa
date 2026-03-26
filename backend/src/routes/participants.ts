import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../db/pool';

export const participantsRouter = Router();
participantsRouter.use(requireAuth);

// GET /api/participants
participantsRouter.get('/', async (_req, res) => {
  const result = await pool.query(`
    SELECT p.*, c.name AS company_name,
      (SELECT COUNT(*) FROM resource_assignments ra WHERE ra.participant_id = p.id AND ra.deleted_at IS NULL) AS assignment_count
    FROM participants p
    LEFT JOIN companies c ON c.id = p.company_id
    WHERE p.deleted_at IS NULL
    ORDER BY p.name
  `);
  res.json(result.rows);
});

// POST /api/participants
participantsRouter.post('/', requireRole('admin','director','gerente'), async (req, res) => {
  const { name, email, company_id } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  const result = await pool.query(
    'INSERT INTO participants (name, email, company_id) VALUES ($1, $2, $3) RETURNING *',
    [name.trim(), email?.trim() || null, company_id || null]
  );
  res.status(201).json(result.rows[0]);
});

// PUT /api/participants/:id
participantsRouter.put('/:id', requireRole('admin','director','gerente'), async (req, res) => {
  const { name, email, company_id } = req.body;
  const result = await pool.query(`
    UPDATE participants SET name=COALESCE($1,name), email=COALESCE($2,email), company_id=$3
    WHERE id=$4 AND deleted_at IS NULL RETURNING *
  `, [name, email, company_id || null, req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'No encontrado' });
  res.json(result.rows[0]);
});

// DELETE /api/participants/:id
participantsRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  await pool.query('UPDATE participants SET deleted_at=now() WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});
