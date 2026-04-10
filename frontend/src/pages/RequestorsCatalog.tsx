import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { UserCheck, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'

interface Requestor {
  id: string
  name: string
  email: string | null
  company_id: string | null
  company_name: string | null
}

interface Company { id: string; name: string }

export default function RequestorsCatalog() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Requestor | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [companyId, setCompanyId] = useState('')

  const { data: requestors = [], isLoading } = useQuery<Requestor[]>({
    queryKey: ['requestors'],
    queryFn: () => api.get('/api/requestors'),
  })

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: () => api.get('/api/companies'),
  })

  const save = useMutation({
    mutationFn: (body: any) =>
      editing
        ? api.put(`/api/requestors/${editing.id}`, body)
        : api.post('/api/requestors', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requestors'] })
      toast.success(editing ? 'Solicitante actualizado' : 'Solicitante creado')
      resetForm()
    },
    onError: (e: any) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/requestors/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requestors'] })
      toast.success('Solicitante eliminado')
    },
  })

  function resetForm() {
    setShowForm(false)
    setEditing(null)
    setName('')
    setEmail('')
    setCompanyId('')
  }

  function startEdit(r: Requestor) {
    setEditing(r)
    setName(r.name)
    setEmail(r.email || '')
    setCompanyId(r.company_id || '')
    setShowForm(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error('El nombre es requerido')
    save.mutate({ name, email, company_id: companyId || null })
  }

  const inputCls =
    'w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" /> Catálogo de Solicitantes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personas que solicitan proyectos, mejoras u ofertas
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Nuevo
        </button>
      </div>

      {showForm && (
        <div className="bg-card border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{editing ? 'Editar solicitante' : 'Nuevo solicitante'}</h2>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nombre *</label>
                <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Nombre completo" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Correo</label>
                <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@axtel.com.mx" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Empresa</label>
                <select className={inputCls} value={companyId} onChange={e => setCompanyId(e.target.value)}>
                  <option value="">Sin empresa</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border text-sm hover:bg-muted transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={save.isPending} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? 'Guardar cambios' : 'Crear solicitante'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : requestors.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">No hay solicitantes registrados</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Solicitante</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Correo</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Empresa</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requestors.map(r => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{r.email || '—'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{r.company_name || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(r)} className="text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => { if (confirm('¿Eliminar este solicitante?')) remove.mutate(r.id) }}
                        className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
