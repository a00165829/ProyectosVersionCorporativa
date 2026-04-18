/**
 * Configuración inteligente del API_URL que funciona en:
 * - Desarrollo local (localhost:5173)
 * - Producción Azure (proyectosit.axtel.com.mx)
 * - Build environments
 */

const getApiUrl = (): string => {
  // 1. Override manual para debug (solo en desarrollo)
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('API_URL_OVERRIDE');
    if (override && import.meta.env.DEV) {
      console.log('🔧 Usando API_URL override:', override);
      return override;
    }
  }

  // 2. Variable de entorno (funciona en build time)
  if (import.meta.env.VITE_API_URL) {
    console.log('📦 Usando VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }

  // 3. Detección automática según el hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Producción Azure - mismo dominio para frontend y backend
    if (hostname === 'proyectosit.axtel.com.mx') {
      console.log('🏢 Modo producción Azure detectado');
      return `https://${hostname}`;
    }
    
    // Otros dominios de producción (si tienes múltiples)
    if (hostname.endsWith('.azurewebsites.net')) {
      console.log('☁️ Azure Web App detectado');
      return `https://${hostname}`;
    }
  }

  // 4. Fallback para desarrollo local
  console.log('🏠 Usando API_URL de desarrollo local');
  return 'http://localhost:3000';
};

// Exportar la URL configurada
export const API_URL = getApiUrl();

// Log de configuración para debug
console.log('🌐 API_URL configurado:', API_URL);
console.log('🔍 Environment:', {
  NODE_ENV: import.meta.env.MODE,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR'
});

/**
 * Helper para hacer fetch con configuración automática
 */
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Agregar token automáticamente si existe
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  console.log(`📡 ${options.method || 'GET'} ${url}`);

  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ API Error ${response.status}:`, errorText);
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response;
};

/**
 * Helpers específicos para proyectos
 */
export const projectsApi = {
  // Obtener todos los proyectos
  getAll: () => apiRequest('/api/projects'),
  
  // Obtener un proyecto específico
  getById: (id: string | number) => apiRequest(`/api/projects/${id}`),
  
  // Actualizar un proyecto
  update: (id: string | number, data: any) => 
    apiRequest(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Crear un proyecto
  create: (data: any) =>
    apiRequest('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Eliminar un proyecto
  delete: (id: string | number) =>
    apiRequest(`/api/projects/${id}`, {
      method: 'DELETE',
    }),
};

// Export default para compatibilidad
export default {
  API_URL,
  apiRequest,
  projectsApi,
};
