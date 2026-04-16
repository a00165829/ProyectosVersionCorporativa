import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Loader2, X, HardDrive, User, DollarSign, Mail } from 'lucide-react'

interface Skill { id: string; name: string }
interface Participant { id: string; name: string }
interface Resource {
  id: string
  name: string
  email: string | null
  leader_id: string | null
  leader_name: string | null
  cost_usd_monthly: number | string
  cost_usd: number | string
  skills: Skill[]
}

const num = (v: any) => parseFloat(String(v)) || 0
const fmtUSD = (n: number) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', minimumFractionDigits:0 }).format(n)

export default function ResourcesCatalog() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Resource|null>(null)
  const [fName, setFName] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fLeaderId, setFLeaderId] = useState('')
  const [fCost, setFCost] = useState('')
  const [fSkillIds, setFSkillIds] = useState<string[]>([])

  const { data: items=[], isLoading } = useQuery<Resource[]>({
    queryKey: ['resources'], queryFn: () => api.get('/api/resources'),
  })
  const { data: skills=[] } = useQuery<Skill[]>({
    queryKey: ['skills'], queryFn: () => api.get('/api/resources/skills'),
  })
  const { data: participants=[] } = useQuery<Participant[]>({
    queryKey: ['participants'], queryFn: () => api.get('/api/participants'),
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

  const closeForm = () => {
    setShowForm(false); setEditing(null)
    setFName(''); setFEmail(''); setFLeaderId(''); setFCost(''); setFSkillIds([])
  }
  const openEdit = (r: Resource) => {
    setEditing(r)
    setFName(r.name)
    setFEmail(r.email || '')
    setFLeaderId(r.leader_id || '')
    setFCost(String(num(r.cost_usd_monthly)))
    setFSkillIds(r.skills.map(s => s.id))
    setShowForm(true)
  }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fName.trim()) return toast.error('Nombre requerido')
    save.mutate({
      name: fName.trim(),
      email: fEmail.trim() || null,
      leader_id: fLeaderId || null,
      cost_usd_monthly: parseFloat(fCost) || 0,
      skill_ids: fSkillIds,
    })
  }
  const toggleSkill = (id: string) => {
    setFSkillIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
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
          <div className="relative bg-card border rounded-2xl shadow-xl w-full max-w-xl m-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">{editing?'Editar':'Nuevo'} Recurso</h2>
              <button onClick={closeForm}><X className="h-5 w-5 text-muted-foreground"/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nombre *</label>
                  <input className={`${inputCls} mt-1`} value={fName} onChange={e=>setFName(e.target.value)} placeholder="Nombre del recurso"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <input className={`${inputCls} mt-1`} type="email" value={fEmail} onChange={e=>setFEmail(e.target.value)} placeholder="correo@axtel.com.mx"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Líder</label>
                  <select className={`${inputCls} mt-1`} value={fLeaderId} onChange={e=>setFLeaderId(e.target.value)}>
                    <option value="">Sin líder asignado</option>
                    {participants.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Costo en Dólares (USD/mes)</label>
                  <input className={`${inputCls} mt-1`} type="number" step="0.01" value={fCost} onChange={e=>setFCost(e.target.value)} placeholder="0.00"/>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Skills</label>
                <div className="mt-2 border rounded-lg p-3 max-h-48 overflow-y-auto bg-muted/20">
                  <div className="flex flex-wrap gap-2">
                    {skills.map(s => {
                      const selected = fSkillIds.includes(s.id)
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleSkill(s.id)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                            selected
                              ? 'bg-primary text-primary-foreground border-primary font-semibold'
                              : 'bg-background border-border text-foreground hover:border-primary/50'
                          }`}
                        >
                          {s.name}
                        </button>
                      )
                    })}
                    {skills.length === 0 && (
                      <p className="text-xs text-muted-foreground">No hay skills en el catálogo</p>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {fSkillIds.length} skill{fSkillIds.length !== 1 ? 's' : ''} seleccionado{fSkillIds.length !== 1 ? 's' : ''}
                </p>
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
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Líder</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden xl:table-cell">Skills</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Costo USD/mes</th>
                <th className="w-20"/>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(r=>(
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5 font-medium">{r.name}</td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs hidden md:table-cell">{r.email || '—'}</td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs hidden lg:table-cell">{r.leader_name || '—'}</td>
                  <td className="px-5 py-3.5 hidden xl:table-cell">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {r.skills.slice(0, 3).map(s => (
                        <span key={s.id} className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                          {s.name}
                        </span>
                      ))}
                      {r.skills.length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                          +{r.skills.length - 3}
                        </span>
                      )}
                      {r.skills.length === 0 && <span className="text-xs text-muted-foreground/40">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium">{fmtUSD(num(r.cost_usd_monthly))}</td>
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
