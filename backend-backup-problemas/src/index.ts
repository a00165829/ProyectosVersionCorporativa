import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import { authRouter }         from './routes/auth';
import { usersRouter }        from './routes/users';
import { projectsRouter }     from './routes/projects';
import { portfoliosRouter }   from './routes/portfolios';
import { rolesRouter }        from './routes/roles';
import { structuresRouter }   from './routes/structures';
import { budgetRouter }       from './routes/budget';
import { participantsRouter } from './routes/participants';
import { activitiesRouter }   from './routes/activities';
import { resourcesRouter }    from './routes/resources';
import { companiesRouter }    from './routes/companies';
import { assignmentsRouter }  from './routes/assignments';
import { trashRouter }        from './routes/trash';
import { menuConfigRouter }   from './routes/menuConfig';
import { permissionsRouter }  from './routes/permissions';
import { errorHandler }       from './middleware/errorHandler';
import { pool }               from './db/pool';
import { requestorsRouter }  from './routes/requestors';
import { aiRouter }          from './routes/ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: IS_PROD
    ? (process.env.FRONTEND_URL || true)  // In production with unified container, allow same origin
    : (process.env.FRONTEND_URL || 'http://localhost:5173'),
  credentials: true,
}));
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self' https://login.microsoftonline.com https://*.microsoftonline.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:;");
  next();
});
app.use(express.json());
app.use('/api/requestors',    requestorsRouter);
app.use('/api/ai',            aiRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', env: process.env.NODE_ENV, timestamp: new Date().toISOString() });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRouter);
app.use('/api/users',         usersRouter);
app.use('/api/projects',      projectsRouter);
app.use('/api/portfolios',    portfoliosRouter);
app.use('/api/roles',         rolesRouter);
app.use('/api/structures',    structuresRouter);
app.use('/api/budget',        budgetRouter);
app.use('/api/participants',  participantsRouter);
app.use('/api/activities',    activitiesRouter);
app.use('/api/resources',     resourcesRouter);
app.use('/api/companies',     companiesRouter);
app.use('/api/assignments',   assignmentsRouter);
app.use('/api/trash',         trashRouter);
app.use('/api/menu-config',   menuConfigRouter);
app.use('/api/permissions',   permissionsRouter);

// ── Serve frontend in production (unified container) ──────────────────────────
if (IS_PROD) {
  const publicDir = path.join(__dirname, '..', 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    // SPA fallback — any non-API route serves index.html
    app.get('*', (_req, res) => {
      res.sendFile(path.join(publicDir, 'index.html'));
    });
    console.log(`📁 Serving frontend from ${publicDir}`);
  }
}

app.use(errorHandler);

// ── Auto-migrate on startup ───────────────────────────────────────────────────
async function runMigrations() {
  try {
    const migrationFile = path.join(__dirname, '..', 'src', 'db', 'migrate_budget.sql');
    if (fs.existsSync(migrationFile)) {
      const sql = fs.readFileSync(migrationFile, 'utf-8');
      await pool.query(sql);
      console.log('✅ Migrations applied');
    }
  } catch (err: any) {
    // Ignore "already exists" errors
    if (!err.message?.includes('already exists')) {
      console.error('⚠️  Migration warning:', err.message);
    }
  }
}

app.listen(PORT, async () => {
  console.log(`✅ PMO Portal running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Auth: ${process.env.AZURE_TENANT_ID && process.env.AZURE_TENANT_ID !== 'placeholder' ? 'Enterprise Application' : 'Dev Mode (bypass)'}`);
  console.log(`   Database: ${process.env.DATABASE_URL ? 'configured' : '⚠️  NOT SET'}`);
  console.log(`   Group mappings: ${process.env.GROUP_ID_ADMINS ? 'configured' : '⚠️  NOT SET (dev mode uses admin role)'}`);
  await runMigrations();
});

export default app;
