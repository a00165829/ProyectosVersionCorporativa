import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Link } from 'react-router-dom'
import {
  FolderKanban, ChevronRight, Plus, ArrowUpDown, ArrowUp, ArrowDown,
  Search, Clock, Filter
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { usePortfolio } from '@/context/PortfolioContext'
import ProjectFormDialog from '@/components/projects/ProjectFormDialog'

export interface Project {
  id: string; name: string; scrum_stage: string; stage: string
  description: string; dev_start_date: string | null
  planned_go_live_date: string | null; go_live_date: string | null
  progress: number; classification: string; priority: number | null
  responsible_name: string | null; responsible_id: string | null
  requestor_id: string | null; requestor_name: string | null
  portfolio_id: string
  dev_end_date: string | null; test_start_date: string | null
  test_end_date: string | null; project_start_date: string | null
  deleted_at: string | null
}

const STAGE_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  'Backlog':           { bg: 'bg-slate-50',   text: 'text-slate-600',  dot: 'bg-slate-400' },
  'Análisis / Diseño': { bg: 'bg-sky-50',     text: 'text-sky-700',    dot: 'bg-sky-500' },
  'Sprint Planning':   { bg: 'bg-sky-50',     text: 'text-sky-700',    dot: 'bg-sky-500' },
  'En Desarrollo':     { bg: 'bg-blue-50',    text: 'text-blue-700',   dot: 'bg-blue-500' },
  'Code Review':       { bg: 'bg-violet-50',  text: 'text-violet-700', dot: 'bg-violet-500' },
  'QA / Pruebas':      { bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-500' },
  'UAT':               { bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-500' },
  'Pre-Producción':    { bg: 'bg-orange-50',  text: 'text-orange-700', dot: 'bg-orange-500' },
  'Go Live':           { bg: 'bg-emerald-50', text: 'text-emerald-700',dot: 'bg-emerald-500' },
  'Completado':        { bg: 'bg-emerald-50', text: 'text-emerald-700',dot: 'bg-emerald-500' },
  'Cancelado':         { bg: 'bg-red-50',     text: 'text-red-700',    dot: 'bg-red-500' },
  'En Pausa':          { bg: 'bg-orange-50',  text: 'text-orange-700', dot: 'bg-orange-400' },
  'Por Iniciar':       { bg: 'bg-violet-50',  text: 'text-violet-700', dot: 'bg-violet-400' },
}

const parseDate = (d: string) => d.length === 10 ? new Date(d + 'T12:00:00') : new Date(d)
const fmt = (d: string | null) => d
  ? parseDate(d).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' })
  : '—'

type SortKey = 'name' | 'classification' | 'responsible_name' | 'scrum_stage' | 'progress' | 'planned_go_live_date' | 'go_live_date'
type SortDir = 'asc' | 'desc'

function sortProjects(projects: Project[], key: SortKey, dir: SortDir): Project[] {
  return [...projects].sort((a, b) => {
    let cmp = 0; const av = a[key], bv = b[key]
    if (key === 'progress') cmp = (a.progress || 0) - (b.progress || 0)
    else if (key === 'planned_go_live_date' || key === 'go_live_date') {
      if (!av && !bv) cmp = 0; else if (!av) cmp = 1; else if (!bv) cmp = -1
      else cmp = new Date(av as string).getTime() - new Date(bv as string).getTime()
    } else cmp = ((av||'').toString().toLowerCase()).localeCompare((bv||'').toString().toLowerCase(), 'es')
    return dir === 'asc' ? cmp : -cmp
  })
}

function pColor(p: number) {
  if (p >= 80) return { bar: 'bg-emerald-500', label: 'text-emerald-700' }
  if (p >= 50) return { bar: 'bg-blue-500', label: 'text-blue-700' }
  if (p >= 25) return { bar: 'bg-amber-500', label: 'text-amber-700' }
  return { bar: 'bg-red-500', label: 'text-red-600' }
}

export default function ProjectsList() {
  const { isManager, isLider } = useAuth()
  const canCreate = isManager || isLider
  const { activePortfolioId, activePortfolio } = usePortfolio()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('progress')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<string>('')

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects', activePortfolioId],
    queryFn: () => api.get<Project[]>(`/api/projects?portfolio_id=${activePortfolioId}`),
    enabled: !!activePortfolioId,
  })

  const active = projects.filter(p =>
    !p.deleted_at &&
    p.scrum_stage !== 'Completado' &&
    p.scrum_stage !== 'Cancelado'
  )
  const filtered = useMemo(() => {
    let list = active
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.responsible_name?.toLowerCase().includes(search.toLowerCase()))
    if (stageFilter) list = list.filter(p => p.scrum_stage === stageFilter)
    return list
  }, [active, search, stageFilter])
  const sorted = useMemo(() => sortProjects(filtered, sortKey, sortDir), [filtered, sortKey, sortDir])

  // Get unique stages for filter
  const stages = [...new Set(active.map(p => p.scrum_stage))].sort()

  const toggle = (key: SortKey) => { if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDir('asc') } }
  const SI = ({ col }: { col: SortKey }) => sortKey !== col ? <ArrowUpDown className="h-3 w-3 opacity-30"/> : sortDir === 'asc' ? <ArrowUp className="h-3 w-3"/> : <ArrowDown className="h-3 w-3"/>
  const TH = ({ col, label, cls='' }: { col: SortKey; label: string; cls?: string }) => (
    <th className={`text-left px-5 py-3 font-medium text-[11px] uppercase tracking-wider text-muted-foreground/70 ${cls}`}>
      <button onClick={() => toggle(col)} className="flex items-center gap-1.5 hover:text-foreground transition-colors">{label} <SI col={col}/></button>
    </th>
  )

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proyectos en proceso</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{activePortfolio?.name} — {active.length} proyectos</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all duration-200">
            <Plus className="h-4 w-4"/> Nuevo proyecto
          </button>
        )}
      </div>

      {/* Table card */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b bg-muted/20">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o líder..."
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"/>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/>
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
              className="pl-9 pr-8 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
              <option value="">Todas las etapas</option>
              {stages.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {(search || stageFilter) && (
            <button onClick={() => { setSearch(''); setStageFilter('') }} className="text-xs text-primary hover:underline font-medium">Limpiar</button>
          )}
          <span className="ml-auto text-[11px] text-muted-foreground font-medium">{filtered.length} de {active.length}</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent"/></div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FolderKanban className="h-12 w-12 mb-3 opacity-20"/>
            <p className="font-medium">{search || stageFilter ? 'Sin resultados para el filtro actual' : 'No hay proyectos en proceso'}</p>
            {(search || stageFilter) && <button onClick={() => { setSearch(''); setStageFilter('') }} className="mt-2 text-sm text-primary hover:underline">Limpiar filtros</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b"><tr>
                <TH col="name" label="Proyecto"/>
                <TH col="classification" label="Tipo" cls="hidden md:table-cell"/>
                <TH col="responsible_name" label="Líder" cls="hidden lg:table-cell"/>
                <TH col="scrum_stage" label="Etapa"/>
                <TH col="progress" label="Avance" cls="hidden md:table-cell"/>
                <TH col="planned_go_live_date" label="Go-Live Plan." cls="hidden xl:table-cell"/>
                <TH col="go_live_date" label="Go-Live Real" cls="hidden xl:table-cell"/>
                <th className="w-10"/>
              </tr></thead>
              <tbody className="divide-y divide-border/40">
                {sorted.map(p => {
                  const st = STAGE_STYLE[p.scrum_stage] || { bg:'bg-gray-50', text:'text-gray-700', dot:'bg-gray-400' }
                  const pc = pColor(p.progress)
                  const isLate = p.go_live_date && p.planned_go_live_date && new Date(p.go_live_date) > new Date(p.planned_go_live_date)
                  return (
                    <tr key={p.id} className="group hover:bg-primary/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <Link to={`/projects/${p.id}`} className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{p.name}</Link>
                        {p.description && <p className="text-[11px] text-muted-foreground/70 mt-0.5 line-clamp-1 max-w-md">{p.description}</p>}
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${p.classification==='Proyecto'?'bg-primary/8 text-primary':'bg-muted text-muted-foreground'}`}>{p.classification}</span>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-muted-foreground text-[13px]">{p.responsible_name || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold ${st.bg} ${st.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`}/>{p.scrum_stage}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2.5 w-32">
                          <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${pc.bar}`} style={{width:`${p.progress}%`}}/>
                          </div>
                          <span className={`text-xs font-bold w-9 text-right ${pc.label}`}>{p.progress}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden xl:table-cell">
                        {p.planned_go_live_date ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3 w-3"/><span className="text-xs">{fmt(p.planned_go_live_date)}</span></div>
                        ) : <span className="text-xs text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-5 py-4 hidden xl:table-cell">
                        {p.go_live_date ? (
                          <span className={`text-xs font-medium ${isLate ? 'text-red-600' : 'text-muted-foreground'}`}>{fmt(p.go_live_date)}</span>
                        ) : <span className="text-xs text-muted-foreground/40">—</span>}
                      </td>
                      <td className="pr-4">
                        <Link to={`/projects/${p.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="h-4 w-4 text-muted-foreground"/></Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProjectFormDialog open={showForm} onOpenChange={setShowForm} portfolioId={activePortfolioId || ''}/>
    </div>
  )
}
