import React, { useState, useEffect } from 'react';

interface Project {
  id?: number;
  nombre: string;
  descripcion: string;
  company_id?: number;
  portfolio_id?: number;
  gerente_asignado_id?: string;
  lider_asignado_id?: string;
  presupuesto_total?: number;
  fecha_inicio_proyecto?: string;
  fecha_inicio_desarrollo?: string;
  fecha_fin_desarrollo?: string;
  fecha_inicio_pruebas?: string;
  fecha_fin_pruebas?: string;
  fecha_go_live_planeado?: string;
  fecha_go_live_real?: string;
}

interface ProjectFormDialogProps {
  project?: Project;
  portfolioId: string;
  onClose?: () => void;
  onSave?: (project: Project) => void;
}

export default function ProjectFormDialog({ 
  project, 
  portfolioId, 
  onClose, 
  onSave 
}: ProjectFormDialogProps) {
  const [formData, setFormData] = useState<Project>({
    nombre: '',
    descripcion: '',
    company_id: undefined,
    portfolio_id: parseInt(portfolioId) || undefined,
    gerente_asignado_id: '',
    lider_asignado_id: '',
    presupuesto_total: 0,
    fecha_inicio_proyecto: '',
    fecha_inicio_desarrollo: '',
    fecha_fin_desarrollo: '',
    fecha_inicio_pruebas: '',
    fecha_fin_pruebas: '',
    fecha_go_live_planeado: '',
    fecha_go_live_real: '',
    ...project
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
    if (onClose) {
      onClose();
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px'
  };

  const buttonStyle = {
    padding: '10px 20px',
    margin: '5px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ marginBottom: '20px' }}>
          {project?.id ? 'Editar Proyecto' : 'Nuevo Proyecto'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Nombre del Proyecto
            </label>
            <input
              type="text"
              style={inputStyle}
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Descripción
            </label>
            <textarea
              style={{ ...inputStyle, height: '80px' }}
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Presupuesto Total
            </label>
            <input
              type="number"
              style={inputStyle}
              value={formData.presupuesto_total || ''}
              onChange={(e) => handleInputChange('presupuesto_total', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Fecha Inicio Proyecto
            </label>
            <input
              type="date"
              style={inputStyle}
              value={formData.fecha_inicio_proyecto}
              onChange={(e) => handleInputChange('fecha_inicio_proyecto', e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Fecha Go Live Planeado
            </label>
            <input
              type="date"
              style={inputStyle}
              value={formData.fecha_go_live_planeado}
              onChange={(e) => handleInputChange('fecha_go_live_planeado', e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                ...buttonStyle,
                backgroundColor: '#f5f5f5',
                color: '#333'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                ...buttonStyle,
                backgroundColor: '#007bff',
                color: 'white'
              }}
            >
              {project?.id ? 'Guardar Cambios' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}