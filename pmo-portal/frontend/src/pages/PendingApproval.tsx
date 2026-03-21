import { useAuth } from '@/context/AuthContext'
import { Clock, LogOut, Building2 } from 'lucide-react'

export default function PendingApproval() {
  const { user, signOut } = useAuth()
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background px-4">
      <div className="w-full max-w-md bg-card border rounded-2xl shadow-lg p-8 text-center">
        <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Clock className="h-7 w-7 text-amber-600" />
        </div>
        <h1 className="text-xl font-bold mb-2">Cuenta pendiente de aprobación</h1>
        <p className="text-sm text-muted-foreground mb-2">
          Tu cuenta <strong>{user?.email}</strong> ha sido registrada correctamente.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Un administrador debe asignarte un rol antes de que puedas acceder al portal.
          Contacta a tu supervisor o al equipo de TI.
        </p>
        <button
          onClick={signOut}
          className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
