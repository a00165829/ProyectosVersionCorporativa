import express from 'express';
import pool from '../config/database';

const router = express.Router();

// Interfaces para TypeScript
interface ProjectData {
  nombre?: string;
  descripcion?: string;
  fecha_inicio_proyecto?: string;
  fecha_inicio_desarrollo?: string;
  fecha_fin_desarrollo?: string;
  fecha_inicio_pruebas?: string;
  fecha_fin_pruebas?: string;
  fecha_go_live_planeado?: string;
  fecha_go_live_real?: string;
  avance?: number;
  presupuesto_total?: number;
  company_id?: number;
  portfolio_id?: number;
  gerente_asignado_id?: string;
  lider_asignado_id?: string;
}

// GET /api/projects - Obtener todos los proyectos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        c.nombre as company_name,
        pt.nombre as portfolio_name,
        u1.nombre as gerente_name,
        u2.nombre as lider_name
      FROM projects p
      LEFT JOIN companies c ON p.company_id = c.id
      LEFT JOIN portfolios pt ON p.portfolio_id = pt.id
      LEFT JOIN profiles u1 ON p.gerente_asignado_id = u1.id
      LEFT JOIN profiles u2 ON p.lider_asignado_id = u2.id
      ORDER BY p.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/projects/:id - Obtener un proyecto específico
router.get('/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    
    const result = await pool.query(`
      SELECT 
        p.*,
        c.nombre as company_name,
        pt.nombre as portfolio_name,
        u1.nombre as gerente_name,
        u2.nombre as lider_name
      FROM projects p
      LEFT JOIN companies c ON p.company_id = c.id
      LEFT JOIN portfolios pt ON p.portfolio_id = pt.id
      LEFT JOIN profiles u1 ON p.gerente_asignado_id = u1.id
      LEFT JOIN profiles u2 ON p.lider_asignado_id = u2.id
      WHERE p.id = $1
    `, [projectId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /api/projects/:id - Actualizar proyecto (FIX COMPLETO)
router.put('/:id', async (req, res) => {
  const projectId: string = req.params.id;
  const projectData: ProjectData = req.body;

  try {
    console.log('🔍 Actualizando proyecto ID:', projectId);
    console.log('📝 Datos recibidos:', projectData);

    // Función para formatear fechas correctamente
    const formatDateForPostgres = (dateStr?: string): string | null => {
      if (!dateStr) return null;
      
      console.log('📅 Procesando fecha:', dateStr, 'tipo:', typeof dateStr);
      
      // Si ya está en formato ISO YYYY-MM-DD, mantenerlo
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      
      // Si viene como MM/DD/YYYY
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const [month, day, year] = parts;
          const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          console.log('🔧 Convertida:', dateStr, '→', formatted);
          return formatted;
        }
      }
      
      return dateStr;
    };

    const updateQuery = `
      UPDATE projects 
      SET 
        nombre = $1,
        descripcion = $2,
        fecha_inicio_proyecto = $3::date,
        fecha_inicio_desarrollo = $4::date,
        fecha_fin_desarrollo = $5::date,
        fecha_inicio_pruebas = $6::date,
        fecha_fin_pruebas = $7::date,
        fecha_go_live_planeado = $8::date,
        fecha_go_live_real = $9::date,
        avance = $10::numeric,
        presupuesto_total = $11::numeric,
        company_id = $12,
        portfolio_id = $13,
        gerente_asignado_id = $14,
        lider_asignado_id = $15,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $16
      RETURNING 
        id,
        nombre,
        descripcion,
        fecha_inicio_proyecto,
        fecha_inicio_desarrollo,
        fecha_fin_desarrollo,
        fecha_inicio_pruebas,
        fecha_fin_pruebas,
        fecha_go_live_planeado,
        fecha_go_live_real,
        avance,
        presupuesto_total,
        company_id,
        portfolio_id,
        gerente_asignado_id,
        lider_asignado_id,
        created_at,
        updated_at;
    `;

    const values: (string | number | null)[] = [
      projectData.nombre || null,
      projectData.descripcion || null,
      formatDateForPostgres(projectData.fecha_inicio_proyecto),
      formatDateForPostgres(projectData.fecha_inicio_desarrollo),
      formatDateForPostgres(projectData.fecha_fin_desarrollo),
      formatDateForPostgres(projectData.fecha_inicio_pruebas),
      formatDateForPostgres(projectData.fecha_fin_pruebas),
      formatDateForPostgres(projectData.fecha_go_live_planeado),
      formatDateForPostgres(projectData.fecha_go_live_real), // ← CRÍTICO
      parseFloat(projectData.avance?.toString() || '0') || 0,
      parseFloat(projectData.presupuesto_total?.toString() || '0') || 0,
      projectData.company_id || null,
      projectData.portfolio_id || null,
      projectData.gerente_asignado_id || null,
      projectData.lider_asignado_id || null,
      parseInt(projectId)
    ];

    console.log('🚀 Ejecutando UPDATE con valores:', values);

    const result = await pool.query(updateQuery, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    const updatedProject = result.rows[0];
    console.log('✅ Proyecto actualizado exitosamente:', updatedProject);
    
    // Formatear fechas para respuesta (evitar timezone issues)
    const formatDateForResponse = (date: any): string | null => {
      if (!date) return null;
      if (date instanceof Date) {
        return date.toISOString().split('T')[0];
      }
      return date;
    };

    const responseProject = {
      ...updatedProject,
      fecha_inicio_proyecto: formatDateForResponse(updatedProject.fecha_inicio_proyecto),
      fecha_inicio_desarrollo: formatDateForResponse(updatedProject.fecha_inicio_desarrollo),
      fecha_fin_desarrollo: formatDateForResponse(updatedProject.fecha_fin_desarrollo),
      fecha_inicio_pruebas: formatDateForResponse(updatedProject.fecha_inicio_pruebas),
      fecha_fin_pruebas: formatDateForResponse(updatedProject.fecha_fin_pruebas),
      fecha_go_live_planeado: formatDateForResponse(updatedProject.fecha_go_live_planeado),
      fecha_go_live_real: formatDateForResponse(updatedProject.fecha_go_live_real)
    };

    console.log('📤 Respuesta formateada:', responseProject);

    res.json({
      message: 'Proyecto actualizado exitosamente',
      project: responseProject
    });

  } catch (error: any) {
    console.error('❌ Error al actualizar proyecto:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/projects - Crear nuevo proyecto
router.post('/', async (req, res) => {
  try {
    const projectData: ProjectData = req.body;
    
    const insertQuery = `
      INSERT INTO projects (
        nombre, descripcion, fecha_inicio_proyecto, fecha_inicio_desarrollo,
        fecha_fin_desarrollo, fecha_inicio_pruebas, fecha_fin_pruebas,
        fecha_go_live_planeado, fecha_go_live_real, avance, presupuesto_total,
        company_id, portfolio_id, gerente_asignado_id, lider_asignado_id,
        created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const values: (string | number | null)[] = [
      projectData.nombre || null,
      projectData.descripcion || null,
      projectData.fecha_inicio_proyecto || null,
      projectData.fecha_inicio_desarrollo || null,
      projectData.fecha_fin_desarrollo || null,
      projectData.fecha_inicio_pruebas || null,
      projectData.fecha_fin_pruebas || null,
      projectData.fecha_go_live_planeado || null,
      projectData.fecha_go_live_real || null,
      parseFloat(projectData.avance?.toString() || '0') || 0,
      parseFloat(projectData.presupuesto_total?.toString() || '0') || 0,
      projectData.company_id || null,
      projectData.portfolio_id || null,
      projectData.gerente_asignado_id || null,
      projectData.lider_asignado_id || null,
      (req as any).user?.sub || null // Usuario que crea el proyecto
    ];

    const result = await pool.query(insertQuery, values);
    
    res.status(201).json({
      message: 'Proyecto creado exitosamente',
      project: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// DELETE /api/projects/:id - Eliminar proyecto
router.delete('/:id', async (req, res) => {
  try {
    const projectId: string = req.params.id;
    
    const deleteQuery = 'DELETE FROM projects WHERE id = $1 RETURNING *';
    const result = await pool.query(deleteQuery, [projectId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    res.json({
      message: 'Proyecto eliminado exitosamente',
      project: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error al eliminar proyecto:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

export default router;
