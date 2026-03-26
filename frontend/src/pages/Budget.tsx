import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { usePortfolio } from '@/context/PortfolioContext'
import { toast } from 'sonner'
import { DollarSign, Plus, Edit, Trash2, Loader2, X, Paperclip } from 'lucide-react'

interface BudgetRecord {
  id: string; project_id: string; project_name: string; portfolio_name: string
  structure_id: string|null; structure_name: string|null
  authorized_amount: number|string; spent_amount: number|string
  authorization_date: string|null; comments: string; deleted_at: string|null
  budget_type: string; budget_status: string; cost_center: string
}
interface Structure { id: string; name: string; total_budget: number }
interface Portfolio { id: string; name: string }

const num = (v: any) => parseFloat(String(v)) || 0

const fmt = (n: number) => new Intl.NumberFormat('es-MX', {
  style: 'currency', currency: 'MXN', minimumFractionDigits: 0
}).format(n || 0)

const fmtDate = (d: string|null) => d
  ? new Date(d).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' })
  : '—'

const BUDGET_STATUSES = ['Pendiente de autorizar', 'Autorizado']
const BUDGET_TYPES = ['CAPEX', 'OPEX']

export default function Budget() {
  const { isManager } = useAuth()
  const { activePortfolioId, activePortfolio, portfolios } = usePortfolio()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<BudgetRecord | null>(null)

  // Form fields
  const [fPortfolio, setFPortfolio] = useState('')
  const [fProject, setFProject] = useState('')
  const [fStructure, setFStructure] = useState('')
  const [fAuthorized, setFAuthorized] = useState('')
  const [fSpent, setFSpent] = useState('0')
  const [fDate, setFDate] = useState('')
  const [fComments, setFComments] = useState('')
  const [fBudgetStatus, setFBudgetStatus] = useState('Pendiente de autorizar')
  const [fBudgetType, setFBudgetType] = useState('CAPEX')
  const [fCostCenter, setFCostCenter] = useState('Pendiente')

  const { data: records = [], isLoading } = useQuery<BudgetRecord[]>({
    queryKey: ['budget', activePortfolioId],
    queryFn: () => api.get<BudgetRecord[]>(`/api/budget?portfolio_id=${activePortfolioId}`),
    enabled: !!activePortfolioId,
  })

  const { data: structures = [] } = useQuery<Structure[]>({
    queryKey: ['structures', activePortfolioId],
    queryFn: () => api.get<Structure[]>(`/api/structures?portfolio_id=${activePortfolioId}`),
    enabled: !!activePortfolioId,
  })

  // Load projects based on selected portfolio in form (or active portfolio)
  const formPortfolioId = fPortfolio || activePortfolioId
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ['projects', formPortfolioId],
    queryFn: () => api.get<any[]>(`/api/projects?portfolio_id=${formPortfolioId}`),
    enabled: !!formPortfolioId,
  })

  const active = records.filter(r => !r.deleted_at)
  const totalAuthorized = active.reduce((s, r) => s + num(r.authorized_amount), 0)
  const totalSpent = active.reduce((s, r) => s + num(r.spent_amount), 0)

  const save = useMutation({
    mutationFn: (body: any) => editing
      ? api.put(`/api/budget/${editing.id}`, body)
      : api.post('/api/budget', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget'] })
      toast.success(editing ? 'Actualizado' : 'Registrado')
      closeForm()
    },
    onError: (e: any) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/budget/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budget'] }); toast.success('Eliminado') },
  })

  const closeForm = () => {
    setShowForm(false); setEditing(null)
    setFPortfolio(''); setFProject(''); setFStructure('')
    setFAuthorized(''); setFSpent('0'); setFDate(''); setFComments('')
    setFBudgetStatus('Pendiente de autorizar'); setFBudgetType('CAPEX'); setFCostCenter('Pendiente')
  }

  const openNew = () => {
    setEditing(null)
    setFPortfolio(activePortfolioId || '')
    setShowForm(true)
  }

  const openEdit = (r: BudgetRecord) => {
    setEditing(r)
    setFPortfolio('') // will use activePortfolioId
    setFProject(r.project_id)
    setFStructure(r.structure_id || '')
    setFAuthorized(String(num(r.authorized_amount)))
    setFSpent(String(num(r.spent_amount)))
    setFDate(r.authorization_date?.split('T')[0] || '')
    setFComments(r.comments || '')
    setFBudgetStatus(r.budget_status || 'Pendiente de autorizar')
    setFBudgetType(r.budget_type || 'CAPEX')
    setFCostCenter(r.cost_center || 'Pendiente')
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fProject) return toast.error('Selecciona un proyecto')
    if (!fStructure) return toast.error('Selecciona una estructura presupuestal')
    save.mutate({
      project_id: fProject, structure_id: fStructure || null,
      authorized_amount: parseFloat(fAuthorized) || 0,
      spent_amount: parseFloat(fSpent) || 0,
      authorization_date: fDate || null, comments: fComments,
      budget_status: fBudgetStatus, budget_type: fBudgetType,
      cost_center: fCostCenter,
    })
  }

  const inputCls = "w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Presupuesto</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{activePortfolio?.name}</p>
        </div>
        {isManager && (
          <button onClick={openNew}
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4"/> Nuevo registro
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Total autorizado</p>
          <p className="text-2xl font-bold text-primary mt-1">{fmt(totalAuthorized)}</p>
        </div>
        <div className="bg-card border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Total ejercido</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{fmt(totalSpent)}</p>
        </div>
        <div className="bg-card border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Disponible</p>
          <p className={`text-2xl font-bold mt-1 ${totalAuthorized - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {fmt(totalAuthorized - totalSpent)}
          </p>
        </div>
      </div>

      {/* ── Modal formulario ─────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeForm}/>
          <div className="relative bg-card border rounded-2xl shadow-xl w-full max-w-lg m-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">{editing ? 'Editar' : 'Nuevo'} Presupuesto</h2>
              <button onClick={closeForm}><X className="h-5 w-5 text-muted-foreground"/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Portafolio + Proyecto */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Portafolio *</label>
                  <select className={`${inputCls} mt-1`} value={fPortfolio || activePortfolioId || ''}
                    onChange={e => { setFPortfolio(e.target.value); setFProject('') }}>
                    {(portfolios || []).map((po: any) => (
                      <option key={po.id} value={po.id}>{po.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Proyecto *</label>
                  <select className={`${inputCls} mt-1`} value={fProject} onChange={e => setFProject(e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Estructura presupuestal */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Estructura Presupuestal *</label>
                <select className={`${inputCls} mt-1`} value={fStructure} onChange={e => setFStructure(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {structures.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {fmt(num(s.total_budget))}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estatus + Tipo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Estatus de Autorización *</label>
                  <select className={`${inputCls} mt-1`} value={fBudgetStatus} onChange={e => setFBudgetStatus(e.target.value)}>
                    {BUDGET_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tipo de Presupuesto *</label>
                  <select className={`${inputCls} mt-1`} value={fBudgetType} onChange={e => setFBudgetType(e.target.value)}>
                    {BUDGET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Montos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Monto autorizado</label>
                  <input className={`${inputCls} mt-1`} type="number" step="0.01" value={fAuthorized}
                    onChange={e => setFAuthorized(e.target.value)} placeholder="0"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Monto ejercido</label>
                  <input className={`${inputCls} mt-1`} type="number" step="0.01" value={fSpent}
                    onChange={e => setFSpent(e.target.value)} placeholder="0"/>
                </div>
              </div>

              {/* Centro de costos + Fecha */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Centro de Costos</label>
                  <input className={`${inputCls} mt-1`} value={fCostCenter}
                    onChange={e => setFCostCenter(e.target.value)} placeholder="Pendiente"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Fecha de Autorización</label>
                  <input className={`${inputCls} mt-1`} type="date" value={fDate}
                    onChange={e => setFDate(e.target.value)}/>
                </div>
              </div>

              {/* Comentarios */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Comentarios</label>
                <textarea className={`${inputCls} mt-1 resize-none`} rows={3} value={fComments}
                  onChange={e => setFComments(e.target.value)}
                  placeholder="Observaciones, motivo de solicitud, notas financieras..."/>
              </div>

              {/* Archivos Anexos (visual, funcionalidad de subida requiere S3) */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Archivos Anexos</p>
                <div className="border border-dashed rounded-lg p-3 text-center text-sm text-muted-foreground">
                  <Paperclip className="h-4 w-4 inline mr-1.5 -mt-0.5"/>
                  Adjuntar archivo
                  <p className="text-[10px] mt-1">(Disponible cuando se configure almacenamiento S3)</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm}
                  className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
                <button type="submit" disabled={save.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {save.isPending && <Loader2 className="h-4 w-4 animate-spin"/>}
                  {editing ? 'Guardar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Tabla ─────────────────────────────────────────────────────────── */}
      <div className="bg-card border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent"/>
          </div>
        ) : active.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <DollarSign className="h-10 w-10 mb-3 opacity-30"/>
            <p className="text-sm">No hay registros de presupuesto</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Proyecto</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Estructura</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Tipo</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Estatus</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Autorizado</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Ejercido</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden xl:table-cell">Fecha</th>
                  {isManager && <th className="w-20"/>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {active.map(r => {
                  const auth = num(r.authorized_amount)
                  const spent = num(r.spent_amount)
                  const pct = auth > 0 ? Math.round((spent / auth) * 100) : 0
                  return (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium">{r.project_name}</p>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{r.structure_name || '—'}</td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          r.budget_type === 'CAPEX' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>{r.budget_type || 'CAPEX'}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          r.budget_status === 'Autorizado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>{r.budget_status || 'Pendiente'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium">{fmt(auth)}</td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(100, pct)}%` }}/>
                          </div>
                          <span className="text-right w-20">{fmt(spent)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden xl:table-cell">{fmtDate(r.authorization_date)}</td>
                      {isManager && (
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-muted transition-colors">
                              <Edit className="h-3.5 w-3.5 text-muted-foreground"/>
                            </button>
                            <button onClick={() => remove.mutate(r.id)} className="p-1.5 rounded hover:bg-muted transition-colors">
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground"/>
                            </button>
                          </div>
                        </td>
                      )}
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
