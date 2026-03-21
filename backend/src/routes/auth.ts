import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { pool } from '../db/pool';

export const authRouter = Router();

// GET /api/auth/me — devuelve el usuario actual con su rol y permisos
authRouter.get('/me', requireAuth, async (req, res) => {
  const { id } = req.user!;

  const [profileRes, modulesRes, companiesRes] = await Promise.all([
    pool.query('SELECT * FROM profiles WHERE id = $1', [id]),
    pool.query('SELECT module FROM user_module_permissions WHERE user_id = $1', [id]),
    pool.query('SELECT company_id FROM user_company_permissions WHERE user_id = $1', [id]),
  ]);

  const profile = profileRes.rows[0];
  if (!profile) return res.status(404).json({ error: 'Perfil no encontrado' });

  res.json({
    user: {
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      role: req.user!.role,
      modules: modulesRes.rows.map(r => r.module),
      companyIds: companiesRes.rows.map(r => r.company_id),
    }
  });
});

// POST /api/auth/sync — crea o actualiza el perfil del usuario al hacer login con Azure AD
authRouter.post('/sync', requireAuth, async (req, res) => {
  const { azureOid, email, name } = req.user!;

  const existing = await pool.query(
    'SELECT id FROM profiles WHERE azure_oid = $1', [azureOid]
  );

  if (existing.rows.length === 0) {
    // Crear perfil nuevo con rol pending
    const result = await pool.query(`
      INSERT INTO profiles (azure_oid, email, display_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (azure_oid) DO UPDATE SET email = $2, display_name = $3
      RETURNING id
    `, [azureOid, email, name]);

    await pool.query(`
      INSERT INTO user_roles (user_id, role)
      VALUES ($1, 'pending')
      ON CONFLICT (user_id) DO NOTHING
    `, [result.rows[0].id]);

    return res.json({ status: 'created', role: 'pending' });
  }

  res.json({ status: 'existing', role: req.user!.role });
});
