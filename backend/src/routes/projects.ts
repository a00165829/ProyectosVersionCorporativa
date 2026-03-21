import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { pool } from '../db/pool';

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

projectsRouter.get('/participants/list', async (_req, res) => {
  const result = await pool.query(
    'SELECT id, name FROM participants WHERE deleted_at IS NULL ORDER BY name'
  );
  res.json(result.rows);
});

projectsRouter.get('/', async (req, res) => {
  const { portfolio_id } = req.query;
  const result = await pool.query(`
    SELECT p.*, s.name AS structure_name, pa.name AS responsible_name
    FROM projects p
    LEFT JOIN structures s ON s.id = p.structure_id
    LEFT JOIN participants pa ON pa.id = p.responsible_id
    WHERE p.portfolio_id = $1 AND p.deleted_at IS NULL
    ORDER BY p.priority ASC NULLS LAST, p.name
  `, [portfolio_id]);
  res.json(result.rows);
});

projectsRouter.get('/:id', async (req, res) => {
  const result = await pool.query(`
    SELECT p.*, pa.name AS responsible_name
    FROM projects p
    LEFT JOIN participants pa ON pa.id = p.responsible_id
    WHERE p.id = $1 AND p.deleted_at IS NULL
  `, [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Proyecto no encontrado' });
  res.json(result.rows[0]);
});

projectsRouter.post('/', async (req, res) => {
  const { name, portfolio_id, structure_id, scrum_stage, description,
    classification, priority, progress, responsible_id,
    project_start_date, dev_start_date, dev_end_date,
    test_start_date, test_end_date, go_live_date, planned_go_live_date } = req.body;
  const result = await pool.query(`
    INSERT INTO projects (name, portfolio_id, structure_id, scrum_stage, stage, description,
      classification, priority, progress, responsible_id,
      project_start_date, dev_start_date, dev_end_date, test_start_date, test_end_date,
      go_live_date, planned_go_live_date, created_by)
    VALUES ($1,$2,$3,$4,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    RETURNING *
  `, [name, portfolio_id, structure_id, scrum_stage||'Backlog', description,
      classification||'Proyecto', priority||null, progress||0, responsible_id||null,
      project_start_date||null, dev_start_date||null, dev_end_date||null,
      test_start_date||null, test_end_date||null,
      go_live_date||null, planned_go_live_date||null, req.user!.id]);
  res.status(201).json(result.rows[0]);
});

projectsRouter.put('/:id', async (req, res) => {
  const { name, scrum_stage, description, classification, priority, progress,
    responsible_id, project_start_date, dev_start_date, dev_end_date,
    test_start_date, test_end_date, go_live_date, planned_go_live_date, structure_id } = req.body;
  const result = await pool.query(`
    UPDATE projects SET
      name=$1, scrum_stage=COALESCE($2,scrum_stage), stage=COALESCE($2,stage),
      description=COALESCE($3,description), classification=COALESCE($4,classification),
      priority=$5, progress=COALESCE($6,progress), responsible_id=$7,
      project_start_date=COALESCE($8,project_start_date), dev_start_date=COALESCE($9,dev_start_date),
      dev_end_date=COALESCE($10,dev_end_date), test_start_date=COALESCE($11,test_start_date),
      test_end_date=COALESCE($12,test_end_date), go_live_date=COALESCE($13,go_live_date),
      planned_go_live_date=COALESCE($14,planned_go_live_date),
      structure_id=COALESCE($15,structure_id), updated_at=now()
    WHERE id=$16 AND deleted_at IS NULL RETURNING *
  `, [name, scrum_stage, description, classification, priority??null, progress,
      responsible_id??null, project_start_date, dev_start_date, dev_end_date,
      test_start_date, test_end_date, go_live_date, planned_go_live_date,
      structure_id, req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Proyecto no encontrado' });
  res.json(result.rows[0]);
});

projectsRouter.delete('/:id', async (req, res) => {
  await pool.query('UPDATE projects SET deleted_at=now() WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

// ── Comentarios ───────────────────────────────────────────────────────────────
projectsRouter.get('/:id/comments', async (req, res) => {
  const result = await pool.query(`
    SELECT c.*, p.display_name as author_name
    FROM project_comments c
    LEFT JOIN profiles p ON p.id = c.user_id
    WHERE c.project_id = $1 AND c.deleted_at IS NULL
    ORDER BY c.created_at DESC
  `, [req.params.id]);
  res.json(result.rows);
});

projectsRouter.post('/:id/comments', async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Contenido requerido' });
  const result = await pool.query(`
    INSERT INTO project_comments (project_id, user_id, content)
    VALUES ($1, $2, $3) RETURNING *
  `, [req.params.id, req.user!.id, content.trim()]);
  res.status(201).json(result.rows[0]);
});

projectsRouter.delete('/:projectId/comments/:commentId', async (req, res) => {
  await pool.query(
    'UPDATE project_comments SET deleted_at = now() WHERE id = $1',
    [req.params.commentId]
  );
  res.json({ success: true });
});

// ── Comentarios ───────────────────────────────────────────────────────────────
projectsRouter.get('/:id/comments', async (req, res) => {
  const result = await pool.query(`
    SELECT c.*, p.display_name as author_name
    FROM project_comments c
    LEFT JOIN profiles p ON p.id = c.user_id
    WHERE c.project_id = $1 AND c.deleted_at IS NULL
    ORDER BY c.created_at DESC
  `, [req.params.id]);
  res.json(result.rows);
});

projectsRouter.post('/:id/comments', async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Contenido requerido' });
  const result = await pool.query(`
    INSERT INTO project_comments (project_id, user_id, content)
    VALUES ($1, $2, $3) RETURNING *
  `, [req.params.id, req.user!.id, content.trim()]);
  res.status(201).json(result.rows[0]);
});

projectsRouter.delete('/:projectId/comments/:commentId', async (req, res) => {
  await pool.query(
    'UPDATE project_comments SET deleted_at = now() WHERE id = $1',
    [req.params.commentId]
  );
  res.json({ success: true });
});

// ── Historial de estatus ──────────────────────────────────────────────────────
projectsRouter.get('/:id/status-history', async (req, res) => {
  const result = await pool.query(`
    SELECT sh.*, p.display_name as author_name
    FROM project_status_history sh
    LEFT JOIN profiles p ON p.id = sh.user_id
    WHERE sh.project_id = $1
    ORDER BY sh.created_at DESC
  `, [req.params.id]);
  res.json(result.rows);
});

projectsRouter.post('/:id/status-history', async (req, res) => {
  const { description, stage, notes } = req.body;
  if (!description?.trim()) return res.status(400).json({ error: 'Descripción requerida' });
  const result = await pool.query(`
    INSERT INTO project_status_history (project_id, user_id, description, stage, notes)
    VALUES ($1, $2, $3, $4, $5) RETURNING *
  `, [req.params.id, req.user!.id, description.trim(), stage || null, notes?.trim() || '']);
  res.status(201).json(result.rows[0]);
});

projectsRouter.delete('/:projectId/status-history/:entryId', async (req, res) => {
  await pool.query('DELETE FROM project_status_history WHERE id = $1', [req.params.entryId]);
  res.json({ success: true });
});

// ── Archivos ──────────────────────────────────────────────────────────────────
projectsRouter.get('/:id/files', async (req, res) => {
  const result = await pool.query(`
    SELECT f.*, p.display_name as uploader_name
    FROM project_files f
    LEFT JOIN profiles p ON p.id = f.uploaded_by
    WHERE f.project_id = $1
    ORDER BY f.created_at DESC
  `, [req.params.id]);
  res.json(result.rows);
});

projectsRouter.post('/:id/files', async (req, res) => {
  const { name, url } = req.body;
  const result = await pool.query(`
    INSERT INTO project_files (project_id, name, s3_key, uploaded_by)
    VALUES ($1, $2, $3, $4) RETURNING *
  `, [req.params.id, name, url, req.user!.id]);
  res.status(201).json(result.rows[0]);
});

projectsRouter.delete('/:projectId/files/:fileId', async (req, res) => {
  await pool.query('DELETE FROM project_files WHERE id = $1', [req.params.fileId]);
  res.json({ success: true });
});
