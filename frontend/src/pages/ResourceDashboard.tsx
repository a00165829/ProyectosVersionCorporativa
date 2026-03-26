import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { usePortfolio } from '@/context/PortfolioContext'
import { Users, FolderKanban, AlertTriangle, TrendingUp } from 'lucide-react'

interface Workload {
  id: string; name: string; email: string|null
  project_count: string; assignment_count: string; total_days: string
  max_allocation: string; has_overlap: boolean
}

export default function ResourceDashboard() {
  const { activePortfolioId, activePortfolio } = usePortfolio()

  const { data: workload=[], isLoading } = useQuery<Workload[]>({
    queryKey: ['workload', activePortfolioId],
    queryFn: () => api.get(`/api/assignments/workload?portfolio_id=${activePortfolioId}`),
    enabled: !!activePortfolioId,
  })

  const totalResources = workload.length
  const activeResources = workload.filter(w => parseInt(w.assignment_count) > 0).length
  const overlaps = workload.filter(w => w.has_overlap).length
  const avgProjects = activeResources > 0
    ? (workload.reduce((s,w) => s + parseInt(w.project_count), 0) / activeResources).toFixed(1) : '0'

  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-card border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color}`}><Icon className="h-4 w-4"/></div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard de Recursos</h1>
        <p className="text-muted-foreground text-sm mt-1">{activePortfolio?.name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total recursos" value={totalResources} icon={Users} color="bg-blue-50 text-blue-600"/>
        <StatCard label="Con asignaciones" value={activeResources} icon={FolderKanban} color="bg-indigo-50 text-indigo-600"/>
        <StatCard label="Solapamientos" value={overlaps} icon={AlertTriangle} color="bg-red-50 text-red-600"/>
        <StatCard label="Prom. proyectos" value={avgProjects} icon={TrendingUp} color="bg-green-50 text-green-600"/>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b"><h2 className="font-semibold">Recursos y ocupación</h2></div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent"/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Recurso</th>
                  <th className="text-center px-5 py-3 font-medium text-muted-foreground">Proyectos</th>
                  <th className="text-center px-5 py-3 font-medium text-muted-foreground">Asignaciones</th>
                  <th className="text-center px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Días totales</th>
                  <th className="text-center px-5 py-3 font-medium text-muted-foreground">Max %</th>
                  <th className="text-center px-5 py-3 font-medium text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {workload.map(w => {
                  const maxAlloc = parseInt(w.max_allocation)
                  return (
                    <tr key={w.id} className={`hover:bg-muted/30 transition-colors ${w.has_overlap?'bg-red-50':''}`}>
                      <td className="px-5 py-3.5">
                        <p className="font-medium">{w.name}</p>
                        {w.email && <p className="text-xs text-muted-foreground">{w.email}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-center">{w.project_count}</td>
                      <td className="px-5 py-3.5 text-center">{w.assignment_count}</td>
                      <td className="px-5 py-3.5 text-center hidden md:table-cell">{w.total_days}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${maxAlloc>=80?'bg-red-100 text-red-700':maxAlloc>=50?'bg-amber-100 text-amber-700':'bg-green-100 text-green-700'}`}>
                          {maxAlloc}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {w.has_overlap
                          ? <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">Solapado</span>
                          : parseInt(w.assignment_count) > 0
                            ? <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Activo</span>
                            : <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">Disponible</span>
                        }
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
