import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { usePortfolio } from '@/context/PortfolioContext'
import { toast } from 'sonner'
import { Building2, Plus, Edit, Trash2, Loader2, X } from 'lucide-react'

interface Structure {
  id: string; name: string; total_budget: number
  used_amount: number; portfolio_id: string | null; created_at: string
}

const fmt = (n: number) => new Intl.NumberFormat('es-MX', {
  style: 'currency', currency: 'MXN', minimumFractionDigits: 0
}).format(n || 0)

export default function Structures() {
  const { isManager } = useAuth()
  const { activePortfolioId, activePortfolio } = usePortfolio()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Structure | null>(null)
  const [fName, setFName] = useState('')
  const [fAmount, setFAmount] = useState('')

  const { data: structures = [], isLoading } = useQuery<Structure[]>({
    queryKey: ['structures'],
    queryFn: () => api.get<Structure[]>('/api/structures'),
  })

  const save = useMutation({
    mutationFn: (body: any) => editing
      ? api.put(`/api/structures/${editing.id}`, body)
      : api.post('/api/structures', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['structures'] })
      toast.success(editing ? 'Estructura actualizada' : 'Estructura creada')
      setShowForm(false); setEditing(null); setFName(''); setFAmount('')
    },
    onError: (e: any) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/structures/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['structures'] }); toast.success('Eliminada') },
  })

  const openEdit = (s: Structure) => {
    setEditing(s); setFName(s.name); setFAmount(String(s.total_budget)); setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fName.trim()) return toast.error('Nombre requerido')
    save.mutate({ name: fName.trim(), total_budget: parseFloat(fAmount) || 0, portfolio_id: activePortfolioId })
  }

  const inputCls = "w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estructuras Presupuestales</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{activePortfolio?.name}</p>
        </div>
        {isManager && (
          <button onClick={() => { setEditing(null); setFName(''); setFAmount(''); setShowForm(true) }}
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4"/> Nueva estructura
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)}/>
          <div className="relative bg-card border rounded-2xl shadow-xl w-full max-w-md m-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">{editing ? 'Editar' : 'Nueva'} estructura</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-muted-foreground"/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nombre *</label>
                <input className={`${inputCls} mt-1`} value={fName} onChange={e => setFName(e.target.value)} placeholder="Ej: COL_JUS_001"/>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Monto autorizado (MXN)</label>
                <input className={`${inputCls} mt-1`} type="number" value={fAmount} onChange={e => setFAmount(e.target.value)} placeholder="0"/>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
                <button type="submit" disabled={save.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {save.isPending && <Loader2 className="h-4 w-4 animate-spin"/>}
                  {editing ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent"/>
        </div>
      ) : structures.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-xl text-muted-foreground">
          <Building2 className="h-10 w-10 mb-3 opacity-30"/>
          <p className="text-sm">No hay estructuras registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {structures.map(s => {
            const used = s.used_amount || 0
            const total = s.total_budget || 0
            const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0
            const available = total - used
            const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'
            return (
              <div key={s.id} className="bg-card border rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{s.name}</h3>
                  {isManager && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-muted transition-colors">
                        <Edit className="h-3.5 w-3.5 text-muted-foreground"/>
                      </button>
                      <button onClick={() => remove.mutate(s.id)} className="p-1.5 rounded hover:bg-muted transition-colors">
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground"/>
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Autorizado</span>
                    <span className="font-medium">{fmt(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Utilizado</span>
                    <span className="font-medium">{fmt(used)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }}/>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{pct}% utilizado</span>
                    <span className={available >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {fmt(available)} disponible
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}