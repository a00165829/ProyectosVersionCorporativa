// ========================================
// API CONFIGURATION - PMO PORTAL
// Fix para detección automática de API_URL y compatibilidad de exports
// ========================================

/**
 * Detecta automáticamente la URL de la API basada en el entorno
 * Prioridad: VITE_API_URL > window.location.origin > localhost
 */
const getAPIURL = (): string => {
  // 1. Prioridad: Variable de entorno (para producción)
  if (import.meta.env.VITE_API_URL) {
    console.log('🔧 API_URL desde VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  // 2. Si estamos en el navegador, usar el origin actual
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    console.log('🔧 API_URL desde window.location.origin:', origin);
    return origin;
  }
  
  // 3. Fallback para desarrollo
  const fallback = 'http://localhost:3000';
  console.log('🔧 API_URL usando fallback:', fallback);
  return fallback;
};

// ✅ CONFIGURACIÓN GLOBAL
export const API_CONFIG = {
  BASE_URL: getAPIURL(),
  ENDPOINTS: {
    PROJECTS: '/api/projects',
    COMPANIES: '/api/companies',
    PORTFOLIOS: '/api/portfolios',
    PROFILES: '/api/profiles',
    AUTH: '/api/auth'
  },
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
} as const;

/**
 * Helper para construir URLs de API completas
 */
export const buildAPIURL = (endpoint: string): string => {
  const baseURL = API_CONFIG.BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseURL}${cleanEndpoint}`;
};

/**
 * Wrapper para fetch con configuración automática
 */
export const apiClient = {
  async get(endpoint: string, options: RequestInit = {}) {
    const url = buildAPIURL(endpoint);
    console.log('🔍 GET:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: API_CONFIG.HEADERS,
      ...options
    });
    
    console.log('📡 GET Response:', response.status, url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  async post(endpoint: string, data: any = {}, options: RequestInit = {}) {
    const url = buildAPIURL(endpoint);
    console.log('🔍 POST:', url, data);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify(data),
      ...options
    });
    
    console.log('📡 POST Response:', response.status, url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  async put(endpoint: string, data: any, options: RequestInit = {}) {
    const url = buildAPIURL(endpoint);
    console.log('🔍 PUT:', url, data);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify(data),
      ...options
    });
    
    console.log('📡 PUT Response:', response.status, url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  async delete(endpoint: string, options: RequestInit = {}) {
    const url = buildAPIURL(endpoint);
    console.log('🔍 DELETE:', url);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: API_CONFIG.HEADERS,
      ...options
    });
    
    console.log('📡 DELETE Response:', response.status, url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
};

// ========================================
// API COMPATIBLE CON IMPORTS EXISTENTES
// ========================================

// Crear objeto 'api' que sea compatible con todos los imports { api }
export const api = {
  // Métodos HTTP básicos
  get: apiClient.get,
  post: apiClient.post,
  put: apiClient.put,
  delete: apiClient.delete,

  // Método de conveniencia para desarrollo con signIn
  async devSignIn() {
    try {
      console.log('🔧 Ejecutando dev signIn...');
      const response = await this.post('/api/auth/dev-signin');
      console.log('✅ Dev signIn exitoso:', response);
      return response;
    } catch (error) {
      console.error('❌ Error en dev signIn:', error);
      throw error;
    }
  }
};

// ========================================
// FUNCIONES ESPECÍFICAS PARA PROYECTOS
// ========================================

export const projectAPI = {
  /**
   * Obtener todos los proyectos
   */
  async getAll() {
    return api.get(API_CONFIG.ENDPOINTS.PROJECTS);
  },

  /**
   * Obtener un proyecto por ID
   */
  async getById(id: string | number) {
    return api.get(`${API_CONFIG.ENDPOINTS.PROJECTS}/${id}`);
  },

  /**
   * Crear nuevo proyecto
   */
  async create(projectData: any) {
    return api.post(API_CONFIG.ENDPOINTS.PROJECTS, projectData);
  },

  /**
   * Actualizar proyecto existente
   */
  async update(id: string | number, projectData: any) {
    return api.put(`${API_CONFIG.ENDPOINTS.PROJECTS}/${id}`, projectData);
  },

  /**
   * Eliminar proyecto
   */
  async delete(id: string | number) {
    return api.delete(`${API_CONFIG.ENDPOINTS.PROJECTS}/${id}`);
  }
};

// ========================================
// FUNCIONES DE DESARROLLO
// ========================================

export const getDevRole = (): string => {
  return sessionStorage.getItem('dev_role') || 'admin';
};

export const setDevRole = (role: string): void => {
  sessionStorage.setItem('dev_role', role);
  console.log('🔧 Dev role set to:', role);
};

// ========================================
// DIAGNÓSTICO Y DEBUG
// ========================================

export const debugAPI = {
  /**
   * Verificar conectividad con el backend
   */
  async testConnection() {
    try {
      console.log('🔧 Probando conectividad con:', API_CONFIG.BASE_URL);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      console.log('📡 Health check response:', response.status);
      return {
        success: response.ok,
        status: response.status,
        url: API_CONFIG.BASE_URL
      };
    } catch (error) {
      console.error('❌ Error en conexión:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        url: API_CONFIG.BASE_URL
      };
    }
  },

  /**
   * Mostrar configuración actual
   */
  showConfig() {
    console.log('🔧 API Configuration:');
    console.log('  BASE_URL:', API_CONFIG.BASE_URL);
    console.log('  VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('  window.location.origin:', typeof window !== 'undefined' ? window.location.origin : 'N/A');
    console.log('  ENDPOINTS:', API_CONFIG.ENDPOINTS);
  }
};

// ========================================
// EXPORTS - SIN DUPLICADOS
// ========================================

// Solo UN export default
export default API_CONFIG;

// Todos los exports nombrados para compatibilidad con imports { api }
export {
  apiClient as client,
  debugAPI as debug
};