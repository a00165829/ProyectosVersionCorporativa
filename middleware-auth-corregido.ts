import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { pool } from '../db/pool';

const tenantId = process.env.AZURE_TENANT_ID!;
const clientId = process.env.AZURE_CLIENT_ID!;

// En desarrollo (sin Enterprise App configurada), usamos modo bypass
const DEV_MODE = !tenantId || tenantId === 'placeholder';

// JWT secret para tokens de desarrollo
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-for-local-development';

// ── Mapeo de Group IDs de Enterprise App → roles ─────────────────────────────
// Estos Object IDs se obtienen del equipo de Identidad y se configuran como
// variables de entorno. El orden define la prioridad (admin > director > ... > usuario)
const GROUP_ROLE_MAP: { groupId: string; role: string }[] = [
  { groupId: process.env.GROUP_ID_ADMINS     || '', role: 'admin' },
  { groupId: process.env.GROUP_ID_DIRECTORES || '', role: 'director' },
  { groupId: process.env.GROUP_ID_GERENTES   || '', role: 'gerente' },
  { groupId: process.env.GROUP_ID_LIDERES    || '', role: 'lider' },
  { groupId: process.env.GROUP_ID_USUARIOS   || '', role: 'usuario' },
].filter(g => g.groupId); // Solo incluir los que estén configurados

const client = DEV_MODE ? null : jwksClient({
  jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000,
});

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  azureOid: string;
  groups: string[];
}

declare global {
  namespace Express {
    interface Request { user?: AuthUser; }
  }
}

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client!.getSigningKey(header.kid!, (err, key) => {
    callback(err, key?.getPublicKey());
  });
}

// Determinar el rol del usuario basado en sus grupos de Enterprise App
// Toma el rol de mayor privilegio si pertenece a múltiples grupos
function resolveRole(userGroups: string[]): string {
  if (!userGroups || userGroups.length === 0) return 'pending';
  for (const mapping of GROUP_ROLE_MAP) {
    if (userGroups.includes(mapping.groupId)) {
      return mapping.role;
    }
  }
  // Si no pertenece a ningún grupo configurado pero tiene grupos,
  // asignar rol por defecto
  return 'usuario';
}

// ✅ NUEVA FUNCIÓN: Detectar tipo de token
function isDevToken(token: string): boolean {
  try {
    // Los tokens de dev tienen un payload específico con id que empieza con 22222222
    const payload = jwt.decode(token, { complete: false }) as any;
    return payload?.id === '22222222-0000-0000-0000-000000000001';
  } catch {
    return false;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // ── Verificar header de autorización ──────────────────────────────────────────
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // ✅ NUEVO: Detectar tipo de token y validar apropiadamente
    if (isDevToken(token)) {
      console.log('🔧 Validando token de desarrollo...');
      
      // Validar token de desarrollo con secret simple
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        azureOid: decoded.azureOid,
        groups: [],
      };
      
      console.log('✅ Token de desarrollo válido:', decoded.role);
      return next();
      
    } else if (!DEV_MODE) {
      console.log('🔧 Validando token de Enterprise Application...');
      
      // ── Producción: validar JWT de Microsoft Enterprise Application ──────────────
      const decoded = await new Promise<any>((resolve, reject) => {
        jwt.verify(token, getKey, {
          audience: clientId,
          issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
        }, (err, payload) => {
          if (err) reject(err);
          else resolve(payload);
        });
      });

      // Los grupos vienen en el token JWT como array de Group IDs
      const userGroups: string[] = decoded.groups || [];
      const role = resolveRole(userGroups);

      // Buscar o crear perfil en BD
      let result = await pool.query(
        'SELECT id, email, display_name FROM profiles WHERE azure_oid = $1',
        [decoded.oid]
      );

      if (!result.rows[0]) {
        // Auto-crear perfil en el primer login
        result = await pool.query(`
          INSERT INTO profiles (azure_oid, email, display_name)
          VALUES ($1, $2, $3)
          ON CONFLICT (azure_oid) DO UPDATE SET email = $2, display_name = $3, updated_at = now()
          RETURNING id, email, display_name
        `, [decoded.oid, decoded.preferred_username || decoded.email || '', decoded.name || '']);

        // También crear/actualizar el rol en user_roles para compatibilidad
        await pool.query(`
          INSERT INTO user_roles (user_id, role) VALUES ($1, $2)
          ON CONFLICT (user_id) DO UPDATE SET role = $2
        `, [result.rows[0].id, role]);
      } else {
        // Actualizar rol según grupos actuales (puede cambiar entre logins)
        await pool.query(`
          INSERT INTO user_roles (user_id, role) VALUES ($1, $2)
          ON CONFLICT (user_id) DO UPDATE SET role = $2
        `, [result.rows[0].id, role]);
      }

      const u = result.rows[0];
      req.user = {
        id: u.id,
        email: u.email || decoded.preferred_username || '',
        name: u.display_name || decoded.name || '',
        role,
        azureOid: decoded.oid,
        groups: userGroups,
      };
      
      console.log('✅ Token de Enterprise Application válido:', role);
      return next();
      
    } else {
      // DEV_MODE pero token no es de dev - rechazar
      console.log('❌ Token no válido para modo desarrollo');
      return res.status(401).json({ error: 'Token no válido para modo desarrollo' });
    }
    
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Sin permisos suficientes' });
    }
    next();
  };
}