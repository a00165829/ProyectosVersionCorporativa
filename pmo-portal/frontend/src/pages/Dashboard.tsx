import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { usePortfolio } from '@/context/PortfolioContext'
import { FolderKanban, CheckCircle2, TrendingUp, PauseCircle, AlertCircle } from 'lucide-react'

interface Project {
  id: string; name: string; scrum_stage: string; description: string
  go_live_date: string | null; planned_go_live_date: string | null
  progress: number; classification: string; responsible_name: string | null
}

const STAGE_COLOR: Record<string, string> = {
  'Backlog':'bg-gray-100 text-gray-600','Análisis / Diseño':'bg-blue-100 text-blue-700',
  'Sprint Planning':'bg-blue-100 text-blue-700','En Desarrollo':'bg-indigo-100 text-indigo-700',
  'Code Review':'bg-purple-100 text-purple-700','QA / Pruebas':'bg-amber-100 text-amber-700',
  'UAT':'bg-amber-100 text-amber-700','Pre-Producción':'bg-orange-100 text-orange-700',
  'Go Live':'bg-green-100 text-green-700','Completado':'bg-green-100 text-green-700',
  'Cancelado':'bg-red-100 text-red-700',
}

export default function Dashboard() {
  const { user } = useAuth()
  const { activePortfolioId, activePortfolio } = usePortfolio()

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects', activePortfolioId],
    queryFn: () => api.get<Project[]>(`/api/projects?portfolio_id=${activePortfolioId}`),
    enabled: !!activePortfolioId,
  })

  const active    = projects.filter(p => p.scrum_stage !== 'Completado' && p.scrum_stage !== 'Cancelado')
  const desarrollo = projects.filter(p => p.scrum_stage === 'En Desarrollo').length
  const completados = projects.filter(p => p.scrum_stage === 'Completado').length
  const enRiesgo  = projects.filter(p => {
    if (!p.go_live_date || !p.planned_go_live_date) return false
    return new Date(p.go_live_date) > new Date(p.planned_go_live_date)
  }).length

  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-card border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )

  const avgProgress = active.length > 0
    ? Math.round(active.reduce((sum, p) => sum + (p.progress || 0), 0) / active.length)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {activePortfolio?.name} — Bienvenido, {user?.displayName}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total proyectos"  value={projects.length}  icon={FolderKanban}  color="bg-blue-50 text-blue-600" />
        <StatCard label="En desarrollo"    value={desarrollo}       icon={TrendingUp}    color="bg-indigo-50 text-indigo-600" />
        <StatCard label="Completados"      value={completados}      icon={CheckCircle2}  color="bg-green-50 text-green-600" />
        <StatCard label="En riesgo"        value={enRiesgo}         icon={AlertCircle}   color="bg-red-50 text-red-600" />
      </div>

      {/* Avance promedio */}
      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium">Avance promedio del portafolio</span>
          <span className="text-2xl font-bold text-primary">{avgProgress}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${avgProgress}%` }} />
        </div>
      </div>

      {/* Lista proyectos activos */}
      <div className="bg-card border rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold">Proyectos activos</h2>
          <a href="/projects" className="text-sm text-primary hover:underline">Ver todos</a>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : active.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FolderKanban className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">No hay proyectos activos</p>
          </div>
        ) : (
          <div className="divide-y">
            {active.slice(0, 8).map(p => (
              <a key={p.id} href={`/projects/${p.id}`}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    {p.classification && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        p.classification === 'Proyecto' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'
                      }`}>{p.classification === 'Proyecto' ? 'P' : 'M'}</span>
                    )}
                  </div>
                  {p.responsible_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">Líder: {p.responsible_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <div className="hidden sm:flex items-center gap-2 w-24">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${p.progress>=80?'bg-green-500':p.progress>=50?'bg-blue-500':p.progress>=25?'bg-amber-500':'bg-red-500'}`}
                        style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">{p.progress}%</span>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STAGE_COLOR[p.scrum_stage] || 'bg-gray-100 text-gray-600'}`}>
                    {p.scrum_stage}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
