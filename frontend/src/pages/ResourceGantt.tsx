import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { usePortfolio } from '@/context/PortfolioContext'
import { Loader2, CalendarRange } from 'lucide-react'

interface Assignment {
  id: string; participant_name: string; project_name: string
  start_date: string; end_date: string; allocation_percentage: number; has_overlap: boolean
}

const COLORS = [
  'bg-blue-400','bg-indigo-400','bg-purple-400','bg-pink-400','bg-amber-400',
  'bg-emerald-400','bg-cyan-400','bg-rose-400','bg-teal-400','bg-orange-400',
]

export default function ResourceGantt() {
  const { activePortfolioId, activePortfolio } = usePortfolio()

  const { data: items=[], isLoading } = useQuery<Assignment[]>({
    queryKey: ['assignments', activePortfolioId],
    queryFn: () => api.get(`/api/assignments?portfolio_id=${activePortfolioId}`),
    enabled: !!activePortfolioId,
  })

  const { grouped, minDate, maxDate, totalDays, projectColorMap } = useMemo(() => {
    if (items.length === 0) return { grouped: {}, minDate: new Date(), maxDate: new Date(), totalDays: 1, projectColorMap: {} }

    const dates = items.flatMap(a => [new Date(a.start_date).getTime(), new Date(a.end_date).getTime()])
    const min = new Date(Math.min(...dates))
    const max = new Date(Math.max(...dates))
    // Add 1 week padding
    min.setDate(min.getDate() - 7)
    max.setDate(max.getDate() + 7)
    const total = Math.max(1, Math.round((max.getTime() - min.getTime()) / 86400000))

    const byParticipant: Record<string, Assignment[]> = {}
    const projects = new Set<string>()
    for (const a of items) {
      if (!byParticipant[a.participant_name]) byParticipant[a.participant_name] = []
      byParticipant[a.participant_name].push(a)
      projects.add(a.project_name)
    }

    const colorMap: Record<string, string> = {}
    let i = 0
    for (const p of projects) { colorMap[p] = COLORS[i % COLORS.length]; i++ }

    return { grouped: byParticipant, minDate: min, maxDate: max, totalDays: total, projectColorMap: colorMap }
  }, [items])

  const getBarStyle = (a: Assignment) => {
    const start = new Date(a.start_date).getTime()
    const end = new Date(a.end_date).getTime()
    const left = ((start - minDate.getTime()) / 86400000 / totalDays) * 100
    const width = ((end - start) / 86400000 / totalDays) * 100
    return { left: `${Math.max(0,left)}%`, width: `${Math.max(0.5,width)}%` }
  }

  // Generate month markers
  const months = useMemo(() => {
    const result: {label:string; left:string}[] = []
    const d = new Date(minDate)
    d.setDate(1)
    d.setMonth(d.getMonth() + 1)
    while (d <= maxDate) {
      const left = ((d.getTime() - minDate.getTime()) / 86400000 / totalDays) * 100
      result.push({ label: d.toLocaleDateString('es-MX',{month:'short',year:'2-digit'}), left: `${left}%` })
      d.setMonth(d.getMonth() + 1)
    }
    return result
  }, [minDate, maxDate, totalDays])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Gantt de Recursos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{activePortfolio?.name}</p>
      </div>

      {/* Legend */}
      {Object.keys(projectColorMap).length > 0 && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(projectColorMap).map(([name, color]) => (
            <div key={name} className="flex items-center gap-1.5 text-xs">
              <div className={`h-3 w-3 rounded ${color}`}/> {name}
            </div>
          ))}
        </div>
      )}

      <div className="bg-card border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CalendarRange className="h-10 w-10 mb-3 opacity-30"/><p className="text-sm">No hay asignaciones para mostrar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Month headers */}
              <div className="relative h-8 border-b bg-muted/30">
                {months.map((m,i) => (
                  <div key={i} className="absolute top-0 h-full border-l border-border/50 flex items-center pl-1" style={{left:m.left}}>
                    <span className="text-[10px] text-muted-foreground">{m.label}</span>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {Object.entries(grouped).sort(([a],[b])=>a.localeCompare(b)).map(([name, assignments]) => (
                <div key={name} className="flex border-b hover:bg-muted/20 transition-colors">
                  <div className="w-48 shrink-0 px-4 py-3 border-r bg-muted/10">
                    <p className="text-sm font-medium truncate">{name}</p>
                    <p className="text-[10px] text-muted-foreground">{assignments.length} asignaciones</p>
                  </div>
                  <div className="flex-1 relative py-2 min-h-[44px]">
                    {/* Month gridlines */}
                    {months.map((m,i) => (
                      <div key={i} className="absolute top-0 bottom-0 border-l border-border/20" style={{left:m.left}}/>
                    ))}
                    {assignments.map(a => {
                      const style = getBarStyle(a)
                      return (
                        <div key={a.id} className="absolute top-1/2 -translate-y-1/2 h-6" style={style}
                          title={`${a.project_name} (${a.allocation_percentage}%)`}>
                          <div className={`h-full rounded ${projectColorMap[a.project_name]||'bg-gray-400'} ${a.has_overlap?'ring-2 ring-red-500':''} opacity-80 hover:opacity-100 transition-opacity`}>
                            <span className="text-[9px] text-white font-medium px-1 truncate block leading-6">{a.project_name}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
