import React, { useState, useEffect } from 'react';

interface Project {
  id?: number;
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

interface ProjectFormDialogProps {
  project?: Project;
  onClose: () => void;
  onProjectUpdated?: (project?: Project) => void;
}

const ProjectFormDialog: React.FC<ProjectFormDialogProps> = ({ 
  project, 
  onClose, 
  onProjectUpdated 
}) => {
  const [projectData, setProjectData] = useState<Project>(project || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // API_URL con fallback inteligente
  const getApiUrl = (): string => {
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    
    if (window.location.hostname === 'proyectosit.axtel.com.mx') {
      return 'https://proyectosit.axtel.com.mx';
    }
    
    return 'http://localhost:3000';
  };

  const API_URL = getApiUrl();

  // Función para formatear fechas correctamente (sin timezone shift)
  const formatDateForInput = (dateString?: string): string => {
    if (!dateString) return '';
    
    // Si es un Date object, convertir a string
    if (dateString instanceof Date) {
      return dateString.toISOString().split('T')[0];
    }
    
    // Si ya está en formato YYYY-MM-DD, mantener
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Si viene como timestamp o string de fecha, parsear cuidadosamente
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      console.warn('Error parseando fecha:', dateString, e);
    }
    
    return '';
  };

  // Función para formatear fechas para envío al backend
  const formatDateForAPI = (dateString?: string): string | null => {
    if (!dateString) return null;
    
    // Mantener formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    return dateString;
  };

  // Handler para guardar proyecto
  const handleSaveProject = async (): Promise<void> => {
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      console.log('💾 Guardando proyecto...');
      console.log('📝 Datos originales:', projectData);

      // Preparar datos para envío con fechas formateadas
      const dataToSend = {
        ...projectData,
        fecha_inicio_proyecto: formatDateForAPI(projectData.fecha_inicio_proyecto),
        fecha_inicio_desarrollo: formatDateForAPI(projectData.fecha_inicio_desarrollo),
        fecha_fin_desarrollo: formatDateForAPI(projectData.fecha_fin_desarrollo),
        fecha_inicio_pruebas: formatDateForAPI(projectData.fecha_inicio_pruebas),
        fecha_fin_pruebas: formatDateForAPI(projectData.fecha_fin_pruebas),
        fecha_go_live_planeado: formatDateForAPI(projectData.fecha_go_live_planeado),
        fecha_go_live_real: formatDateForAPI(projectData.fecha_go_live_real)
      };

      console.log('📤 Datos a enviar:', dataToSend);
      console.log('🎯 fecha_go_live_real:', dataToSend.fecha_go_live_real);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/projects/${project?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Proyecto guardado exitosamente:', result);

      // CRÍTICO: Actualizar el estado local con los datos frescos del servidor
      if (result.project) {
        console.log('🔄 Actualizando estado local...');
        setProjectData(prevData => ({
          ...prevData,
          ...result.project
        }));
      }

      // Notificar al componente padre que el proyecto se actualizó
      if (onProjectUpdated && typeof onProjectUpdated === 'function') {
        console.log('📢 Notificando al componente padre...');
        onProjectUpdated(result.project || projectData);
      }

      // Mostrar mensaje de éxito
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        // Opcional: cerrar modal después de guardar exitosamente
        if (onClose) {
          onClose();
        }
      }, 1500);

      console.log('🎉 Guardado completado exitosamente');

    } catch (error: any) {
      console.error('❌ Error al guardar proyecto:', error);
      setError(`Error al guardar el proyecto: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handler para cambios en los inputs
  const handleInputChange = (field: keyof Project, value: string | number): void => {
    console.log('📝 Cambio en campo:', field, '→', value);
    setProjectData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // useEffect para debug
  useEffect(() => {
    console.log('🔄 ProjectData actualizado:', projectData);
    console.log('📅 Fechas actuales:', {
      fecha_go_live_real: projectData.fecha_go_live_real,
      fecha_go_live_planeado: projectData.fecha_go_live_planeado
    });
  }, [projectData]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Editar proyecto</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Mensajes de estado */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            ✅ Proyecto actualizado exitosamente
          </div>
        )}

        {/* Formulario */}
        <div className="space-y-4">
          {/* Nombre del proyecto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del proyecto
            </label>
            <input
              type="text"
              value={projectData.nombre || ''}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={projectData.descripcion || ''}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fechas en grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inicio proyecto
              </label>
              <input
                type="date"
                value={formatDateForInput(projectData.fecha_inicio_proyecto)}
                onChange={(e) => handleInputChange('fecha_inicio_proyecto', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inicio desarrollo
              </label>
              <input
                type="date"
                value={formatDateForInput(projectData.fecha_inicio_desarrollo)}
                onChange={(e) => handleInputChange('fecha_inicio_desarrollo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fin desarrollo
              </label>
              <input
                type="date"
                value={formatDateForInput(projectData.fecha_fin_desarrollo)}
                onChange={(e) => handleInputChange('fecha_fin_desarrollo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inicio pruebas
              </label>
              <input
                type="date"
                value={formatDateForInput(projectData.fecha_inicio_pruebas)}
                onChange={(e) => handleInputChange('fecha_inicio_pruebas', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fin pruebas
              </label>
              <input
                type="date"
                value={formatDateForInput(projectData.fecha_fin_pruebas)}
                onChange={(e) => handleInputChange('fecha_fin_pruebas', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Go Live planeado
              </label>
              <input
                type="date"
                value={formatDateForInput(projectData.fecha_go_live_planeado)}
                onChange={(e) => handleInputChange('fecha_go_live_planeado', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Go Live Real - Campo crítico destacado */}
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <label className="block text-sm font-medium text-blue-700 mb-1">
              🎯 Go Live Real
            </label>
            <input
              type="date"
              value={formatDateForInput(projectData.fecha_go_live_real)}
              onChange={(e) => handleInputChange('fecha_go_live_real', e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <small className="text-blue-600 mt-1 block">
              Valor actual: {projectData.fecha_go_live_real || 'No asignado'}
            </small>
          </div>

          {/* Avance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Avance: {projectData.avance || 0}%
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="0"
                max="100"
                value={projectData.avance || 0}
                onChange={(e) => handleInputChange('avance', parseInt(e.target.value))}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => handleInputChange('avance', (projectData.avance || 0) + 5)}
                className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200"
              >
                +5%
              </button>
              <span className="text-lg font-semibold text-blue-600 min-w-[3rem]">
                {projectData.avance || 0}%
              </span>
            </div>
          </div>

          {/* Presupuesto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Presupuesto total
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={projectData.presupuesto_total || ''}
                onChange={(e) => handleInputChange('presupuesto_total', parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveProject}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Guardando...</span>
              </>
            ) : (
              <span>Guardar cambios</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectFormDialog;
