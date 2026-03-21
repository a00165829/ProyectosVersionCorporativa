import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { pool } from '../db/pool';

const tenantId = process.env.AZURE_TENANT_ID!;

// En desarrollo (sin Azure AD configurado), usamos modo bypass
const DEV_MODE = !tenantId || tenantId === 'placeholder';

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

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // ── Modo desarrollo: token simulado ───────────────────────────────────────
  if (DEV_MODE) {
    req.user = {
      id: '22222222-0000-0000-0000-000000000001',
      email: 'admin@empresa.com',
      name: 'Administrador (Dev)',
      role: 'admin',
      azureOid: 'dev-oid-001',
    };
    return next();
  }

  // ── Producción: validar JWT de Azure AD ───────────────────────────────────
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await new Promise<any>((resolve, reject) => {
      jwt.verify(token, getKey, {
        audience: process.env.AZURE_CLIENT_ID,
        issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
      }, (err, payload) => {
        if (err) reject(err);
        else resolve(payload);
      });
    });

    // Buscar usuario y rol en BD
    const result = await pool.query(`
      SELECT p.id, p.email, p.display_name, ur.role
      FROM profiles p
      LEFT JOIN user_roles ur ON ur.user_id = p.id
      WHERE p.azure_oid = $1
    `, [decoded.oid]);

    if (!result.rows[0]) {
      return res.status(403).json({ error: 'Usuario no registrado en el sistema' });
    }

    const u = result.rows[0];
    req.user = {
      id: u.id,
      email: u.email,
      name: u.display_name,
      role: u.role || 'pending',
      azureOid: decoded.oid,
    };
    next();
  } catch (err) {
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
