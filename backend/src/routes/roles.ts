import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { pool } from '../db/pool';

export const rolesRouter = Router();
rolesRouter.use(requireAuth);

// GET /api/roles/permissions — permisos del usuario actual
rolesRouter.get('/permissions', async (req, res) => {
  const userId = req.user!.id;
  const [modules, companies] = await Promise.all([
    pool.query('SELECT module FROM user_module_permissions WHERE user_id = $1', [userId]),
    pool.query('SELECT company_id FROM user_company_permissions WHERE user_id = $1', [userId]),
  ]);
  res.json({
    role: req.user!.role,
    modules: modules.rows.map((r: any) => r.module),
    companyIds: companies.rows.map((r: any) => r.company_id),
  });
});
