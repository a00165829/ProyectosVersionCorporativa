import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../db/pool';

export const permissionsRouter = Router();
permissionsRouter.use(requireAuth);
permissionsRouter.use(requireRole('admin'));

// GET /api/permissions/:userId — get all permissions for a user
permissionsRouter.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  const [modules, companies, portfolios, profile] = await Promise.all([
    pool.query('SELECT module FROM user_module_permissions WHERE user_id = $1', [userId]),
    pool.query('SELECT company_id FROM user_company_permissions WHERE user_id = $1', [userId]),
    pool.query('SELECT portfolio_id FROM user_portfolio_permissions WHERE user_id = $1', [userId]),
    pool.query('SELECT id, email, display_name FROM profiles WHERE id = $1', [userId]),
  ]);

  // Get role
  const roleRes = await pool.query('SELECT role FROM user_roles WHERE user_id = $1', [userId]);

  res.json({
    user: profile.rows[0] || null,
    role: roleRes.rows[0]?.role || 'pending',
    modules: modules.rows.map(r => r.module),
    companyIds: companies.rows.map(r => r.company_id),
    portfolioIds: portfolios.rows.map(r => r.portfolio_id),
  });
});

// PUT /api/permissions/:userId/modules — set module permissions
permissionsRouter.put('/:userId/modules', async (req, res) => {
  const { userId } = req.params;
  const { modules } = req.body; // string[]
  if (!Array.isArray(modules)) return res.status(400).json({ error: 'modules debe ser un array' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM user_module_permissions WHERE user_id = $1', [userId]);
    for (const mod of modules) {
      await client.query(
        'INSERT INTO user_module_permissions (user_id, module) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, mod]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  res.json({ success: true, modules });
});

// PUT /api/permissions/:userId/companies — set company access
permissionsRouter.put('/:userId/companies', async (req, res) => {
  const { userId } = req.params;
  const { companyIds } = req.body; // string[]
  if (!Array.isArray(companyIds)) return res.status(400).json({ error: 'companyIds debe ser un array' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM user_company_permissions WHERE user_id = $1', [userId]);
    for (const cid of companyIds) {
      await client.query(
        'INSERT INTO user_company_permissions (user_id, company_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, cid]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  res.json({ success: true, companyIds });
});

// PUT /api/permissions/:userId/portfolios — set portfolio access
permissionsRouter.put('/:userId/portfolios', async (req, res) => {
  const { userId } = req.params;
  const { portfolioIds } = req.body; // string[]
  if (!Array.isArray(portfolioIds)) return res.status(400).json({ error: 'portfolioIds debe ser un array' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM user_portfolio_permissions WHERE user_id = $1', [userId]);
    for (const pid of portfolioIds) {
      await client.query(
        'INSERT INTO user_portfolio_permissions (user_id, portfolio_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, pid]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  res.json({ success: true, portfolioIds });
});
