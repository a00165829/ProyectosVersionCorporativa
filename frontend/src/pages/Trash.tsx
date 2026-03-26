import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Trash2, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface TrashItem { id: string; name: string; type: string; deleted_at: string }
interface TrashData {
  projects: TrashItem[]; budgets: TrashItem[]; structures: TrashItem[]
  activities: TrashItem[]; participants: TrashItem[]; assignments: TrashItem[]
  companies: TrashItem[]
}

const TYPE_LABELS: Record<string, string> = {
  project: 'Proyecto', budget: 'Presupuesto', structure: 'Estructura',
  activity: 'Actividad', participant: 'Participante', assignment: 'Asignación',
  company: 'Empresa',
}

const fmtDT = (d: string) => new Date(d).toLocaleDateString('es-MX', {
  day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
})

export default function Trash() {
  const qc = useQueryClient()
  const [showEmpty, setShowEmpty] = useState(false)

  const { data, isLoading } = useQuery<TrashData>({
    queryKey: ['trash'],
    queryFn: () => api.get('/api/trash'),
  })

  const restore = useMutation({
    mutationFn: (body: { id: string; type: string }) => api.post('/api/trash/restore', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trash'] }); toast.success('Restaurado') },
    onError: (e: any) => toast.error(e.message),
  })

  const deletePerm = useMutation({
    mutationFn: (body: { id: string; type: string }) => api.delete('/api/trash/permanent', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trash'] }); toast.success('Eliminado permanentemente') },
    onError: (e: any) => toast.error(e.message),
  })

  const emptyTrash = useMutation({
    mutationFn: () => api.delete('/api/trash/empty'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trash'] }); toast.success('Papelera vaciada'); setShowEmpty(false) },
    onError: (e: any) => toast.error(e.message),
  })

  const allItems: TrashItem[] = data
    ? [...data.projects, ...data.budgets, ...data.structures, ...data.activities,
       ...data.participants, ...data.assignments, ...data.companies]
      .sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime())
    : []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Papelera</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{allItems.length} elementos eliminados</p>
        </div>
        {allItems.length > 0 && (
          <button onClick={() => setShowEmpty(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors">
            <Trash2 className="h-4 w-4"/> Vaciar papelera
          </button>
        )}
      </div>

      {showEmpty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEmpty(false)}/>
          <div className="relative bg-card border rounded-2xl shadow-xl w-full max-w-sm m-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600"/>
              </div>
              <div>
                <h2 className="font-semibold">¿Vaciar papelera?</h2>
                <p className="text-sm text-muted-foreground">Se eliminarán {allItems.length} elementos permanentemente. Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowEmpty(false)} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={() => emptyTrash.mutate()} disabled={emptyTrash.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                {emptyTrash.isPending && <Loader2 className="h-4 w-4 animate-spin"/>} Eliminar todo
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent"/></div>
        ) : allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Trash2 className="h-10 w-10 mb-3 opacity-30"/><p className="text-sm">La papelera está vacía</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Eliminado</th>
                <th className="w-28"/>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allItems.map(item => (
                <tr key={`${item.type}-${item.id}`} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5 font-medium">{item.name}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                      {TYPE_LABELS[item.type] || item.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{fmtDT(item.deleted_at)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => restore.mutate({ id: item.id, type: item.type })}
                        className="p-1.5 rounded hover:bg-green-50 transition-colors" title="Restaurar">
                        <RotateCcw className="h-3.5 w-3.5 text-green-600"/>
                      </button>
                      <button onClick={() => deletePerm.mutate({ id: item.id, type: item.type })}
                        className="p-1.5 rounded hover:bg-red-50 transition-colors" title="Eliminar permanente">
                        <Trash2 className="h-3.5 w-3.5 text-red-500"/>
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
