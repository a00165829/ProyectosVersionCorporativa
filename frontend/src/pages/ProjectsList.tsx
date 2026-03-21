import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Link } from 'react-router-dom'
import { FolderKanban, ChevronRight, Plus } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface Project {
  id: string; name: string; stage: string; description: string
  dev_start_date: string | null; planned_go_live_date: string | null
}

const STAGE_COLOR: Record<string, string> = {
  'En Desarrollo': 'bg-blue-100 text-blue-700',
  'Completado':    'bg-green-100 text-green-700',
  'Cancelado':     'bg-red-100 text-red-700',
  'En Pausa':      'bg-amber-100 text-amber-700',
  'Por Iniciar':   'bg-purple-100 text-purple-700',
}

export default function ProjectsList() {
  const { isManager } = useAuth()

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('/api/projects?portfolio_id=33333333-0000-0000-0000-000000000001'),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proyectos</h1>
          <p className="text-sm text-muted-foreground mt-1">{projects.length} proyectos en el portafolio</p>
        </div>
        {isManager && (
          <button className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Nuevo proyecto
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FolderKanban className="h-12 w-12 mb-3 opacity-30" />
              <p>No hay proyectos registrados</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Inicio</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Go-Live planeado</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Etapa</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {projects.map(p => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link to={`/projects/${p.id}`} className="font-medium hover:text-primary transition-colors">
                        {p.name}
                      </Link>
                      {p.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                      {p.dev_start_date ? new Date(p.dev_start_date).toLocaleDateString('es-MX') : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell">
                      {p.planned_go_live_date ? new Date(p.planned_go_live_date).toLocaleDateString('es-MX') : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STAGE_COLOR[p.stage] || 'bg-gray-100 text-gray-700'}`}>
                        {p.stage}
                      </span>
                    </td>
                    <td className="pr-4">
                      <Link to={`/projects/${p.id}`}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
