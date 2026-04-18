// ========================================
// API CONFIGURATION - PMO PORTAL
// INCLUYE MANEJO AUTOMÁTICO DE JWT TOKENS
// ========================================

const getAPIURL = (): string => {
  if (import.meta.env.VITE_API_URL) {
    console.log('🔧 API_URL desde VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    console.log('🔧 API_URL desde window.location.origin:', origin);
    return origin;
  }
  
  const fallback = 'http://localhost:3000';
  console.log('🔧 API_URL usando fallback:', fallback);
  return fallback;
};

// ========================================
// TOKEN MANAGEMENT
// ========================================

const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
  console.log('🔐 Token guardado en localStorage');
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token');
  console.log('🔐 Token eliminado del localStorage');
};

export const hasAuthToken = (): boolean => {
  return !!getAuthToken();
};

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

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

export const buildAPIURL = (endpoint: string): string => {
  const baseURL = API_CONFIG.BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseURL}${cleanEndpoint}`;
};

export const apiClient = {
  async get(endpoint: string, options: RequestInit = {}) {
    const url = buildAPIURL(endpoint);
    console.log('🔍 GET:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      },
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
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      },
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
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      },
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
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      },
      ...options
    });
    
    console.log('📡 DELETE Response:', response.status, url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
};

export const api = {
  get: apiClient.get,
  post: apiClient.post,
  put: apiClient.put,
  delete: apiClient.delete,

  async devSignIn() {
    try {
      console.log('🔧 Ejecutando dev signIn...');
      const response = await this.post('/api/auth/dev-signin');
      console.log('✅ Dev signIn exitoso:', response);
      
      // ✅ GUARDAR TOKEN AUTOMÁTICAMENTE
      if (response.token) {
        setAuthToken(response.token);
        console.log('🔐 Token guardado automáticamente');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error en dev signIn:', error);
      throw error;
    }
  }
};

export const projectAPI = {
  async getAll() {
    return api.get(API_CONFIG.ENDPOINTS.PROJECTS);
  },
  async getById(id: string | number) {
    return api.get(`${API_CONFIG.ENDPOINTS.PROJECTS}/${id}`);
  },
  async create(projectData: any) {
    return api.post(API_CONFIG.ENDPOINTS.PROJECTS, projectData);
  },
  async update(id: string | number, projectData: any) {
    return api.put(`${API_CONFIG.ENDPOINTS.PROJECTS}/${id}`, projectData);
  },
  async delete(id: string | number) {
    return api.delete(`${API_CONFIG.ENDPOINTS.PROJECTS}/${id}`);
  }
};

export const getDevRole = (): string => {
  return sessionStorage.getItem('dev_role') || 'admin';
};

export const setDevRole = (role: string): void => {
  sessionStorage.setItem('dev_role', role);
  console.log('🔧 Dev role set to:', role);
};

export const debugAPI = {
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

  showConfig() {
    console.log('🔧 API Configuration:');
    console.log('  BASE_URL:', API_CONFIG.BASE_URL);
    console.log('  VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('  window.location.origin:', typeof window !== 'undefined' ? window.location.origin : 'N/A');
    console.log('  ENDPOINTS:', API_CONFIG.ENDPOINTS);
    console.log('  HAS_TOKEN:', hasAuthToken());
  },

  showTokenInfo() {
    const token = getAuthToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔐 Token Info:');
        console.log('  User ID:', payload.id);
        console.log('  Role:', payload.role);
        console.log('  Expires:', new Date(payload.exp * 1000));
        console.log('  Valid:', payload.exp * 1000 > Date.now());
      } catch (error) {
        console.log('🔐 Token presente pero no decodificable');
      }
    } else {
      console.log('🔐 No hay token guardado');
    }
  }
};

export default API_CONFIG;

export {
  apiClient as client,
  debugAPI as debug
};