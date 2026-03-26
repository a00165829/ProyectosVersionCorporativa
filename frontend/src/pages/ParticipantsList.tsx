import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Loader2, X, Users } from 'lucide-react'

interface Participant { id: string; name: string; email: string|null; company_id: string|null; company_name: string|null; assignment_count: number }
interface Company { id: string; name: string }

export default function ParticipantsList() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Participant|null>(null)
  const [fName, setFName] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fCompany, setFCompany] = useState('')

  const { data: items=[], isLoading } = useQuery<Participant[]>({
    queryKey: ['participants'], queryFn: () => api.get('/api/participants'),
  })
  const { data: companies=[] } = useQuery<Company[]>({
    queryKey: ['companies'], queryFn: () => api.get('/api/companies'),
  })

  const save = useMutation({
    mutationFn: (body: any) => editing
      ? api.put(`/api/participants/${editing.id}`, body)
      : api.post('/api/participants', body),
    onSuccess: () => { qc.invalidateQueries({queryKey:['participants']}); toast.success('Guardado'); closeForm() },
    onError: (e:any) => toast.error(e.message),
  })
  const remove = useMutation({
    mutationFn: (id:string) => api.delete(`/api/participants/${id}`),
    onSuccess: () => { qc.invalidateQueries({queryKey:['participants']}); toast.success('Eliminado') },
  })

  const closeForm = () => { setShowForm(false); setEditing(null); setFName(''); setFEmail(''); setFCompany('') }
  const openEdit = (p: Participant) => { setEditing(p); setFName(p.name); setFEmail(p.email||''); setFCompany(p.company_id||''); setShowForm(true) }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fName.trim()) return toast.error('Nombre requerido')
    save.mutate({ name: fName.trim(), email: fEmail.trim()||null, company_id: fCompany||null })
  }

  const inputCls = "w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Líderes / Participantes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} registros</p>
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
              <h2 className="font-semibold text-lg">{editing?'Editar':'Nuevo'} Participante</h2>
              <button onClick={closeForm}><X className="h-5 w-5 text-muted-foreground"/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nombre *</label>
                <input className={`${inputCls} mt-1`} value={fName} onChange={e=>setFName(e.target.value)} placeholder="Nombre completo"/>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <input className={`${inputCls} mt-1`} type="email" value={fEmail} onChange={e=>setFEmail(e.target.value)} placeholder="correo@empresa.com"/>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Empresa</label>
                <select className={`${inputCls} mt-1`} value={fCompany} onChange={e=>setFCompany(e.target.value)}>
                  <option value="">Sin empresa</option>
                  {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
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
            <Users className="h-10 w-10 mb-3 opacity-30"/><p className="text-sm">No hay participantes</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Empresa</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Asignaciones</th>
                <th className="w-20"/>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(p=>(
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5 font-medium">{p.name}</td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{p.email||'—'}</td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell">{p.company_name||'—'}</td>
                  <td className="px-5 py-3.5 text-right hidden md:table-cell">{p.assignment_count||0}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={()=>openEdit(p)} className="p-1.5 rounded hover:bg-muted transition-colors"><Edit className="h-3.5 w-3.5 text-muted-foreground"/></button>
                      <button onClick={()=>remove.mutate(p.id)} className="p-1.5 rounded hover:bg-muted transition-colors"><Trash2 className="h-3.5 w-3.5 text-muted-foreground"/></button>
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
