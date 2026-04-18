import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Save, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

/**
 * Campos del schema real de `projects` (coincide con backend/src/routes/projects.ts
 * y con la interfaz Project de ProjectsList.tsx).
 */
interface ProjectData {
  id?: string
  name?: string
  description?: string | null
  scrum_stage?: string
  classification?: string
  priority?: number | null
  progress?: number
  responsible_id?: string | null
  requestor_id?: string | null
  structure_id?: string | null
  project_start_date?: string | null
  dev_start_date?: string | null
  dev_end_date?: string | null
  test_start_date?: string | null
  test_end_date?: string | null
  planned_go_live_date?: string | null
  go_live_date?: string | null
  portfolio_id?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: ProjectData
  portfolioId: string
}

const SCRUM_STAGES = [
  'Backlog', 'Análisis / Diseño', 'Sprint Planning', 'En Desarrollo',
  'Code Review', 'QA / Pruebas', 'UAT', 'Pre-Producción',
  'Go Live', 'Completado', 'En Pausa', 'Por Iniciar', 'Cancelado',
]

const CLASSIFICATIONS = ['Proyecto', 'Mejora', 'Soporte', 'Incidente']

// Backend espera YYYY-MM-DD o null. Convertimos input <date> vacío a null.
const toDateOrNull = (v?: string | null): string | null => {
  if (!v) return null
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null
}

// Convierte cualquier fecha (timestamp ISO, Date) a YYYY-MM-DD para <input type="date">
const toInputDate = (v?: string | null): string => {
  if (!v) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
  const d = new Date(v)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

export default function ProjectFormDialog({ open, onOpenChange, project, portfolioId }: Props) {
  const qc = useQueryClient()
  const isEdit = !!project?.id

  const [form, setForm] = useState<ProjectData>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form cuando se abre o cambia el proyecto
  useEffect(() => {
    if (!open) return
    setError(null)
    setForm({
      name: project?.name ?? '',
      description: project?.description ?? '',
      scrum_stage: project?.scrum_stage ?? 'Backlog',
      classification: project?.classification ?? 'Proyecto',
      priority: project?.priority ?? null,
      progress: project?.progress ?? 0,
      responsible_id: project?.responsible_id ?? null,
      requestor_id: project?.requestor_id ?? null,
      structure_id: project?.structure_id ?? null,
      project_start_date: toInputDate(project?.project_start_date),
      dev_start_date: toInputDate(project?.dev_start_date),
      dev_end_date: toInputDate(project?.dev_end_date),
      test_start_date: toInputDate(project?.test_start_date),
      test_end_date: toInputDate(project?.test_end_date),
      planned_go_live_date: toInputDate(project?.planned_go_live_date),
      go_live_date: toInputDate(project?.go_live_date),
      portfolio_id: project?.portfolio_id ?? portfolioId,
    })
  }, [open, project, portfolioId])

  // ── Catálogos ──────────────────────────────────────────────────────────────
  const { data: participants = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['participants'],
    queryFn: () => api.get('/api/participants'),
    enabled: open,
  })
  const { data: requestors = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['requestors'],
    queryFn: () => api.get('/api/requestors'),
    enabled: open,
  })
  const { data: structures = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['structures', portfolioId],
    queryFn: () => api.get(`/api/structures?portfolio_id=${portfolioId}`),
    enabled: open && !!portfolioId,
  })

  if (!open) return null

  const setField = <K extends keyof ProjectData>(k: K, v: ProjectData[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    if (!form.name?.trim()) {
      setError('El nombre del proyecto es obligatorio')
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      name: form.name?.trim(),
      description: form.description ?? '',
      scrum_stage: form.scrum_stage,
      classification: form.classification,
      priority: form.priority ?? null,
      progress: form.progress ?? 0,
      responsible_id: form.responsible_id || null,
      requestor_id: form.requestor_id || null,
      structure_id: form.structure_id || null,
      project_start_date: toDateOrNull(form.project_start_date),
      dev_start_date:     toDateOrNull(form.dev_start_date),
      dev_end_date:       toDateOrNull(form.dev_end_date),
      test_start_date:    toDateOrNull(form.test_start_date),
      test_end_date:      toDateOrNull(form.test_end_date),
      planned_go_live_date: toDateOrNull(form.planned_go_live_date),
      go_live_date:         toDateOrNull(form.go_live_date),
      portfolio_id: form.portfolio_id || portfolioId,
    }

    try {
      if (isEdit) {
        await api.put(`/api/projects/${project!.id}`, payload)
      } else {
        await api.post('/api/projects', payload)
      }
      // Refrescar listas afectadas
      await qc.invalidateQueries({ queryKey: ['projects'] })
      if (isEdit) await qc.invalidateQueries({ queryKey: ['project', project!.id] })
      onOpenChange(false)
    } catch (err: any) {
      console.error('❌ Error al guardar proyecto:', err)
      setError(err?.message || 'Error al guardar el proyecto')
    } finally {
      setSaving(false)
    }
  }

  const input = 'w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all'
  const label = 'block text-xs font-semibold text-muted-foreground mb-1.5'

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={() => !saving && onOpenChange(false)}
    >
      <div
        className="bg-card border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">{isEdit ? 'Editar proyecto' : 'Nuevo proyecto'}</h2>
          <button
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body (scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className={label}>Nombre del proyecto *</label>
              <input
                className={input}
                value={form.name ?? ''}
                onChange={e => setField('name', e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className={label}>Descripción</label>
              <textarea
                className={input}
                rows={3}
                value={form.description ?? ''}
                onChange={e => setField('description', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={label}>Etapa</label>
                <select
                  className={input}
                  value={form.scrum_stage ?? 'Backlog'}
                  onChange={e => setField('scrum_stage', e.target.value)}
                >
                  {SCRUM_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className={label}>Clasificación</label>
                <select
                  className={input}
                  value={form.classification ?? 'Proyecto'}
                  onChange={e => setField('classification', e.target.value)}
                >
                  {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className={label}>Líder responsable</label>
                <select
                  className={input}
                  value={form.responsible_id ?? ''}
                  onChange={e => setField('responsible_id', e.target.value || null)}
                >
                  <option value="">— Sin asignar —</option>
                  {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className={label}>Solicitante</label>
                <select
                  className={input}
                  value={form.requestor_id ?? ''}
                  onChange={e => setField('requestor_id', e.target.value || null)}
                >
                  <option value="">— Sin asignar —</option>
                  {requestors.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div>
                <label className={label}>Estructura (presupuesto)</label>
                <select
                  className={input}
                  value={form.structure_id ?? ''}
                  onChange={e => setField('structure_id', e.target.value || null)}
                >
                  <option value="">— Sin estructura —</option>
                  {structures.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className={label}>Prioridad</label>
                <input
                  type="number"
                  min={1}
                  className={input}
                  value={form.priority ?? ''}
                  onChange={e => setField('priority', e.target.value ? parseInt(e.target.value, 10) : null)}
                  placeholder="—"
                />
              </div>
            </div>

            {/* Avance */}
            <div>
              <label className={label}>Avance: {form.progress ?? 0}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={form.progress ?? 0}
                onChange={e => setField('progress', parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={label}>Inicio proyecto</label>
                <input type="date" className={input}
                  value={form.project_start_date ?? ''}
                  onChange={e => setField('project_start_date', e.target.value)} />
              </div>
              <div>
                <label className={label}>Inicio desarrollo</label>
                <input type="date" className={input}
                  value={form.dev_start_date ?? ''}
                  onChange={e => setField('dev_start_date', e.target.value)} />
              </div>
              <div>
                <label className={label}>Fin desarrollo</label>
                <input type="date" className={input}
                  value={form.dev_end_date ?? ''}
                  onChange={e => setField('dev_end_date', e.target.value)} />
              </div>
              <div>
                <label className={label}>Inicio pruebas</label>
                <input type="date" className={input}
                  value={form.test_start_date ?? ''}
                  onChange={e => setField('test_start_date', e.target.value)} />
              </div>
              <div>
                <label className={label}>Fin pruebas</label>
                <input type="date" className={input}
                  value={form.test_end_date ?? ''}
                  onChange={e => setField('test_end_date', e.target.value)} />
              </div>
              <div>
                <label className={label}>Go Live planeado</label>
                <input type="date" className={input}
                  value={form.planned_go_live_date ?? ''}
                  onChange={e => setField('planned_go_live_date', e.target.value)} />
              </div>
            </div>

            {/* Go Live real - destacado */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <label className="block text-xs font-semibold text-primary mb-1.5">
                🎯 Go Live real
              </label>
              <input type="date" className={input}
                value={form.go_live_date ?? ''}
                onChange={e => setField('go_live_date', e.target.value)} />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Al capturar esta fecha (o al pasar la etapa a <strong>Go Live</strong>/<strong>Completado</strong>) el avance se marcará como 100%.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-muted/20">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-lg border hover:bg-muted/40 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Crear proyecto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
