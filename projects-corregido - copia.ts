import express from 'express';
import { pool } from '../db/pool';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// Get all projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        p.*,
        c.name as company_name,
        po.name as portfolio_name
      FROM projects p
      LEFT JOIN companies c ON p.company_id = c.id
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
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        p.*,
        c.name as company_name,
        po.name as portfolio_name
      FROM projects p
      LEFT JOIN companies c ON p.company_id = c.id
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
router.post('/', authenticateToken, requireRole(['admin', 'director', 'gerente']), async (req, res) => {
  try {
    const {
      name,
      description,
      company_id,
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
        name, description, company_id, portfolio_id, status, priority,
        start_date, end_date, budget, sponsor, manager, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      name, description, company_id, portfolio_id, status, priority,
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
router.put('/:id', authenticateToken, requireRole(['admin', 'director', 'gerente']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      company_id,
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
      SET name = $1, description = $2, company_id = $3, portfolio_id = $4,
          status = $5, priority = $6, start_date = $7, end_date = $8,
          budget = $9, sponsor = $10, manager = $11, updated_at = CURRENT_TIMESTAMP
      WHERE id = $12 AND deleted_at IS NULL
      RETURNING *
    `;

    const values = [
      name, description, company_id, portfolio_id, status, priority,
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
router.delete('/:id', authenticateToken, requireRole(['admin', 'director']), async (req, res) => {
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

export default router;