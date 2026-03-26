import { useAuth } from '@/context/AuthContext'
import { DEV_MODE } from '@/lib/msal'
import { Building2, Loader2, Shield, ArrowRight } from 'lucide-react'

export default function Login() {
  const { signIn, loading } = useAuth()

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, hsl(215 45% 10%), hsl(210 50% 18%), hsl(215 45% 12%))' }}>
      {/* Left — Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, hsl(185 80% 50%), transparent 70%)' }}/>
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, hsl(210 100% 50%), transparent 70%)' }}/>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(185 80% 50%), hsl(210 100% 45%))' }}>
              <Building2 className="h-5 w-5 text-white"/>
            </div>
            <span className="font-bold text-lg">PMO Portal</span>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            Gestión inteligente<br/>
            de portafolios<br/>
            <span style={{ color: 'hsl(185 80% 55%)' }}>y proyectos</span>
          </h1>
          <p className="text-white/50 text-lg max-w-md leading-relaxed">
            Planeación, recursos y control presupuestal en una sola plataforma corporativa.
          </p>
        </div>

        <p className="text-white/30 text-xs">
          © {new Date().getFullYear()} Portal de Portafolio y Proyectos
        </p>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(185 80% 50%), hsl(210 100% 45%))' }}>
              <Building2 className="h-5 w-5 text-white"/>
            </div>
            <span className="font-bold text-lg text-white">PMO Portal</span>
          </div>

          <div className="bg-card rounded-2xl shadow-2xl p-8 border border-white/10">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-foreground">Iniciar sesión</h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                Accede con tu cuenta corporativa
              </p>
            </div>

            {DEV_MODE && (
              <div className="mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex gap-2.5">
                <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Modo desarrollo</strong> — Enterprise Application no configurada.
                  Entrarás como administrador automáticamente.
                </span>
              </div>
            )}

            <button
              onClick={signIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3.5 font-semibold text-sm text-white transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, hsl(185 80% 42%), hsl(210 100% 40%))' }}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : DEV_MODE ? (
                <>
                  <Shield className="h-4 w-4" />
                  Entrar como Admin (Dev)
                  <ArrowRight className="h-4 w-4 ml-auto"/>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 21 21" fill="none">
                    <rect x="1"  y="1"  width="9" height="9" fill="#F25022"/>
                    <rect x="11" y="1"  width="9" height="9" fill="#7FBA00"/>
                    <rect x="1"  y="11" width="9" height="9" fill="#00A4EF"/>
                    <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                  </svg>
                  Iniciar sesión con cuenta corporativa
                  <ArrowRight className="h-4 w-4 ml-auto"/>
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-muted-foreground mt-6 leading-relaxed">
              Acceso restringido a usuarios autorizados.<br/>
              Contacta a tu administrador si necesitas acceso.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
