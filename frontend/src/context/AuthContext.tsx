import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useMsal } from '@azure/msal-react'
import { loginRequest, DEV_MODE } from '@/lib/msal'
import { api, removeAuthToken } from '@/lib/api'

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID || ''

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
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // ── Cargar usuario ────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadUser() {
      try {
        if (DEV_MODE) {
          const me = await api.get('/api/auth/me')
          setUser(me.user)
          // Store perms for PortfolioContext filtering
          sessionStorage.setItem('user_perms', JSON.stringify({
            companyIds: me.user.companyIds || [],
            portfolioIds: me.user.portfolioIds || [],
          }))
        } else if (accounts.length > 0) {
          // Producción: obtener token de Enterprise App y sincronizar con backend
          const result = await instance.acquireTokenSilent({
            scopes: ['openid', 'profile', 'email'],
            account: accounts[0],
          })
          sessionStorage.setItem('msal_token', result.idToken)
          await api.post('/api/auth/sync', {})
          const me = await api.get('/api/auth/me')
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
      // ✅ CORREGIDO: El devSignIn ahora guarda el token automáticamente
      try {
        const result = await api.devSignIn()
        if (result.success) {
          setUser(result.user)
          // Store perms for PortfolioContext filtering
          sessionStorage.setItem('user_perms', JSON.stringify({
            companyIds: result.user.companyIds || [],
            portfolioIds: result.user.portfolioIds || [],
          }))
          console.log('🔐 Login completo con token guardado');
        }
      } catch (err) {
        console.error('Error en dev signIn:', err)
      }
      return
    }
    await instance.loginRedirect(loginRequest)
  }

  const signOut = async () => {
    // ✅ CORREGIDO: También limpiar el auth_token
    sessionStorage.removeItem('msal_token')
    sessionStorage.removeItem('user_perms')
    removeAuthToken() // Limpia localStorage.auth_token
    setUser(null)
    if (!DEV_MODE) await instance.logoutRedirect()
  }

  const isAdmin = user?.role === 'admin'
  const isDirector = user?.role === 'director'
  const isGerente = user?.role === 'gerente'
  const isLider = user?.role === 'lider'
  const isManager = ['admin', 'director', 'gerente'].includes(user?.role || '')
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