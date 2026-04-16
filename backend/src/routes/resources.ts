import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../db/pool';

export const resourcesRouter = Router();
resourcesRouter.use(requireAuth);

// ── GET /api/resources — lista con skills, leader y formato completo ─────────
resourcesRouter.get('/', async (_req, res) => {
  const result = await pool.query(`
    SELECT
      r.id, r.name, r.email, r.cost_usd, r.cost_usd_monthly,
      r.leader_id, p.name AS leader_name,
      COALESCE(
        json_agg(
          json_build_object('id', s.id, 'name', s.name)
          ORDER BY s.name
        ) FILTER (WHERE s.id IS NOT NULL),
        '[]'
      ) AS skills
    FROM resources r
    LEFT JOIN participants p ON p.id = r.leader_id
    LEFT JOIN resource_skills rs ON rs.resource_id = r.id
    LEFT JOIN skills s ON s.id = rs.skill_id AND s.deleted_at IS NULL
    WHERE r.deleted_at IS NULL
    GROUP BY r.id, p.name
    ORDER BY r.name
  `);
  res.json(result.rows);
});

// ── GET /api/resources/skills — catálogo de skills disponibles ───────────────
resourcesRouter.get('/skills', async (_req, res) => {
  const result = await pool.query(
    'SELECT id, name FROM skills WHERE deleted_at IS NULL ORDER BY name'
  );
  res.json(result.rows);
});

// ── POST /api/resources/skills — crear nuevo skill ───────────────────────────
resourcesRouter.post('/skills', requireRole('admin','director','gerente'), async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const result = await pool.query(
      'INSERT INTO skills (name) VALUES ($1) RETURNING id, name',
      [name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ya existe un skill con ese nombre' });
    throw err;
  }
});

// ── POST /api/resources — crear con todos los campos ─────────────────────────
resourcesRouter.post('/', requireRole('admin','director','gerente'), async (req, res) => {
  const { name, email, leader_id, cost_usd_monthly, skill_ids } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO resources (name, email, leader_id, cost_usd_monthly, cost_usd)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name.trim(), email?.trim() || null, leader_id || null,
       cost_usd_monthly || 0, (cost_usd_monthly || 0) / 22]
    );
    const resourceId = result.rows[0].id;

    if (Array.isArray(skill_ids) && skill_ids.length > 0) {
      const values = skill_ids.map((_: string, i: number) =>
        `($1, $${i + 2})`).join(',');
      await client.query(
        `INSERT INTO resource_skills (resource_id, skill_id) VALUES ${values}`,
        [resourceId, ...skill_ids]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ id: resourceId });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// ── PUT /api/resources/:id — actualizar todos los campos ─────────────────────
resourcesRouter.put('/:id', requireRole('admin','director','gerente'), async (req, res) => {
  const { name, email, leader_id, cost_usd_monthly, skill_ids } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE resources SET
        name = COALESCE($1, name),
        email = $2,
        leader_id = $3,
        cost_usd_monthly = COALESCE($4, cost_usd_monthly),
        cost_usd = COALESCE($5, cost_usd)
       WHERE id = $6 AND deleted_at IS NULL
       RETURNING id`,
      [name, email?.trim() || null, leader_id || null,
       cost_usd_monthly, cost_usd_monthly ? cost_usd_monthly / 22 : null,
       req.params.id]
    );

    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'No encontrado' });
    }

    if (Array.isArray(skill_ids)) {
      await client.query('DELETE FROM resource_skills WHERE resource_id = $1', [req.params.id]);
      if (skill_ids.length > 0) {
        const values = skill_ids.map((_: string, i: number) =>
          `($1, $${i + 2})`).join(',');
        await client.query(
          `INSERT INTO resource_skills (resource_id, skill_id) VALUES ${values}`,
          [req.params.id, ...skill_ids]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// ── DELETE /api/resources/:id ─────────────────────────────────────────────────
resourcesRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  await pool.query('UPDATE resources SET deleted_at = now() WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});
