import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { pool } from '../db/pool';

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

// GET /api/projects?portfolio_id=xxx
projectsRouter.get('/', async (req, res) => {
  const { portfolio_id } = req.query;
  const result = await pool.query(`
    SELECT p.*, s.name as structure_name
    FROM projects p
    LEFT JOIN structures s ON s.id = p.structure_id
    WHERE p.portfolio_id = $1 AND p.deleted_at IS NULL
    ORDER BY p.name
  `, [portfolio_id]);
  res.json(result.rows);
});

// GET /api/projects/:id
projectsRouter.get('/:id', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM projects WHERE id = $1 AND deleted_at IS NULL',
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Proyecto no encontrado' });
  res.json(result.rows[0]);
});

// POST /api/projects
projectsRouter.post('/', async (req, res) => {
  const { name, portfolio_id, structure_id, stage, description,
          dev_start_date, go_live_date, planned_go_live_date } = req.body;

  const result = await pool.query(`
    INSERT INTO projects
      (name, portfolio_id, structure_id, stage, description,
       dev_start_date, go_live_date, planned_go_live_date, created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
  `, [name, portfolio_id, structure_id, stage, description,
      dev_start_date, go_live_date, planned_go_live_date, req.user!.id]);

  res.status(201).json(result.rows[0]);
});

// PUT /api/projects/:id
projectsRouter.put('/:id', async (req, res) => {
  const { name, stage, description, dev_start_date,
          go_live_date, planned_go_live_date, structure_id } = req.body;

  const result = await pool.query(`
    UPDATE projects SET
      name = COALESCE($1, name),
      stage = COALESCE($2, stage),
      description = COALESCE($3, description),
      dev_start_date = COALESCE($4, dev_start_date),
      go_live_date = COALESCE($5, go_live_date),
      planned_go_live_date = COALESCE($6, planned_go_live_date),
      structure_id = COALESCE($7, structure_id),
      updated_at = now()
    WHERE id = $8 AND deleted_at IS NULL
    RETURNING *
  `, [name, stage, description, dev_start_date,
      go_live_date, planned_go_live_date, structure_id, req.params.id]);

  if (!result.rows[0]) return res.status(404).json({ error: 'Proyecto no encontrado' });
  res.json(result.rows[0]);
});

// DELETE /api/projects/:id (soft delete)
projectsRouter.delete('/:id', async (req, res) => {
  await pool.query(
    'UPDATE projects SET deleted_at = now() WHERE id = $1',
    [req.params.id]
  );
  res.json({ success: true });
});
