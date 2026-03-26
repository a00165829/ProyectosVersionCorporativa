import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { usePortfolio } from '@/context/PortfolioContext'
import { Loader2, DollarSign } from 'lucide-react'

interface ProjectCost {
  project_id: string; project_name: string; portfolio_name: string
  assignment_count: string; total_cost_usd: string; total_days: string
}

const num = (v: any) => parseFloat(String(v)) || 0
const fmtUSD = (n: number) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', minimumFractionDigits:2 }).format(n)

export default function ProjectCosts() {
  const { activePortfolioId, activePortfolio } = usePortfolio()

  const { data: costs=[], isLoading } = useQuery<ProjectCost[]>({
    queryKey: ['project-costs', activePortfolioId],
    queryFn: () => api.get(`/api/assignments/costs?portfolio_id=${activePortfolioId}`),
    enabled: !!activePortfolioId,
  })

  const totalCost = costs.reduce((s, c) => s + num(c.total_cost_usd), 0)
  const totalDays = costs.reduce((s, c) => s + num(c.total_days), 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Costo de Proyectos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{activePortfolio?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Costo total (USD)</p>
          <p className="text-2xl font-bold text-primary mt-1">{fmtUSD(totalCost)}</p>
        </div>
        <div className="bg-card border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Proyectos con recursos</p>
          <p className="text-2xl font-bold mt-1">{costs.length}</p>
        </div>
        <div className="bg-card border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Días-recurso totales</p>
          <p className="text-2xl font-bold mt-1">{totalDays}</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>
        ) : costs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <DollarSign className="h-10 w-10 mb-3 opacity-30"/><p className="text-sm">No hay costos calculados</p>
            <p className="text-xs mt-1">Asigna recursos a proyectos para ver el costo</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Proyecto</th>
                <th className="text-center px-5 py-3 font-medium text-muted-foreground">Asignaciones</th>
                <th className="text-center px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Días totales</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Costo (USD)</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">% del total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {costs.map(c => {
                const cost = num(c.total_cost_usd)
                const pct = totalCost > 0 ? Math.round((cost / totalCost) * 100) : 0
                return (
                  <tr key={c.project_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium">{c.project_name}</td>
                    <td className="px-5 py-3.5 text-center">{c.assignment_count}</td>
                    <td className="px-5 py-3.5 text-center hidden md:table-cell">{c.total_days}</td>
                    <td className="px-5 py-3.5 text-right font-medium">{fmtUSD(cost)}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{width:`${pct}%`}}/>
                        </div>
                        <span className="text-xs text-muted-foreground w-8">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
