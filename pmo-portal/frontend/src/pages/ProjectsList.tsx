import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { usePortfolio } from '@/context/PortfolioContext'
import { toast } from 'sonner'
import { Plus, ChevronUp, ChevronDown, FolderKanban } from 'lucide-react'
import ProjectFormDialog from '@/components/projects/ProjectFormDialog'

export interface Project {
  id: string; name: string; description: string
  scrum_stage: string; classification: 'Proyecto' | 'Mejora'
  priority: number | null; progress: number
  responsible_id: string | null; responsible_name: string | null
  portfolio_id: string; dev_start_date: string | null
  go_live_date: string | null; planned_go_live_date: string | null
}

const STAGE_COLOR: Record<string, string> = {
  'Backlog':'bg-gray-100 text-gray-600','Análisis / Diseño':'bg-blue-100 text-blue-700',
  'Sprint Planning':'bg-blue-100 text-blue-700','En Desarrollo':'bg-indigo-100 text-indigo-700',
  'Code Review':'bg-purple-100 text-purple-700','QA / Pruebas':'bg-amber-100 text-amber-700',
  'UAT':'bg-amber-100 text-amber-700','Pre-Producción':'bg-orange-100 text-orange-700',
  'Go Live':'bg-green-100 text-green-700','Completado':'bg-green-100 text-green-700',
  'Cancelado':'bg-red-100 text-red-700',
}

function ProgressBar({ value }: { value: number }) {
  const color = value>=80?'bg-green-500':value>=50?'bg-blue-500':value>=25?'bg-amber-500':'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{width:`${Math.min(100,Math.max(0,value))}%`}}/>
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{value}%</span>
    </div>
  )
}

const calcDelay = (g: string|null, p: string|null) =>
  g&&p ? Math.round((new Date(g).getTime()-new Date(p).getTime())/86400000) : 0

type SortKey = 'priority'|'name'|'responsible_name'|'go_live_date'|'scrum_stage'|'progress'|'delay'
type SortDir = 'asc'|'desc'

// Portfolio ID viene del contexto

export default function ProjectsList() {
  const { isManager } = useAuth()
  const { activePortfolioId, activePortfolio } = usePortfolio()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editProject, setEditProject] = useState<Project|undefined>()
  const [classFilter, setClassFilter] = useState<'all'|'Proyecto'|'Mejora'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('priority')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const { data: projects=[], isLoading } = useQuery<Project[]>({
    queryKey: ['projects', activePortfolioId],
    queryFn: () => api.get<Project[]>(`/api/projects?portfolio_id=${activePortfolioId}`),
    enabled: !!activePortfolioId,
  })

  const active = projects.filter(p => p.scrum_stage!=='Completado' && p.scrum_stage!=='Cancelado')
  const filtered = classFilter==='all' ? active : active.filter(p => p.classification===classFilter)

  const sorted = useMemo(() => {
    const mul = sortDir==='asc' ? 1 : -1
    return [...filtered].sort((a,b) => {
      switch(sortKey) {
        case 'priority': return ((a.priority??999)-(b.priority??999))*mul
        case 'name': return a.name.localeCompare(b.name,'es')*mul
        case 'responsible_name': return (a.responsible_name||'').localeCompare(b.responsible_name||'','es')*mul
        case 'go_live_date': return ((a.go_live_date?new Date(a.go_live_date).getTime():0)-(b.go_live_date?new Date(b.go_live_date).getTime():0))*mul
        case 'scrum_stage': return a.scrum_stage.localeCompare(b.scrum_stage,'es')*mul
        case 'progress': return (a.progress-b.progress)*mul
        case 'delay': return (calcDelay(a.go_live_date,a.planned_go_live_date)-calcDelay(b.go_live_date,b.planned_go_live_date))*mul
        default: return 0
      }
    })
  }, [filtered, sortKey, sortDir])

  const toggleSort = (k: SortKey) => {
    if(k===sortKey) setSortDir(d=>d==='asc'?'desc':'asc')
    else { setSortKey(k); setSortDir('asc') }
  }

  const SI = ({active,dir}:{active:boolean;dir:SortDir}) =>
    !active ? <span className="w-3 inline-block"/> :
    dir==='asc' ? <ChevronUp className="h-3 w-3"/> : <ChevronDown className="h-3 w-3"/>

  const Th = ({k,label,cls}:{k:SortKey;label:string;cls?:string}) => (
    <th className={`px-4 py-3 text-left font-medium text-muted-foreground text-xs ${cls||''}`}>
      <button onClick={()=>toggleSort(k)} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
        {label}<SI active={sortKey===k} dir={sortDir}/>
      </button>
    </th>
  )

  const fmt = (d:string|null) => d ? new Date(d).toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'}) : '—'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proyectos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{activePortfolio?.name} — {filtered.length} proyectos activos</p>
        </div>
        {isManager && (
          <button onClick={()=>{setEditProject(undefined);setShowForm(true)}}
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4"/> Nuevo proyecto
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {(['all','Proyecto','Mejora'] as const).map(v=>(
          <button key={v} onClick={()=>setClassFilter(v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${classFilter===v?'bg-primary text-primary-foreground':'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {v==='all'?'Todos':v+'s'}
          </button>
        ))}
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent"/>
          </div>
        ) : sorted.length===0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FolderKanban className="h-10 w-10 mb-3 opacity-30"/>
            <p className="text-sm">No hay proyectos activos</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 w-8">
                  <button onClick={()=>toggleSort('delay')} className="flex items-center justify-center w-full">
                    <SI active={sortKey==='delay'} dir={sortDir}/>
                  </button>
                </th>
                <Th k="priority" label="P." cls="w-12"/>
                <Th k="name" label="Proyecto"/>
                <Th k="responsible_name" label="Líder" cls="hidden md:table-cell"/>
                <Th k="go_live_date" label="Go Live" cls="hidden lg:table-cell"/>
                <Th k="scrum_stage" label="Etapa" cls="hidden sm:table-cell"/>
                <Th k="progress" label="Avance" cls="w-44"/>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map(p=>{
                const delay = calcDelay(p.go_live_date, p.planned_go_live_date)
                const isLate = delay > 0
                const planned = p.planned_go_live_date || p.go_live_date
                return (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={()=>window.location.href=`/projects/${p.id}`}>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${isLate?'bg-red-500':'bg-green-500'}`}
                        title={isLate?`Retrasado ${delay} días`:'En tiempo'}/>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.priority??'—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{p.name}</span>
                        {p.classification && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.classification==='Proyecto'?'bg-primary/10 text-primary':'bg-secondary text-secondary-foreground'}`}>
                            {p.classification==='Proyecto'?'P':'M'}
                          </span>
                        )}
                      </div>
                      {p.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.responsible_name||'—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {p.go_live_date ? (
                        <div>
                          <span className={isLate?'text-red-600 font-medium':''}>{fmt(p.go_live_date)}</span>
                          {planned && planned!==p.go_live_date && (
                            <p className="text-xs text-muted-foreground mt-0.5">Plan: {fmt(planned)}</p>
                          )}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STAGE_COLOR[p.scrum_stage]||'bg-gray-100 text-gray-600'}`}>
                        {p.scrum_stage}
                      </span>
                    </td>
                    <td className="px-4 py-3"><ProgressBar value={p.progress}/></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <ProjectFormDialog open={showForm} onOpenChange={setShowForm} project={editProject} portfolioId={activePortfolioId || ''}/>
    </div>
  )
}
