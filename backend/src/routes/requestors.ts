import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../db/pool';

export const requestorsRouter = Router();
requestorsRouter.use(requireAuth);

// ── Listar solicitantes ───────────────────────────────────────────────────────
requestorsRouter.get('/', async (_req, res) => {
  const result = await pool.query(`
    SELECT r.*, c.name as company_name
    FROM requestors r
    LEFT JOIN companies c ON c.id = r.company_id
    WHERE r.deleted_at IS NULL
    ORDER BY r.name
  `);
  res.json(result.rows);
});

// ── Crear solicitante ─────────────────────────────────────────────────────────
requestorsRouter.post('/', requireRole('admin'), async (req, res) => {
  const { name, email, company_id } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  const result = await pool.query(`
    INSERT INTO requestors (name, email, company_id)
    VALUES ($1, $2, $3) RETURNING *
  `, [name.trim(), email?.trim() || null, company_id || null]);
  res.status(201).json(result.rows[0]);
});

// ── Actualizar solicitante ────────────────────────────────────────────────────
requestorsRouter.put('/:id', requireRole('admin'), async (req, res) => {
  const { name, email, company_id } = req.body;
  const result = await pool.query(`
    UPDATE requestors SET name=$1, email=$2, company_id=$3
    WHERE id=$4 AND deleted_at IS NULL RETURNING *
  `, [name?.trim(), email?.trim() || null, company_id || null, req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Solicitante no encontrado' });
  res.json(result.rows[0]);
});

// ── Eliminar solicitante (soft delete) ────────────────────────────────────────
requestorsRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  await pool.query(
    'UPDATE requestors SET deleted_at = now() WHERE id = $1',
    [req.params.id]
  );
  res.json({ success: true });
});
