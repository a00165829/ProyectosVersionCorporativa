import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Loader2, X, HardDrive } from 'lucide-react'

interface Resource { id: string; name: string; cost_usd: number|string }

const num = (v: any) => parseFloat(String(v)) || 0
const fmtUSD = (n: number) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', minimumFractionDigits:2 }).format(n)

export default function ResourcesCatalog() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Resource|null>(null)
  const [fName, setFName] = useState('')
  const [fCost, setFCost] = useState('')

  const { data: items=[], isLoading } = useQuery<Resource[]>({
    queryKey: ['resources'], queryFn: () => api.get('/api/resources'),
  })

  const save = useMutation({
    mutationFn: (body: any) => editing
      ? api.put(`/api/resources/${editing.id}`, body)
      : api.post('/api/resources', body),
    onSuccess: () => { qc.invalidateQueries({queryKey:['resources']}); toast.success('Guardado'); closeForm() },
    onError: (e:any) => toast.error(e.message),
  })
  const remove = useMutation({
    mutationFn: (id:string) => api.delete(`/api/resources/${id}`),
    onSuccess: () => { qc.invalidateQueries({queryKey:['resources']}); toast.success('Eliminado') },
  })

  const closeForm = () => { setShowForm(false); setEditing(null); setFName(''); setFCost('') }
  const openEdit = (r: Resource) => { setEditing(r); setFName(r.name); setFCost(String(num(r.cost_usd))); setShowForm(true) }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fName.trim()) return toast.error('Nombre requerido')
    save.mutate({ name: fName.trim(), cost_usd: parseFloat(fCost)||0 })
  }

  const inputCls = "w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Catálogo de Recursos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} recursos</p>
        </div>
        <button onClick={()=>{setEditing(null);setShowForm(true)}}
          className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4"/> Nuevo
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeForm}/>
          <div className="relative bg-card border rounded-2xl shadow-xl w-full max-w-md m-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">{editing?'Editar':'Nuevo'} Recurso</h2>
              <button onClick={closeForm}><X className="h-5 w-5 text-muted-foreground"/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nombre *</label>
                <input className={`${inputCls} mt-1`} value={fName} onChange={e=>setFName(e.target.value)} placeholder="Nombre del recurso"/>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Costo por día (USD)</label>
                <input className={`${inputCls} mt-1`} type="number" step="0.01" value={fCost} onChange={e=>setFCost(e.target.value)} placeholder="0.00"/>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
                <button type="submit" disabled={save.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {save.isPending && <Loader2 className="h-4 w-4 animate-spin"/>} Guardar
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
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <HardDrive className="h-10 w-10 mb-3 opacity-30"/><p className="text-sm">No hay recursos</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Nombre</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Costo/día (USD)</th>
                <th className="w-20"/>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(r=>(
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5 font-medium">{r.name}</td>
                  <td className="px-5 py-3.5 text-right">{fmtUSD(num(r.cost_usd))}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={()=>openEdit(r)} className="p-1.5 rounded hover:bg-muted transition-colors"><Edit className="h-3.5 w-3.5 text-muted-foreground"/></button>
                      <button onClick={()=>remove.mutate(r.id)} className="p-1.5 rounded hover:bg-muted transition-colors"><Trash2 className="h-3.5 w-3.5 text-muted-foreground"/></button>
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
