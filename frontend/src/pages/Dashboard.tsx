import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { usePortfolio } from '@/context/PortfolioContext'
import {
  FolderKanban, CheckCircle2, TrendingUp, AlertCircle, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown, Clock, BarChart3, Search
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface Project {
  id: string; name: string; scrum_stage: string; description: string
  go_live_date: string | null; planned_go_live_date: string | null
  progress: number; classification: string; responsible_name: string | null
  priority: number | null
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

const fmt = (d: string | null) => d
  ? new Date(d).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' })
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

export default function Dashboard() {
  const { user } = useAuth()
  const { activePortfolioId, activePortfolio } = usePortfolio()
  const [sortKey, setSortKey] = useState<SortKey>('progress')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [search, setSearch] = useState('')

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects', activePortfolioId],
    queryFn: () => api.get<Project[]>(`/api/projects?portfolio_id=${activePortfolioId}`),
    enabled: !!activePortfolioId,
  })

  const active = projects.filter(p => p.scrum_stage !== 'Completado' && p.scrum_stage !== 'Cancelado' && !('deleted_at' in p && (p as any).deleted_at))
  const filtered = search ? active.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.responsible_name?.toLowerCase().includes(search.toLowerCase())) : active
  const sorted = useMemo(() => sortProjects(filtered, sortKey, sortDir), [filtered, sortKey, sortDir])
  const desarrollo = projects.filter(p => p.scrum_stage === 'En Desarrollo').length
  const completados = projects.filter(p => p.scrum_stage === 'Completado').length
  const enRiesgo = projects.filter(p => p.go_live_date && p.planned_go_live_date && new Date(p.go_live_date) > new Date(p.planned_go_live_date)).length
  const avgProgress = active.length > 0 ? Math.round(active.reduce((s, p) => s + (p.progress || 0), 0) / active.length) : 0

  const toggle = (key: SortKey) => { if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDir('asc') } }
  const SI = ({ col }: { col: SortKey }) => sortKey !== col ? <ArrowUpDown className="h-3 w-3 opacity-30"/> : sortDir === 'asc' ? <ArrowUp className="h-3 w-3"/> : <ArrowDown className="h-3 w-3"/>
  const TH = ({ col, label, cls='' }: { col: SortKey; label: string; cls?: string }) => (
    <th className={`text-left px-5 py-3 font-medium text-[11px] uppercase tracking-wider text-muted-foreground/70 ${cls}`}>
      <button onClick={() => toggle(col)} className="flex items-center gap-1.5 hover:text-foreground transition-colors">{label} <SI col={col}/></button>
    </th>
  )

  const stats = [
    { label: 'Total proyectos', value: projects.length, icon: FolderKanban, gradient: 'from-blue-600 to-blue-400', iconBg: 'bg-white/20' },
    { label: 'En desarrollo',   value: desarrollo,      icon: TrendingUp,   gradient: 'from-indigo-600 to-indigo-400', iconBg: 'bg-white/20' },
    { label: 'Completados',     value: completados,     icon: CheckCircle2, gradient: 'from-emerald-600 to-emerald-400', iconBg: 'bg-white/20' },
    { label: 'En riesgo',       value: enRiesgo,        icon: AlertCircle,  gradient: 'from-red-600 to-rose-400', iconBg: 'bg-white/20' },
  ]

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">{activePortfolio?.name} — Bienvenido, {user?.displayName}</p>
      </div>

      {/* KPI Cards with gradient */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${s.gradient} text-white shadow-lg shadow-black/5 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5`}>
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/5 -translate-y-4 translate-x-4"/>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium uppercase tracking-wide text-white/70">{s.label}</span>
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="bg-card border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary"/>
            </div>
            <span className="font-semibold text-sm">Avance promedio del portafolio</span>
          </div>
          <span className={`text-2xl font-extrabold ${pColor(avgProgress).label}`}>{avgProgress}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted/50 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ease-out ${pColor(avgProgress).bar}`} style={{ width: `${avgProgress}%` }}/>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold">Proyectos activos</h2>
            <span className="text-[11px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-semibold">{active.length}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                className="pl-9 pr-3 py-1.5 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 w-44 transition-all focus:w-56"/>
            </div>
            <Link to="/projects" className="text-sm text-primary hover:underline font-medium">Ver todos</Link>
          </div>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent"/></div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FolderKanban className="h-10 w-10 mb-3 opacity-20"/><p className="text-sm">{search ? 'Sin resultados' : 'No hay proyectos activos'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr>
                <TH col="name" label="Proyecto"/>
                <TH col="classification" label="Tipo" cls="hidden md:table-cell"/>
                <TH col="responsible_name" label="Líder" cls="hidden lg:table-cell"/>
                <TH col="scrum_stage" label="Etapa"/>
                <TH col="progress" label="Avance" cls="hidden md:table-cell"/>
                <TH col="planned_go_live_date" label="Go-Live" cls="hidden xl:table-cell"/>
                <th className="w-10"/>
              </tr></thead>
              <tbody className="divide-y divide-border/40">
                {sorted.map(p => {
                  const st = STAGE_STYLE[p.scrum_stage] || { bg:'bg-gray-50', text:'text-gray-700', dot:'bg-gray-400' }
                  const pc = pColor(p.progress)
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
    </div>
  )
}
