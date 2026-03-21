import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { FolderKanban, CheckCircle2, Clock, PauseCircle, TrendingUp, AlertCircle } from 'lucide-react'

interface Project {
  id: string; name: string; stage: string; description: string
  go_live_date: string | null; planned_go_live_date: string | null
}

const STAGE_COLOR: Record<string, string> = {
  'En Desarrollo': 'bg-blue-100 text-blue-700',
  'Completado':    'bg-green-100 text-green-700',
  'Cancelado':     'bg-red-100 text-red-700',
  'En Pausa':      'bg-amber-100 text-amber-700',
  'Por Iniciar':   'bg-purple-100 text-purple-700',
}

export default function Dashboard() {
  const { user } = useAuth()

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects-dashboard'],
    queryFn: () => api.get<Project[]>('/api/projects?portfolio_id=33333333-0000-0000-0000-000000000001'),
  })

  const stats = {
    total:       projects.length,
    desarrollo:  projects.filter(p => p.stage === 'En Desarrollo').length,
    completados: projects.filter(p => p.stage === 'Completado').length,
    pausa:       projects.filter(p => p.stage === 'En Pausa').length,
    porIniciar:  projects.filter(p => p.stage === 'Por Iniciar').length,
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Bienvenido, {user?.displayName}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total proyectos"  value={stats.total}       icon={FolderKanban}  color="bg-blue-50 text-blue-600" />
        <StatCard label="En desarrollo"    value={stats.desarrollo}  icon={TrendingUp}    color="bg-indigo-50 text-indigo-600" />
        <StatCard label="Completados"      value={stats.completados} icon={CheckCircle2}  color="bg-green-50 text-green-600" />
        <StatCard label="En pausa"         value={stats.pausa}       icon={PauseCircle}   color="bg-amber-50 text-amber-600" />
      </div>

      {/* Projects list */}
      <div className="bg-card border rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold">Proyectos activos</h2>
          <a href="/projects" className="text-sm text-primary hover:underline">Ver todos</a>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FolderKanban className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">No hay proyectos registrados</p>
          </div>
        ) : (
          <div className="divide-y">
            {projects.filter(p => p.stage !== 'Completado' && p.stage !== 'Cancelado').map(project => (
              <a
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{project.name}</p>
                  {project.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{project.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4">
                  {project.planned_go_live_date && (
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      Go-live: {new Date(project.planned_go_live_date).toLocaleDateString('es-MX')}
                    </span>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STAGE_COLOR[project.stage] || 'bg-gray-100 text-gray-700'}`}>
                    {project.stage}
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
