import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { usePortfolio } from '@/context/PortfolioContext'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Loader2, X, UserCheck, AlertTriangle, Calendar } from 'lucide-react'

interface Assignment {
  id: string
  resource_id: string | null
  project_id: string
  activity_id: string | null
  participant_id: string | null
  portfolio_id: string | null
  start_date: string
  end_date: string
  allocation_percentage: number
  has_overlap: boolean
  resource_name: string | null
  resource_email: string | null
  resource_cost_usd: string | null
  leader_name: string | null
  project_name: string
  activity_name: string | null
}

const fmt = (d: string|null) => d ? new Date(d).toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'}) : '—'

export default function ResourceAssignments() {
  const { activePortfolioId, activePortfolio } = usePortfolio()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Assignment|null>(null)
  const [fResource, setFResource] = useState('')
  const [fProject, setFProject] = useState('')
  const [fActivity, setFActivity] = useState('')
  const [fStart, setFStart] = useState('')
  const [fEnd, setFEnd] = useState('')
  const [fAlloc, setFAlloc] = useState(100)
  const [fLeader, setFLeader] = useState('')

  const { data: items=[], isLoading } = useQuery<Assignment[]>({
    queryKey: ['assignments', activePortfolioId],
    queryFn: () => api.get(`/api/assignments?portfolio_id=${activePortfolioId}`),
    enabled: !!activePortfolioId,
  })
  const { data: resources=[] } = useQuery<any[]>({ queryKey: ['resources'], queryFn: () => api.get('/api/resources') })
  const { data: participants=[] } = useQuery<any[]>({ queryKey: ['participants-list'], queryFn: () => api.get('/api/projects/participants/list') })
  const { data: projects=[] } = useQuery<any[]>({
    queryKey: ['projects', activePortfolioId],
    queryFn: () => api.get(`/api/projects?portfolio_id=${activePortfolioId}`),
    enabled: !!activePortfolioId,
  })
  const { data: activities=[] } = useQuery<any[]>({ queryKey: ['activities'], queryFn: () => api.get('/api/activities') })

  const save = useMutation({
    mutationFn: (body: any) => editing ? api.put(`/api/assignments/${editing.id}`, body) : api.post('/api/assignments', body),
    onSuccess: () => { qc.invalidateQueries({queryKey:['assignments']}); toast.success('Guardado'); closeForm() },
    onError: (e:any) => toast.error(e.message),
  })
  const remove = useMutation({
    mutationFn: (id:string) => api.delete(`/api/assignments/${id}`),
    onSuccess: () => { qc.invalidateQueries({queryKey:['assignments']}); toast.success('Eliminado') },
  })

  const closeForm = () => {
    setShowForm(false); setEditing(null)
    setFResource(''); setFProject(''); setFActivity('')
    setFStart(''); setFEnd(''); setFAlloc(100); setFLeader('')
  }
  const openEdit = (a: Assignment) => {
    setEditing(a)
    setFResource(a.resource_id || '')
    setFProject(a.project_id)
    setFActivity(a.activity_id || '')
    setFStart(a.start_date)
    setFEnd(a.end_date)
    setFAlloc(a.allocation_percentage)
    setFLeader(a.participant_id || '')
    setShowForm(true)
  }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fResource || !fProject || !fStart || !fEnd) return toast.error('Completa los campos requeridos')
    save.mutate({
      resource_id: fResource,
      project_id: fProject,
      activity_id: fActivity || null,
      participant_id: fLeader || null,
      portfolio_id: activePortfolioId,
      start_date: fStart,
      end_date: fEnd,
      allocation_percentage: fAlloc,
    })
  }

  const inputCls = "w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recursos Asignaciones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{activePortfolio?.name} — {items.length} asignaciones</p>
        </div>
        <button onClick={()=>{setEditing(null);setShowForm(true)}} className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4"/> Nueva asignación
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeForm}/>
          <div className="relative bg-card border rounded-2xl shadow-xl w-full max-w-lg m-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg">{editing?'Editar':'Nueva'} Asignación</h2>
              <button onClick={closeForm}><X className="h-5 w-5 text-muted-foreground"/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="text-xs font-medium text-muted-foreground">Recurso *</label>
                <select className={`${inputCls} mt-1`} value={fResource} onChange={e=>setFResource(e.target.value)}>
                  <option value="">Seleccionar recurso</option>
                  {resources.map((r:any)=>(
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Proyecto *</label>
                <select className={`${inputCls} mt-1`} value={fProject} onChange={e=>setFProject(e.target.value)}>
                  <option value="">Seleccionar proyecto</option>
                  {projects.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Actividad</label>
                <select className={`${inputCls} mt-1`} value={fActivity} onChange={e=>setFActivity(e.target.value)}>
                  <option value="">Seleccionar actividad</option>
                  {activities.map((a:any)=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Fecha Inicio *</label>
                  <input className={`${inputCls} mt-1`} type="date" value={fStart} onChange={e=>setFStart(e.target.value)}/>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Fecha Fin *</label>
                  <input className={`${inputCls} mt-1`} type="date" value={fEnd} onChange={e=>setFEnd(e.target.value)}/>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-muted-foreground">% de Asignación</label>
                  <span className="text-sm font-bold text-primary">{fAlloc}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={fAlloc}
                    onChange={e => setFAlloc(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-primary/20 rounded-full appearance-none cursor-pointer accent-primary"
                    style={{
                      background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${fAlloc}%, hsl(var(--muted)) ${fAlloc}%, hsl(var(--muted)) 100%)`
                    }}
                  />
                  <input
                    className="w-16 border rounded-lg px-2 py-1.5 text-sm text-center bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    type="number"
                    min="1"
                    max="100"
                    value={fAlloc}
                    onChange={e=>setFAlloc(Math.min(100, Math.max(1, parseInt(e.target.value)||1)))}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Líder (opcional)</label>
                <select className={`${inputCls} mt-1`} value={fLeader} onChange={e=>setFLeader(e.target.value)}>
                  <option value="">Seleccionar líder (opcional)</option>
                  {participants.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
                <button type="submit" disabled={save.isPending || !fResource || !fProject} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {save.isPending && <Loader2 className="h-4 w-4 animate-spin"/>} {editing ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-card border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent"/></div>
        ) : items.length===0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground"><UserCheck className="h-10 w-10 mb-3 opacity-30"/><p className="text-sm">No hay asignaciones</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Recurso</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Proyecto</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Actividad</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Líder</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">%</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Inicio</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Fin</th>
                  <th className="w-20"/>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map(a=>(
                  <tr key={a.id} className={`hover:bg-muted/30 transition-colors ${a.has_overlap?'bg-red-50':''}`}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {a.has_overlap && <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0"/>}
                        <span className="font-medium">{a.resource_name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">{a.project_name}</td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">{a.activity_name||'—'}</td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden lg:table-cell">{a.leader_name||'—'}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.allocation_percentage>=80?'bg-red-100 text-red-700':a.allocation_percentage>=50?'bg-amber-100 text-amber-700':'bg-green-100 text-green-700'}`}>
                        {a.allocation_percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden xl:table-cell">{fmt(a.start_date)}</td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden xl:table-cell">{fmt(a.end_date)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={()=>openEdit(a)} className="p-1.5 rounded hover:bg-muted transition-colors"><Edit className="h-3.5 w-3.5 text-muted-foreground"/></button>
                        <button onClick={()=>remove.mutate(a.id)} className="p-1.5 rounded hover:bg-muted transition-colors"><Trash2 className="h-3.5 w-3.5 text-muted-foreground"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
