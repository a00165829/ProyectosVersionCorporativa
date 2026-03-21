import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { X, Loader2 } from 'lucide-react'
import type { Project } from '@/pages/ProjectsList'

const SCRUM_STAGES = [
  'Backlog','Análisis / Diseño','Sprint Planning','En Desarrollo',
  'Code Review','QA / Pruebas','UAT','Pre-Producción','Go Live',
]

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  project?: Project
  portfolioId: string
}

interface Participant { id: string; name: string }

export default function ProjectFormDialog({ open, onOpenChange, project, portfolioId }: Props) {
  const qc = useQueryClient()
  const isEdit = !!project

  const [name, setName]             = useState('')
  const [description, setDesc]      = useState('')
  const [classification, setClass]  = useState<'Proyecto'|'Mejora'>('Proyecto')
  const [priority, setPriority]     = useState('')
  const [progress, setProgress]     = useState(0)
  const [stage, setStage]           = useState('Backlog')
  const [responsible, setResp]      = useState('')
  const [devStart, setDevStart]     = useState('')
  const [devEnd, setDevEnd]         = useState('')
  const [testStart, setTestStart]   = useState('')
  const [testEnd, setTestEnd]       = useState('')
  const [plannedGL, setPlannedGL]   = useState('')
  const [goLive, setGoLive]         = useState('')

  useEffect(() => {
    if (project) {
      setName(project.name); setDesc(project.description||'')
      setClass(project.classification||'Proyecto')
      setPriority(project.priority?.toString()||'')
      setProgress(project.progress||0); setStage(project.scrum_stage||'Backlog')
      setResp(project.responsible_id||'')
      setDevStart(project.dev_start_date||'')
      setGoLive(project.go_live_date||'')
      setPlannedGL(project.planned_go_live_date||'')
    } else {
      setName(''); setDesc(''); setClass('Proyecto'); setPriority('')
      setProgress(0); setStage('Backlog'); setResp('')
      setDevStart(''); setDevEnd(''); setTestStart(''); setTestEnd('')
      setPlannedGL(''); setGoLive('')
    }
  }, [project, open])

  const { data: participants=[] } = useQuery<Participant[]>({
    queryKey: ['participants-list'],
    queryFn: () => api.get<Participant[]>('/api/projects/participants/list'),
    enabled: open,
  })

  const save = useMutation({
    mutationFn: (body: any) => isEdit
      ? api.put(`/api/projects/${project!.id}`, body)
      : api.post('/api/projects', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      toast.success(isEdit ? 'Proyecto actualizado' : 'Proyecto creado')
      onOpenChange(false)
    },
    onError: (e: any) => toast.error(e.message),
  })

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('El nombre es requerido')
    save.mutate({
      name: name.trim(), description, classification,
      priority: priority ? parseInt(priority) : null,
      progress, scrum_stage: stage,
      responsible_id: responsible || null,
      portfolio_id: portfolioId,
      dev_start_date: devStart||null, dev_end_date: devEnd||null,
      test_start_date: testStart||null, test_end_date: testEnd||null,
      planned_go_live_date: plannedGL||null, go_live_date: goLive||null,
    })
  }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )

  const inputCls = "w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)}/>
      <div className="relative bg-card border rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-card">
          <h2 className="font-semibold text-lg">{isEdit ? 'Editar proyecto' : 'Nuevo proyecto'}</h2>
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Nombre *">
            <input className={inputCls} value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre del proyecto"/>
          </Field>

          <Field label="Descripción">
            <textarea className={`${inputCls} resize-none`} rows={2} value={description} onChange={e=>setDesc(e.target.value)} placeholder="Descripción breve"/>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo">
              <select className={inputCls} value={classification} onChange={e=>setClass(e.target.value as any)}>
                <option value="Proyecto">Proyecto</option>
                <option value="Mejora">Mejora</option>
              </select>
            </Field>
            <Field label="Prioridad">
              <input className={inputCls} type="number" min="1" value={priority} onChange={e=>setPriority(e.target.value)} placeholder="Ej: 1"/>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Etapa">
              <select className={inputCls} value={stage} onChange={e=>setStage(e.target.value)}>
                {SCRUM_STAGES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Líder">
              <select className={inputCls} value={responsible} onChange={e=>setResp(e.target.value)}>
                <option value="">Sin asignar</option>
                {participants.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
          </div>

          <Field label={`Avance: ${progress}%`}>
            <input type="range" min="0" max="100" value={progress} onChange={e=>setProgress(parseInt(e.target.value))}
              className="w-full accent-primary"/>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Inicio desarrollo">
              <input className={inputCls} type="date" value={devStart} onChange={e=>setDevStart(e.target.value)}/>
            </Field>
            <Field label="Fin desarrollo">
              <input className={inputCls} type="date" value={devEnd} onChange={e=>setDevEnd(e.target.value)}/>
            </Field>
            <Field label="Inicio pruebas">
              <input className={inputCls} type="date" value={testStart} onChange={e=>setTestStart(e.target.value)}/>
            </Field>
            <Field label="Fin pruebas">
              <input className={inputCls} type="date" value={testEnd} onChange={e=>setTestEnd(e.target.value)}/>
            </Field>
            <Field label="Go Live planeado">
              <input className={inputCls} type="date" value={plannedGL} onChange={e=>setPlannedGL(e.target.value)}/>
            </Field>
            <Field label="Go Live real">
              <input className={inputCls} type="date" value={goLive} onChange={e=>setGoLive(e.target.value)}/>
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={()=>onOpenChange(false)}
              className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={save.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin"/>}
              {isEdit ? 'Guardar cambios' : 'Crear proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
