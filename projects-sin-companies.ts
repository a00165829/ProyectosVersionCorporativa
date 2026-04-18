import express from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();

// Get all projects
router.get('/', requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT
        p.*,
        po.name as portfolio_name
      FROM projects p
      LEFT JOIN portfolios po ON p.portfolio_id = po.id
      WHERE p.deleted_at IS NULL
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT
        p.*,
        po.name as portfolio_name
      FROM projects p
      LEFT JOIN portfolios po ON p.portfolio_id = po.id
      WHERE p.id = $1 AND p.deleted_at IS NULL
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create project
router.post('/', requireAuth, requireRole(['admin', 'director', 'gerente']), async (req, res) => {
  try {
    const {
      name,
      description,
      portfolio_id,
      status,
      priority,
      start_date,
      end_date,
      budget,
      sponsor,
      manager
    } = req.body;

    const query = `
      INSERT INTO projects (
        name, description, portfolio_id, status, priority,
        start_date, end_date, budget, sponsor, manager, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      name, description, portfolio_id, status, priority,
      start_date, end_date, budget, sponsor, manager, req.user.id
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update project
router.put('/:id', requireAuth, requireRole(['admin', 'director', 'gerente']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      portfolio_id,
      status,
      priority,
      start_date,
      end_date,
      budget,
      sponsor,
      manager
    } = req.body;

    const query = `
      UPDATE projects
      SET name = $1, description = $2, portfolio_id = $3,
          status = $4, priority = $5, start_date = $6, end_date = $7,
          budget = $8, sponsor = $9, manager = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $11 AND deleted_at IS NULL
      RETURNING *
    `;

    const values = [
      name, description, portfolio_id, status, priority,
      start_date, end_date, budget, sponsor, manager, id
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete project (soft delete)
router.delete('/:id', requireAuth, requireRole(['admin', 'director']), async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE projects
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as projectsRouter };
export default router;