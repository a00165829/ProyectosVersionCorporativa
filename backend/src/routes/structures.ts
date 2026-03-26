import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../db/pool';

export const structuresRouter = Router();
structuresRouter.use(requireAuth);

// Bloquear acceso a usuarios — solo admin, director, gerente, lider
structuresRouter.use(requireRole('admin', 'director', 'gerente', 'lider'));

// GET /api/structures?portfolio_id=xxx
// Lider solo ve las estructuras que él creó
structuresRouter.get('/', async (req, res) => {
  const { portfolio_id } = req.query;
  const isLider = req.user!.role === 'lider';
  const params: any[] = [];
  let filter = '';

  if (portfolio_id) {
    params.push(portfolio_id);
    filter += ` AND s.portfolio_id = $${params.length}`;
  }

  if (isLider) {
    params.push(req.user!.id);
    filter += ` AND s.created_by = $${params.length}`;
  }

  const result = await pool.query(`
    SELECT s.*,
      COALESCE((
        SELECT SUM(pb.authorized_amount)
        FROM project_budgets pb
        WHERE pb.structure_id = s.id
      ), 0) as used_amount
    FROM structures s
    WHERE s.deleted_at IS NULL ${filter}
    ORDER BY s.name
  `, params);
  res.json(result.rows);
});

// POST /api/structures
structuresRouter.post('/', requireRole('admin','director','gerente','lider'), async (req, res) => {
  const { name, description, total_budget, portfolio_id } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  const result = await pool.query(`
    INSERT INTO structures (name, total_budget, portfolio_id, created_by)
    VALUES ($1, $2, $3, $4) RETURNING *
  `, [name.trim(), total_budget || 0, portfolio_id || null, req.user!.id]);
  res.status(201).json(result.rows[0]);
});

// PUT /api/structures/:id
// Lider solo puede editar estructuras que él creó
structuresRouter.put('/:id', requireRole('admin','director','gerente','lider'), async (req, res) => {
  const { name, description, total_budget } = req.body;

  if (req.user!.role === 'lider') {
    const check = await pool.query('SELECT created_by FROM structures WHERE id = $1', [req.params.id]);
    if (!check.rows[0] || check.rows[0].created_by !== req.user!.id) {
      return res.status(403).json({ error: 'Solo puedes editar estructuras que hayas creado' });
    }
  }

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

// DELETE /api/structures/:id — solo admin
structuresRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  await pool.query('UPDATE structures SET deleted_at = now() WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});
