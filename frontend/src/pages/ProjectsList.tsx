import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Link } from 'react-router-dom'
import { FolderKanban, ChevronRight, Plus } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { usePortfolio } from '@/context/PortfolioContext'
import ProjectFormDialog from '@/components/projects/ProjectFormDialog'

export interface Project {
  id: string; name: string; scrum_stage: string; stage: string
  description: string; dev_start_date: string | null
  planned_go_live_date: string | null; go_live_date: string | null
  progress: number; classification: string; priority: number | null
  responsible_name: string | null; portfolio_id: string
  dev_end_date: string | null; test_start_date: string | null
  test_end_date: string | null; project_start_date: string | null
  deleted_at: string | null
}

const STAGE_COLOR: Record<string, string> = {
  'Backlog':'bg-gray-100 text-gray-600','Análisis / Diseño':'bg-blue-100 text-blue-700',
  'Sprint Planning':'bg-blue-100 text-blue-700','En Desarrollo':'bg-indigo-100 text-indigo-700',
  'Code Review':'bg-purple-100 text-purple-700','QA / Pruebas':'bg-amber-100 text-amber-700',
  'UAT':'bg-amber-100 text-amber-700','Pre-Producción':'bg-orange-100 text-orange-700',
  'Go Live':'bg-green-100 text-green-700','Completado':'bg-green-100 text-green-700',
  'Cancelado':'bg-red-100 text-red-700','En Pausa':'bg-orange-100 text-orange-700',
  'Por Iniciar':'bg-purple-100 text-purple-700',
}

const fmt = (d: string | null) => d
  ? new Date(d).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' })
  : '—'

export default function ProjectsList() {
  const { isManager } = useAuth()
  const { activePortfolioId, activePortfolio } = usePortfolio()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects', activePortfolioId],
    queryFn: () => api.get<Project[]>(`/api/projects?portfolio_id=${activePortfolioId}`),
    enabled: !!activePortfolioId,
  })

  const active = projects.filter(p => !p.deleted_at)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proyectos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activePortfolio?.name} — {active.length} proyectos activos
          </p>
        </div>
        {isManager && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4"/> Nuevo proyecto
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent"/>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          {active.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FolderKanban className="h-12 w-12 mb-3 opacity-30"/>
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
                  <th className="w-10"/>
                </tr>
              </thead>
              <tbody className="divide-y">
                {active.map(p => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Link to={`/projects/${p.id}`} className="font-medium hover:text-primary transition-colors">
                          {p.name}
                        </Link>
                        {p.classification && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            p.classification==='Proyecto'?'bg-primary/10 text-primary':'bg-secondary text-secondary-foreground'
                          }`}>{p.classification==='Proyecto'?'P':'M'}</span>
                        )}
                      </div>
                      {p.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{fmt(p.dev_start_date)}</td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell">{fmt(p.planned_go_live_date)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STAGE_COLOR[p.scrum_stage] || 'bg-gray-100 text-gray-700'}`}>
                        {p.scrum_stage}
                      </span>
                    </td>
                    <td className="pr-4">
                      <Link to={`/projects/${p.id}`}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground"/>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <ProjectFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        portfolioId={activePortfolioId || ''}
      />
    </div>
  )
}