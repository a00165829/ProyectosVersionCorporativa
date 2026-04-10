import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import {
  ArrowLeft, Edit, MessageSquare, Trash2, Calendar, User, UserCheck,
  Tag, TrendingUp, Send, Loader2, Clock, Plus, X, Paperclip, AlertTriangle
} from 'lucide-react'
import ProjectFormDialog from '@/components/projects/ProjectFormDialog'
import type { Project } from './ProjectsList'

interface Comment { id: string; content: string; author_name: string|null; created_at: string }
interface StatusEntry { id: string; description: string; stage: string|null; notes: string; author_name: string|null; created_at: string }
interface ProjectFile { id: string; name: string; s3_key: string; uploader_name: string|null; created_at: string }

const STAGE_COLOR: Record<string,string> = {
  'Backlog':'bg-gray-100 text-gray-600','Análisis / Diseño':'bg-blue-100 text-blue-700',
  'Sprint Planning':'bg-blue-100 text-blue-700','En Desarrollo':'bg-indigo-100 text-indigo-700',
  'Code Review':'bg-purple-100 text-purple-700','QA / Pruebas':'bg-amber-100 text-amber-700',
  'UAT':'bg-amber-100 text-amber-700','Pre-Producción':'bg-orange-100 text-orange-700',
  'Go Live':'bg-green-100 text-green-700','Completado':'bg-green-100 text-green-700',
  'Cancelado':'bg-red-100 text-red-700',
}

const SCRUM_STAGES = ['Backlog','Análisis / Diseño','Sprint Planning','En Desarrollo',
  'Code Review','QA / Pruebas','UAT','Pre-Producción','Go Live']

function ProgressBar({ value }: { value: number }) {
  const color = value>=80?'bg-green-500':value>=50?'bg-blue-500':value>=25?'bg-amber-500':'bg-red-500'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{width:`${Math.min(100,Math.max(0,value))}%`}}/>
      </div>
      <span className="text-sm font-semibold w-10 text-right">{value}%</span>
    </div>
  )
}

const fmt = (d:string|null) => d ? new Date(d).toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'}) : '—'
const fmtDT = (d:string) => new Date(d).toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { isManager } = useAuth()
  const [showEdit, setShowEdit] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [showStatusForm, setShowStatusForm] = useState(false)
  const [statusDesc, setStatusDesc] = useState('')
  const [statusStage, setStatusStage] = useState('')
  const [statusNotes, setStatusNotes] = useState('')

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: () => api.get<Project>(`/api/projects/${id}`),
  })

  const { data: comments=[] } = useQuery<Comment[]>({
    queryKey: ['comments', id],
    queryFn: () => api.get<Comment[]>(`/api/projects/${id}/comments`),
    enabled: !!id,
  })

  const { data: statusHistory=[] } = useQuery<StatusEntry[]>({
    queryKey: ['status-history', id],
    queryFn: () => api.get<StatusEntry[]>(`/api/projects/${id}/status-history`),
    enabled: !!id,
  })

  const { data: files=[] } = useQuery<ProjectFile[]>({
    queryKey: ['project-files', id],
    queryFn: () => api.get<ProjectFile[]>(`/api/projects/${id}/files`),
    enabled: !!id,
  })

  const addComment = useMutation({
    mutationFn: () => api.post(`/api/projects/${id}/comments`, { content: newComment }),
    onSuccess: () => { qc.invalidateQueries({queryKey:['comments',id]}); setNewComment(''); toast.success('Comentario agregado') },
    onError: (e:any) => toast.error(e.message),
  })

  const deleteComment = useMutation({
    mutationFn: (cid:string) => api.delete(`/api/projects/${id}/comments/${cid}`),
    onSuccess: () => qc.invalidateQueries({queryKey:['comments',id]}),
  })

  const addStatus = useMutation({
    mutationFn: () => api.post(`/api/projects/${id}/status-history`, {
      description: statusDesc, stage: statusStage, notes: statusNotes
    }),
    onSuccess: () => {
      qc.invalidateQueries({queryKey:['status-history',id]})
      setStatusDesc(''); setStatusStage(''); setStatusNotes(''); setShowStatusForm(false)
      toast.success('Actualización agregada')
    },
    onError: (e:any) => toast.error(e.message),
  })

  const deleteStatus = useMutation({
    mutationFn: (sid:string) => api.delete(`/api/projects/${id}/status-history/${sid}`),
    onSuccess: () => qc.invalidateQueries({queryKey:['status-history',id]}),
  })

  const deleteProject = useMutation({
    mutationFn: () => api.delete(`/api/projects/${id}`),
    onSuccess: () => { qc.invalidateQueries({queryKey:['projects']}); toast.success('Proyecto eliminado'); navigate('/projects') },
  })

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent"/></div>
  if (!project) return <div className="text-center py-20 text-muted-foreground"><p>Proyecto no encontrado</p><Link to="/projects" className="text-primary hover:underline text-sm mt-2 inline-block">← Volver</Link></div>

  const delay = project.go_live_date && project.planned_go_live_date
    ? Math.round((new Date(project.go_live_date).getTime()-new Date(project.planned_go_live_date).getTime())/86400000) : 0

  // Calculate delay percentage
  const totalDays = project.planned_go_live_date && (project.project_start_date || project.dev_start_date)
    ? Math.round((new Date(project.planned_go_live_date).getTime()-new Date(project.project_start_date || project.dev_start_date!).getTime())/86400000)
    : 0
  const delayPct = totalDays > 0 && delay > 0 ? Math.round((delay / totalDays) * 100) : 0

  const inputCls = "w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link to="/projects" className="mt-1 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5"/></Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              {project.classification && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${project.classification==='Proyecto'?'bg-primary/10 text-primary':'bg-secondary text-secondary-foreground'}`}>
                  {project.classification}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {project.requestor_name && <>Solicitante: {project.requestor_name} · </>}
              {project.responsible_name && <>Líder: {project.responsible_name}</>}
            </p>
          </div>
        </div>
        {isManager && (
          <div className="flex gap-2 shrink-0">
           <button onClick={() => {
  const start = project.project_start_date || project.dev_start_date
  const end = project.go_live_date || project.planned_go_live_date
  if (!start || !end) {
    toast.error('Se necesita fecha de inicio y fecha de Go-Live')
    return
  }
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  const today = Date.now()
  let pct = 0
  if (today >= endMs) pct = 100
  else if (today <= startMs) pct = 0
  else pct = Math.round(((today - startMs) / (endMs - startMs)) * 100)
  api.put(`/api/projects/${id}`, { progress: pct })
    .then(() => {
      qc.invalidateQueries({ queryKey: ['project', id] })
      qc.invalidateQueries({ queryKey: ['projects'] })
      toast.success(`Avance calculado: ${pct}%`)
    })
    .catch((e: any) => toast.error(e.message))
}}
className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">
  <TrendingUp className="h-4 w-4"/> Calcular
</button>
<button onClick={()=>setShowEdit(true)}
  className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">
  <Edit className="h-4 w-4"/> Editar
</button>
<button onClick={()=>deleteProject.mutate()}
  className="px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors">
  <Trash2 className="h-4 w-4"/>
</button>
          </div>
        )}
      </div>

      {/* Info cards row (like Lovable) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">AVANCE</p>
          <p className="text-2xl font-bold">{project.progress||0}%</p>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full ${(project.progress||0)>=80?'bg-green-500':(project.progress||0)>=50?'bg-blue-500':'bg-amber-500'}`} style={{width:`${project.progress||0}%`}}/>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">ETAPA ACTUAL</p>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STAGE_COLOR[project.scrum_stage]||'bg-gray-100 text-gray-600'}`}>{project.scrum_stage}</span>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">GO LIVE REAL</p>
          <p className="text-sm font-medium">{fmt(project.go_live_date)}</p>
        </div>
        {delay > 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-xs text-red-600 font-medium mb-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> RETRASO</p>
            <p className="text-2xl font-bold text-red-600">{delay} días</p>
            {delayPct > 0 && <p className="text-xs text-red-500 mt-1">({delayPct}%)</p>}
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-xs text-green-600 font-medium mb-1">ESTADO</p>
            <p className="text-sm font-medium text-green-700">En tiempo</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          {project.description && (
            <div className="bg-card border rounded-xl p-5">
              <h2 className="font-semibold mb-2">Descripción</h2>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
          )}

          {/* Dates */}
          <div className="bg-card border rounded-xl p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Calendar className="h-4 w-4 text-primary"/> Fechas del Proyecto</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-[10px] text-muted-foreground">Inicio Proyecto</p><p className="text-sm font-medium">{fmt(project.project_start_date)}</p></div>
              <div><p className="text-[10px] text-muted-foreground">Inicio Desarrollo</p><p className="text-sm font-medium">{fmt(project.dev_start_date)}</p></div>
              <div><p className="text-[10px] text-muted-foreground">Fin Desarrollo</p><p className="text-sm font-medium">{fmt(project.dev_end_date)}</p></div>
              <div><p className="text-[10px] text-muted-foreground">Inicio Pruebas</p><p className="text-sm font-medium">{fmt(project.test_start_date)}</p></div>
              <div><p className="text-[10px] text-muted-foreground">Fin Pruebas</p><p className="text-sm font-medium">{fmt(project.test_end_date)}</p></div>
              <div><p className="text-[10px] text-muted-foreground">Go Live Planeado</p><p className="text-sm font-medium">{fmt(project.planned_go_live_date)}</p></div>
              <div><p className="text-[10px] text-muted-foreground">Go Live Real</p><p className="text-sm font-medium">{fmt(project.go_live_date)}</p></div>
            </div>
          </div>

          {/* Comments */}
          <div className="bg-card border rounded-xl p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary"/> Comentarios del Proyecto
              <span className="text-xs text-muted-foreground font-normal">({comments.length})</span>
            </h2>
            <div className="flex gap-2 mb-4">
              <textarea value={newComment} onChange={e=>setNewComment(e.target.value)}
                placeholder="Escribe un comentario... (Ctrl+Enter para enviar)" rows={2}
                className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                onKeyDown={e=>{ if(e.key==='Enter'&&e.ctrlKey&&newComment.trim()) addComment.mutate() }}/>
              <button onClick={()=>newComment.trim()&&addComment.mutate()} disabled={!newComment.trim()||addComment.isPending}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 self-end transition-colors">
                {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
              </button>
            </div>
            {comments.length===0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin comentarios.</p>
            ) : (
              <div className="space-y-3">
                {comments.map(c=>(
                  <div key={c.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-primary">{(c.author_name||'U').charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium">{c.author_name||'Usuario'}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{fmtDT(c.created_at)}</span>
                          {isManager && <button onClick={()=>deleteComment.mutate(c.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3"/></button>}
                        </div>
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Files */}
          <div className="bg-card border rounded-xl p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-primary"/> Archivos Anexos
              <span className="text-xs text-muted-foreground font-normal">({files.length})</span>
            </h2>
            {files.length===0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin archivos anexos.</p>
            ) : (
              <div className="space-y-2">
                {files.map(f=>(
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Paperclip className="h-4 w-4 text-muted-foreground"/>
                      <div>
                        <p className="text-sm font-medium">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{f.uploader_name||'Usuario'} · {fmt(f.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status History */}
          <div className="bg-card border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-primary"/> Historial de Estatus <span className="text-xs text-muted-foreground font-normal">({statusHistory.length})</span></h2>
              {isManager && (
                <button onClick={()=>setShowStatusForm(!showStatusForm)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  {showStatusForm ? <X className="h-3 w-3"/> : <Plus className="h-3 w-3"/>}
                  {showStatusForm ? 'Cancelar' : 'Agregar'}
                </button>
              )}
            </div>
            {showStatusForm && (
              <div className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Descripción *</label>
                  <textarea className={`${inputCls} mt-1 resize-none`} rows={3} value={statusDesc} onChange={e=>setStatusDesc(e.target.value)} placeholder="¿Qué pasó en este período?"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Etapa</label>
                    <select className={`${inputCls} mt-1`} value={statusStage} onChange={e=>setStatusStage(e.target.value)}>
                      <option value="">Sin cambio</option>
                      {SCRUM_STAGES.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Notas</label>
                    <input className={`${inputCls} mt-1`} value={statusNotes} onChange={e=>setStatusNotes(e.target.value)} placeholder="Observaciones..."/>
                  </div>
                </div>
                <button onClick={()=>statusDesc.trim()&&addStatus.mutate()} disabled={!statusDesc.trim()||addStatus.isPending}
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {addStatus.isPending && <Loader2 className="h-3 w-3 animate-spin"/>}
                  Guardar actualización
                </button>
              </div>
            )}
            {statusHistory.length===0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin registros de estatus.</p>
            ) : (
              <div className="space-y-3">
                {statusHistory.map((s,i) => (
                  <div key={s.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5 shrink-0"/>
                      {i<statusHistory.length-1 && <div className="w-0.5 bg-border flex-1 mt-1"/>}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm">{s.description}</p>
                          {s.notes && <p className="text-xs text-muted-foreground mt-0.5">{s.notes}</p>}
                          <div className="flex items-center gap-2 mt-1">
                            {s.stage && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STAGE_COLOR[s.stage]||'bg-gray-100 text-gray-600'}`}>{s.stage}</span>}
                            <span className="text-xs text-muted-foreground">{s.author_name||'Usuario'} · {fmtDT(s.created_at)}</span>
                          </div>
                        </div>
                        {isManager && (
                          <button onClick={()=>deleteStatus.mutate(s.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                            <Trash2 className="h-3 w-3"/>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-card border rounded-xl p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><User className="h-4 w-4 text-primary"/> Responsable</h2>
            <p className="text-sm">{project.responsible_name||'Sin asignar'}</p>
          </div>

          <div className="bg-card border rounded-xl p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><UserCheck className="h-4 w-4 text-primary"/> Solicitante</h2>
            <p className="text-sm">{project.requestor_name||'Sin asignar'}</p>
          </div>

          {project.priority!==null && (
            <div className="bg-card border rounded-xl p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Tag className="h-4 w-4 text-primary"/> Prioridad</h2>
              <p className="text-2xl font-bold text-primary">#{project.priority}</p>
            </div>
          )}

          <div className="bg-card border rounded-xl p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Tag className="h-4 w-4 text-primary"/> Detalles</h2>
            <div className="space-y-2">
              <div className="flex justify-between py-1"><span className="text-sm text-muted-foreground">Tipo</span><span className="text-sm font-medium">{project.classification || '—'}</span></div>
              <div className="flex justify-between py-1"><span className="text-sm text-muted-foreground">Etapa</span><span className="text-sm font-medium">{project.scrum_stage || '—'}</span></div>
            </div>
          </div>
        </div>
      </div>

      <ProjectFormDialog open={showEdit} onOpenChange={setShowEdit} project={project} portfolioId={project.portfolio_id}/>
    </div>
  )
}
