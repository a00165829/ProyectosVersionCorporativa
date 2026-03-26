import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { usePortfolio } from '@/context/PortfolioContext'
import { Loader2, BarChart3 } from 'lucide-react'

interface Assignment {
  id: string; participant_name: string; project_name: string; activity_name: string|null
  start_date: string; end_date: string; allocation_percentage: number; has_overlap: boolean
}

const fmt = (d: string|null) => d ? new Date(d).toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'}) : '—'

export default function ResourceReports() {
  const { activePortfolioId, activePortfolio } = usePortfolio()
  const [groupBy, setGroupBy] = useState<'project'|'participant'>('project')

  const { data: items=[], isLoading } = useQuery<Assignment[]>({
    queryKey: ['assignments', activePortfolioId],
    queryFn: () => api.get(`/api/assignments?portfolio_id=${activePortfolioId}`),
    enabled: !!activePortfolioId,
  })

  // Group data
  const grouped = items.reduce<Record<string, Assignment[]>>((acc, a) => {
    const key = groupBy === 'project' ? a.project_name : a.participant_name
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reportes de Recursos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{activePortfolio?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Agrupar por:</span>
          <select className="border rounded-lg px-3 py-1.5 text-sm bg-background" value={groupBy} onChange={e=>setGroupBy(e.target.value as any)}>
            <option value="project">Proyecto</option>
            <option value="participant">Recurso</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-card border rounded-xl flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BarChart3 className="h-10 w-10 mb-3 opacity-30"/><p className="text-sm">No hay datos para reportar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).sort(([a],[b])=>a.localeCompare(b)).map(([group, assignments]) => (
            <div key={group} className="bg-card border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b bg-muted/30">
                <h3 className="font-semibold text-sm">{group} <span className="text-muted-foreground font-normal">({assignments.length} asignaciones)</span></h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-5 py-2.5 font-medium text-muted-foreground">{groupBy==='project'?'Recurso':'Proyecto'}</th>
                    <th className="text-left px-5 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Actividad</th>
                    <th className="text-center px-5 py-2.5 font-medium text-muted-foreground">%</th>
                    <th className="text-left px-5 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Inicio</th>
                    <th className="text-left px-5 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Fin</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {assignments.map(a=>(
                    <tr key={a.id} className={`hover:bg-muted/20 ${a.has_overlap?'bg-red-50':''}`}>
                      <td className="px-5 py-2.5">{groupBy==='project'?a.participant_name:a.project_name}</td>
                      <td className="px-5 py-2.5 text-muted-foreground hidden md:table-cell">{a.activity_name||'—'}</td>
                      <td className="px-5 py-2.5 text-center">{a.allocation_percentage}%</td>
                      <td className="px-5 py-2.5 text-muted-foreground hidden lg:table-cell">{fmt(a.start_date)}</td>
                      <td className="px-5 py-2.5 text-muted-foreground hidden lg:table-cell">{fmt(a.end_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
