import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useMsal } from '@azure/msal-react'
import { loginRequest, DEV_MODE } from '@/lib/msal'
import { api } from '@/lib/api'

export type AppRole = 'admin' | 'director' | 'gerente' | 'lider' | 'usuario' | 'pending'

interface AuthUser {
  id: string
  email: string
  displayName: string
  avatarUrl?: string
  role: AppRole
  modules: string[]
  companyIds: string[]
  portfolioIds: string[]
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  isAdmin: boolean
  isDirector: boolean
  isGerente: boolean
  isLider: boolean
  isManager: boolean
  isApproved: boolean
  hasModuleAccess: (mod: string) => boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { instance, accounts } = useMsal()
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // ── Cargar usuario ────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadUser() {
      try {
        if (DEV_MODE) {
          const me = await api.get<{ user: AuthUser }>('/api/auth/me')
          setUser(me.user)
          // Store perms for PortfolioContext filtering
          sessionStorage.setItem('user_perms', JSON.stringify({
            companyIds: me.user.companyIds || [],
            portfolioIds: me.user.portfolioIds || [],
          }))
        } else if (accounts.length > 0) {
          // Producción: obtener token de Enterprise App y sincronizar con backend
          const result = await instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0],
          })
          sessionStorage.setItem('msal_token', result.accessToken)
          await api.post('/api/auth/sync', {})
          const me = await api.get<{ user: AuthUser }>('/api/auth/me')
          setUser(me.user)
          sessionStorage.setItem('user_perms', JSON.stringify({
            companyIds: me.user.companyIds || [],
            portfolioIds: me.user.portfolioIds || [],
          }))
        }
      } catch (err) {
        console.error('Error cargando usuario:', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [accounts, instance])

  const signIn = async () => {
    if (DEV_MODE) {
      // En dev mode, recargar el usuario del backend (toma el rol del header X-Dev-Role)
      try {
        const me = await api.get<{ user: AuthUser }>('/api/auth/me')
        setUser(me.user)
      } catch (err) {
        console.error('Error en dev signIn:', err)
      }
      return
    }
    await instance.loginRedirect(loginRequest)
  }

  const signOut = async () => {
    sessionStorage.removeItem('msal_token')
    setUser(null)
    if (!DEV_MODE) await instance.logoutRedirect()
  }

  const isAdmin    = user?.role === 'admin'
  const isDirector = user?.role === 'director'
  const isGerente  = user?.role === 'gerente'
  const isLider    = user?.role === 'lider'
  const isManager  = ['admin', 'director', 'gerente'].includes(user?.role || '')
  const isApproved = !!user && user.role !== 'pending'

  const hasModuleAccess = (mod: string) => {
    if (isAdmin) return true
    return user?.modules.includes(mod) ?? false
  }

  return (
    <AuthContext.Provider value={{
      user, loading,
      isAdmin, isDirector, isGerente, isLider, isManager, isApproved,
      hasModuleAccess, signIn, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
