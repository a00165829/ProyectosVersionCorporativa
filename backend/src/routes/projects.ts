import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../db/pool';

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

// ── Participantes (DEBE ir antes de /:id para que no colisione) ──────────────
projectsRouter.get('/participants/list', async (_req, res) => {
  const result = await pool.query(
    'SELECT id, name FROM participants WHERE deleted_at IS NULL ORDER BY name'
  );
  res.json(result.rows);
});

// ── Listar proyectos ─────────────────────────────────────────────────────────
projectsRouter.get('/', async (req, res) => {
  const { portfolio_id } = req.query;
  const isLider = req.user!.role === 'lider';
  const params: any[] = [portfolio_id];
  let filter = '';

  if (isLider) {
    params.push(req.user!.id);
    filter = ` AND p.created_by = $${params.length}`;
  }

  const result = await pool.query(`
    SELECT p.*, s.name AS structure_name, pa.name AS responsible_name, rq.name AS requestor_name
    FROM projects p
    LEFT JOIN structures s ON s.id = p.structure_id
    LEFT JOIN participants pa ON pa.id = p.responsible_id
    LEFT JOIN requestors rq ON rq.id = p.requestor_id
    WHERE p.portfolio_id = $1 AND p.deleted_at IS NULL${filter}
    ORDER BY p.priority ASC NULLS LAST, p.name
  `, params);
  res.json(result.rows);
});

// ── Detalle de proyecto ──────────────────────────────────────────────────────
projectsRouter.get('/:id', async (req, res) => {
  const result = await pool.query(`
    SELECT p.*, pa.name AS responsible_name, rq.name AS requestor_name
    FROM projects p
    LEFT JOIN participants pa ON pa.id = p.responsible_id
    LEFT JOIN requestors rq ON rq.id = p.requestor_id
    WHERE p.id = $1 AND p.deleted_at IS NULL
  `, [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Proyecto no encontrado' });

  if (req.user!.role === 'lider' && result.rows[0].created_by !== req.user!.id) {
    return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
  }

  res.json(result.rows[0]);
});

// ── Crear proyecto ───────────────────────────────────────────────────────────
projectsRouter.post('/', async (req, res) => {
  const { name, portfolio_id, structure_id, scrum_stage, description,
    classification, priority, progress, responsible_id, requestor_id,
    project_start_date, dev_start_date, dev_end_date,
    test_start_date, test_end_date, go_live_date, planned_go_live_date } = req.body;
  const result = await pool.query(`
    INSERT INTO projects (name, portfolio_id, structure_id, scrum_stage, stage, description,
      classification, priority, progress, responsible_id, requestor_id,
      project_start_date, dev_start_date, dev_end_date, test_start_date, test_end_date,
      go_live_date, planned_go_live_date, created_by)
    VALUES ($1,$2,$3,$4,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    RETURNING *
  `, [name, portfolio_id, structure_id, scrum_stage||'Backlog', description,
      classification||'Proyecto', priority||null, progress||0, responsible_id||null,
      requestor_id||null,
      project_start_date||null, dev_start_date||null, dev_end_date||null,
      test_start_date||null, test_end_date||null,
      go_live_date||null, planned_go_live_date||null, req.user!.id]);
  res.status(201).json(result.rows[0]);
});

// Helper: convierte string vacio a null para fechas
function dateOrNull(v: any): string | null {
  if (!v || v === '') return null;
  return v;
}

// ── Actualizar proyecto ──────────────────────────────────────────────────────
projectsRouter.put('/:id', requireRole('admin','director','gerente','lider'), async (req, res) => {
  const { name, scrum_stage, description, classification, priority, progress,
    responsible_id, requestor_id, project_start_date, dev_start_date, dev_end_date,
    test_start_date, test_end_date, go_live_date, planned_go_live_date, structure_id } = req.body;

  // Lider solo puede editar sus propios proyectos
  if (req.user!.role === 'lider') {
    const check = await pool.query('SELECT created_by FROM projects WHERE id = $1', [req.params.id]);
    if (!check.rows[0] || check.rows[0].created_by !== req.user!.id) {
      return res.status(403).json({ error: 'Solo puedes editar proyectos que hayas creado' });
    }
  }

  // Auto 100% cuando etapa = Go Live o Completado
  const finalProgress = (scrum_stage === 'Go Live' || scrum_stage === 'Completado')
    ? 100 : progress;

  const result = await pool.query(`
    UPDATE projects SET
      name = COALESCE($1, name),
      scrum_stage = COALESCE($2, scrum_stage),
      stage = COALESCE($2, stage),
      description = COALESCE($3, description),
      classification = COALESCE($4, classification),
      priority = $5,
      progress = COALESCE($6, progress),
      responsible_id = $7,
      requestor_id = $8,
      project_start_date = $9,
      dev_start_date = $10,
      dev_end_date = $11,
      test_start_date = $12,
      test_end_date = $13,
      go_live_date = $14,
      planned_go_live_date = $15,
      structure_id = COALESCE($16, structure_id),
      updated_at = now()
    WHERE id = $17 AND deleted_at IS NULL RETURNING *
  `, [name, scrum_stage, description, classification, priority??null, finalProgress,
      responsible_id??null, requestor_id??null,
      dateOrNull(project_start_date), dateOrNull(dev_start_date), dateOrNull(dev_end_date),
      dateOrNull(test_start_date), dateOrNull(test_end_date),
      dateOrNull(go_live_date), dateOrNull(planned_go_live_date),
      structure_id, req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Proyecto no encontrado' });
  res.json(result.rows[0]);
});

// ── Eliminar proyecto (soft delete) ──────────────────────────────────────────
projectsRouter.delete('/:id', requireRole('admin','director','gerente','lider'), async (req, res) => {
  if (req.user!.role === 'lider') {
    const check = await pool.query('SELECT created_by FROM projects WHERE id = $1', [req.params.id]);
    if (!check.rows[0] || check.rows[0].created_by !== req.user!.id) {
      return res.status(403).json({ error: 'Solo puedes eliminar proyectos que hayas creado' });
    }
  }
  await pool.query('UPDATE projects SET deleted_at=now() WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

// ── Comentarios ──────────────────────────────────────────────────────────────
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

// ── Historial de estatus ─────────────────────────────────────────────────────
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
  if (!description?.trim()) return res.status(400).json({ error: 'Descripcion requerida' });

  if (stage) {
    const isComplete = stage === 'Go Live' || stage === 'Completado';
    if (isComplete) {
      await pool.query(
        `UPDATE projects SET scrum_stage=$1, stage=$1, progress=100, updated_at=now()
         WHERE id=$2 AND deleted_at IS NULL`,
        [stage, req.params.id]
      );
    } else {
      await pool.query(
        `UPDATE projects SET scrum_stage=$1, stage=$1, updated_at=now()
         WHERE id=$2 AND deleted_at IS NULL`,
        [stage, req.params.id]
      );
    }
  }

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

// ── Archivos ─────────────────────────────────────────────────────────────────
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
