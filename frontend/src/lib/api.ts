// ========================================
// API CONFIGURATION - PMO PORTAL
// Fix para detección automática de API_URL
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
    return response;
  },

  async post(endpoint: string, data: any, options: RequestInit = {}) {
    const url = buildAPIURL(endpoint);
    console.log('🔍 POST:', url, data);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify(data),
      ...options
    });
    
    console.log('📡 POST Response:', response.status, url);
    return response;
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
    return response;
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
    return response;
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
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.PROJECTS);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Obtener un proyecto por ID
   */
  async getById(id: string | number) {
    const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.PROJECTS}/${id}`);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Crear nuevo proyecto
   */
  async create(projectData: any) {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.PROJECTS, projectData);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    return response.json();
  },

  /**
   * Actualizar proyecto existente
   */
  async update(id: string | number, projectData: any) {
    const response = await apiClient.put(`${API_CONFIG.ENDPOINTS.PROJECTS}/${id}`, projectData);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    return response.json();
  },

  /**
   * Eliminar proyecto
   */
  async delete(id: string | number) {
    const response = await apiClient.delete(`${API_CONFIG.ENDPOINTS.PROJECTS}/${id}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    return response.json();
  }
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
// EJEMPLOS DE USO
// ========================================

/*
// En componentes React:

import { projectAPI, debugAPI } from '@/lib/api';

// Para obtener proyectos:
const fetchProjects = async () => {
  try {
    const projects = await projectAPI.getAll();
    setProjects(projects);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Para actualizar proyecto:
const handleSave = async (projectData) => {
  try {
    const result = await projectAPI.update(project.id, projectData);
    console.log('Proyecto actualizado:', result);
    await fetchProjects(); // Refresh
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Para debug (ejecutar en consola):
debugAPI.showConfig();
debugAPI.testConnection();

*/

// ========================================
// EXPORT POR DEFECTO
// ========================================

export default API_CONFIG;