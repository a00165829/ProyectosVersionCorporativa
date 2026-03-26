const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// En modo dev, el rol simulado se guarda en sessionStorage
export function getDevRole(): string {
  return sessionStorage.getItem('dev_role') || 'admin'
}

export function setDevRole(role: string) {
  sessionStorage.setItem('dev_role', role)
}

async function getToken(): Promise<string | null> {
  return sessionStorage.getItem('msal_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()
  const devRole = getDevRole()

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-Dev-Role': devRole,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Error en la petición')
  }
  return res.json()
}

export const api = {
  get:    <T>(path: string)                      => request<T>(path),
  post:   <T>(path: string, body: unknown)       => request<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)       => request<T>(path, { method: 'PUT',   body: JSON.stringify(body) }),
  delete: <T>(path: string, body?: unknown)      => request<T>(path, { method: 'DELETE', ...(body ? { body: JSON.stringify(body) } : {}) }),
}
