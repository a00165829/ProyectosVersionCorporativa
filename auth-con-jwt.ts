import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { pool } from '../db/pool';
import jwt from 'jsonwebtoken';

export const authRouter = Router();

// GET /api/auth/me — devuelve el usuario actual con su rol y permisos
authRouter.get('/me', requireAuth, async (req, res) => {
  const { id, email, name, role } = req.user!;

  // Intentar obtener perfil de BD, pero no fallar si no existe
  let profile: any = null;
  let modules: string[] = [];
  let companyIds: string[] = [];
  let portfolioIds: string[] = [];

  try { const r = await pool.query('SELECT * FROM profiles WHERE id = $1', [id]); profile = r.rows[0]; } catch {}
  try { const r = await pool.query('SELECT module FROM user_module_permissions WHERE user_id = $1', [id]); modules = r.rows.map(r => r.module); } catch {}
  try { const r = await pool.query('SELECT company_id FROM user_company_permissions WHERE user_id = $1', [id]); companyIds = r.rows.map(r => r.company_id); } catch {}
  try { const r = await pool.query('SELECT portfolio_id FROM user_portfolio_permissions WHERE user_id = $1', [id]); portfolioIds = r.rows.map(r => r.portfolio_id); } catch {}

  res.json({
    user: {
      id,
      email: profile?.email || email,
      displayName: profile?.display_name || name,
      avatarUrl: profile?.avatar_url || null,
      role,
      modules,
      companyIds,
      portfolioIds,
    }
  });
});

// POST /api/auth/sync — sincroniza el perfil del usuario al hacer login con Enterprise App
authRouter.post('/sync', requireAuth, async (req, res) => {
  const { azureOid, email, name, role } = req.user!;

  // Upsert perfil
  const result = await pool.query(`
    INSERT INTO profiles (azure_oid, email, display_name)
    VALUES ($1, $2, $3)
    ON CONFLICT (azure_oid) DO UPDATE SET
      email = COALESCE(NULLIF($2, ''), profiles.email),
      display_name = COALESCE(NULLIF($3, ''), profiles.display_name),
      updated_at = now()
    RETURNING id
  `, [azureOid, email, name]);

  const userId = result.rows[0].id;

  // Actualizar rol basado en grupos de Enterprise App
  await pool.query(`
    INSERT INTO user_roles (user_id, role) VALUES ($1, $2)
    ON CONFLICT (user_id) DO UPDATE SET role = $2
  `, [userId, role]);

  res.json({ status: 'synced', role });
});

// POST /api/auth/dev-signin — login en modo desarrollo con JWT token
authRouter.post('/dev-signin', async (req, res) => {
  try {
    // Datos del usuario dev
    const devUser = {
      id: '22222222-0000-0000-0000-000000000001',
      email: 'admin@empresa.com',
      name: 'Dev User (admin)',
      role: 'admin',
      azureOid: 'dev-oid-001',
    };

    // Generar JWT token
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-for-local-development';
    const token = jwt.sign(
      {
        id: devUser.id,
        email: devUser.email,
        name: devUser.name,
        role: devUser.role,
        azureOid: devUser.azureOid,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 horas
      },
      jwtSecret,
      { algorithm: 'HS256' }
    );

    res.json({ 
      success: true, 
      user: devUser,
      token: token,
      message: 'Dev login successful'
    });
  } catch (error) {
    console.error('Error in dev-signin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});