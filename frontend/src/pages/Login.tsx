import { useAuth } from '@/context/AuthContext'
import { DEV_MODE } from '@/lib/msal'
import { Building2, Loader2, Shield } from 'lucide-react'

export default function Login() {
  const { signIn, loading } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-card border rounded-2xl shadow-lg p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mb-4">
              <Building2 className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">PMO Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sistema de gestión de proyectos
            </p>
          </div>

          {/* Dev mode notice */}
          {DEV_MODE && (
            <div className="mb-6 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex gap-2">
              <Shield className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>Modo desarrollo:</strong> Azure AD no configurado.
                Entrarás como administrador automáticamente.
              </span>
            </div>
          )}

          {/* Sign in button */}
          <button
            onClick={signIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-lg px-4 py-3 font-medium text-sm transition-colors"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : DEV_MODE ? (
              <>
                <Shield className="h-4 w-4" />
                Entrar como Admin (Dev)
              </>
            ) : (
              <>
                {/* Microsoft logo */}
                <svg className="h-4 w-4" viewBox="0 0 21 21" fill="none">
                  <rect x="1"  y="1"  width="9" height="9" fill="#F25022"/>
                  <rect x="11" y="1"  width="9" height="9" fill="#7FBA00"/>
                  <rect x="1"  y="11" width="9" height="9" fill="#00A4EF"/>
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                </svg>
                Iniciar sesión con cuenta corporativa
              </>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Acceso restringido a usuarios autorizados.<br />
            Contacta a tu administrador si necesitas acceso.
          </p>
        </div>
      </div>
    </div>
  )
}
