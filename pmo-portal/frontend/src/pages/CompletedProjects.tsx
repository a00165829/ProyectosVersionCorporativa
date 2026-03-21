import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { usePortfolio } from '@/context/PortfolioContext'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import type { Project } from './ProjectsList'

const fmt = (d: string | null) => d
  ? new Date(d).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' })
  : '—'

export default function CompletedProjects() {
  const { activePortfolioId, activePortfolio } = usePortfolio()

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects', activePortfolioId],
    queryFn: () => api.get<Project[]>(`/api/projects?portfolio_id=${activePortfolioId}`),
    enabled: !!activePortfolioId,
    select: data => data.filter(p => p.scrum_stage === 'Completado' && !p.deleted_at),
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Proyectos Completados</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{activePortfolio?.name} — {projects.length} proyectos</p>
      </div>
      <div className="bg-card border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent"/>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mb-3 opacity-30"/>
            <p className="text-sm">No hay proyectos completados</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Proyecto</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Líder</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Go-Live real</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Avance</th>
                <th className="w-10"/>
              </tr>
            </thead>
            <tbody className="divide-y">
              {projects.map(p => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.name}</span>
                      {p.classification && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          p.classification==='Proyecto'?'bg-primary/10 text-primary':'bg-secondary text-secondary-foreground'
                        }`}>{p.classification==='Proyecto'?'P':'M'}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{p.responsible_name||'—'}</td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell">{fmt(p.go_live_date)}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700">
                      100% ✓
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
    </div>
  )
}
