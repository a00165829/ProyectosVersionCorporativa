import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { pool } from '../db/pool';

export const portfoliosRouter = Router();
portfoliosRouter.use(requireAuth);

portfoliosRouter.get('/', async (req, res) => {
  const result = await pool.query(`
    SELECT po.*, c.name as company_name
    FROM portfolios po
    LEFT JOIN companies c ON c.id = po.company_id
    WHERE po.deleted_at IS NULL
    ORDER BY po.name
  `);
  res.json(result.rows);
});

portfoliosRouter.post('/', async (req, res) => {
  const { name, company_id } = req.body;
  const result = await pool.query(
    'INSERT INTO portfolios (name, company_id) VALUES ($1, $2) RETURNING *',
    [name, company_id]
  );
  res.status(201).json(result.rows[0]);
});

export const rolesRouter = Router();
rolesRouter.use(requireAuth);

rolesRouter.get('/permissions', async (req, res) => {
  const userId = req.user!.id;
  const [modules, companies] = await Promise.all([
    pool.query('SELECT module FROM user_module_permissions WHERE user_id = $1', [userId]),
    pool.query('SELECT company_id FROM user_company_permissions WHERE user_id = $1', [userId]),
  ]);
  res.json({
    role: req.user!.role,
    modules: modules.rows.map(r => r.module),
    companyIds: companies.rows.map(r => r.company_id),
  });
});
