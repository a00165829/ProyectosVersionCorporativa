import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { usePortfolio } from '@/context/PortfolioContext'
import { Loader2, AlertTriangle } from 'lucide-react'

interface Workload {
  id: string; name: string; email: string|null
  project_count: string; assignment_count: string; total_days: string
  max_allocation: string; has_overlap: boolean
}

export default function ResourceWorkload() {
  const { activePortfolioId, activePortfolio } = usePortfolio()

  const { data: workload=[], isLoading } = useQuery<Workload[]>({
    queryKey: ['workload', activePortfolioId],
    queryFn: () => api.get(`/api/assignments/workload?portfolio_id=${activePortfolioId}`),
    enabled: !!activePortfolioId,
  })

  const active = workload.filter(w => parseInt(w.assignment_count) > 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Carga de Trabajo</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{activePortfolio?.name} — {active.length} recursos con asignaciones</p>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>
        ) : active.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No hay recursos con asignaciones</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Recurso</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                  <th className="text-center px-5 py-3 font-medium text-muted-foreground">Proyectos</th>
                  <th className="text-center px-5 py-3 font-medium text-muted-foreground">Días totales</th>
                  <th className="text-center px-5 py-3 font-medium text-muted-foreground">Ocupación</th>
                  <th className="text-center px-5 py-3 font-medium text-muted-foreground">Solapamiento</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {active.map(w => {
                  const maxAlloc = parseInt(w.max_allocation)
                  return (
                    <tr key={w.id} className={`hover:bg-muted/30 transition-colors ${w.has_overlap?'bg-red-50':''}`}>
                      <td className="px-5 py-3.5 font-medium">{w.name}</td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{w.email||'—'}</td>
                      <td className="px-5 py-3.5 text-center">{w.project_count}</td>
                      <td className="px-5 py-3.5 text-center">{w.total_days}</td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full ${maxAlloc>=80?'bg-red-500':maxAlloc>=50?'bg-amber-500':'bg-green-500'}`}
                              style={{width:`${Math.min(100,maxAlloc)}%`}}/>
                          </div>
                          <span className="text-xs w-8">{maxAlloc}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {w.has_overlap ? <AlertTriangle className="h-4 w-4 text-red-500 inline"/> : <span className="text-green-600">✓</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
