import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../db/pool';

export const trashRouter = Router();
trashRouter.use(requireAuth);
trashRouter.use(requireRole('admin'));

// GET /api/trash — all soft-deleted items
trashRouter.get('/', async (_req, res) => {
  const [projects, budgets, structures, activities, participants, assignments, companies] = await Promise.all([
    pool.query(`SELECT id, name, 'project' AS type, deleted_at FROM projects WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`),
    pool.query(`SELECT pb.id, p.name, 'budget' AS type, pb.deleted_at FROM project_budgets pb JOIN projects p ON p.id=pb.project_id WHERE pb.deleted_at IS NOT NULL ORDER BY pb.deleted_at DESC`),
    pool.query(`SELECT id, name, 'structure' AS type, deleted_at FROM structures WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`),
    pool.query(`SELECT id, name, 'activity' AS type, deleted_at FROM activities WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`),
    pool.query(`SELECT id, name, 'participant' AS type, deleted_at FROM participants WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`),
    pool.query(`SELECT ra.id, pa.name || ' → ' || p.name AS name, 'assignment' AS type, ra.deleted_at FROM resource_assignments ra LEFT JOIN participants pa ON pa.id=ra.participant_id LEFT JOIN projects p ON p.id=ra.project_id WHERE ra.deleted_at IS NOT NULL ORDER BY ra.deleted_at DESC`),
    pool.query(`SELECT id, name, 'company' AS type, deleted_at FROM companies WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`),
  ]);

  res.json({
    projects: projects.rows,
    budgets: budgets.rows,
    structures: structures.rows,
    activities: activities.rows,
    participants: participants.rows,
    assignments: assignments.rows,
    companies: companies.rows,
  });
});

// POST /api/trash/restore — restore a soft-deleted item
trashRouter.post('/restore', async (req, res) => {
  const { id, type } = req.body;
  if (!id || !type) return res.status(400).json({ error: 'id y type requeridos' });

  const tableMap: Record<string, string> = {
    project: 'projects',
    budget: 'project_budgets',
    structure: 'structures',
    activity: 'activities',
    participant: 'participants',
    assignment: 'resource_assignments',
    company: 'companies',
  };

  const table = tableMap[type];
  if (!table) return res.status(400).json({ error: 'Tipo inválido' });

  await pool.query(`UPDATE ${table} SET deleted_at = NULL WHERE id = $1`, [id]);
  res.json({ success: true });
});

// DELETE /api/trash/permanent — permanently delete an item
trashRouter.delete('/permanent', async (req, res) => {
  const { id, type } = req.body;
  if (!id || !type) return res.status(400).json({ error: 'id y type requeridos' });

  const tableMap: Record<string, string> = {
    project: 'projects',
    budget: 'project_budgets',
    structure: 'structures',
    activity: 'activities',
    participant: 'participants',
    assignment: 'resource_assignments',
    company: 'companies',
  };

  const table = tableMap[type];
  if (!table) return res.status(400).json({ error: 'Tipo inválido' });

  await pool.query(`DELETE FROM ${table} WHERE id = $1 AND deleted_at IS NOT NULL`, [id]);
  res.json({ success: true });
});

// DELETE /api/trash/empty — permanently delete ALL soft-deleted items
trashRouter.delete('/empty', async (_req, res) => {
  await Promise.all([
    pool.query('DELETE FROM resource_assignments WHERE deleted_at IS NOT NULL'),
    pool.query('DELETE FROM project_budgets WHERE deleted_at IS NOT NULL'),
    pool.query('DELETE FROM projects WHERE deleted_at IS NOT NULL'),
    pool.query('DELETE FROM structures WHERE deleted_at IS NOT NULL'),
    pool.query('DELETE FROM activities WHERE deleted_at IS NOT NULL'),
    pool.query('DELETE FROM participants WHERE deleted_at IS NOT NULL'),
    pool.query('DELETE FROM companies WHERE deleted_at IS NOT NULL'),
  ]);
  res.json({ success: true });
});
