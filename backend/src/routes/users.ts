import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { pool } from '../db/pool';

export const usersRouter = Router();
usersRouter.use(requireAuth);

// GET /api/users — solo admin
usersRouter.get('/', requireRole('admin'), async (_req, res) => {
  const result = await pool.query(`
    SELECT p.id, p.email, p.display_name, p.avatar_url, p.created_at,
           ur.role
    FROM profiles p
    LEFT JOIN user_roles ur ON ur.user_id = p.id
    ORDER BY p.created_at DESC
  `);
  res.json(result.rows);
});

// PUT /api/users/:id/role — solo admin
usersRouter.put('/:id/role', requireRole('admin'), async (req, res) => {
  const { role } = req.body;
  const validRoles = ['admin','director','gerente','lider','usuario','pending'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }
  await pool.query(`
    INSERT INTO user_roles (user_id, role) VALUES ($1, $2)
    ON CONFLICT (user_id) DO UPDATE SET role = $2
  `, [req.params.id, role]);
  res.json({ success: true });
});

// POST /api/users/invite — solo admin
usersRouter.post('/invite', requireRole('admin'), async (req, res) => {
  const { email, display_name } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  const existing = await pool.query(
    'SELECT id FROM profiles WHERE email = $1', [email.toLowerCase()]
  );
  if (existing.rows[0]) {
    return res.status(409).json({ error: 'Ya existe un usuario con ese correo' });
  }

  // En producción los usuarios se crean automáticamente al hacer login con Enterprise App
  // Por ahora registra la invitación
  await pool.query(`
    INSERT INTO user_invitations (email, display_name, invited_by, status)
    VALUES ($1, $2, $3, 'sent')
    ON CONFLICT (email) DO NOTHING
  `, [email.toLowerCase(), display_name || '', req.user!.id]);

  res.json({ success: true, message: 'Invitación registrada' });
});
