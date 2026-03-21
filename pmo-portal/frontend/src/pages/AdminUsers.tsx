import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Users, Shield } from 'lucide-react'

interface UserRow {
  id: string; email: string; display_name: string; role: string; created_at: string
}

const ROLES = ['admin','director','gerente','lider','usuario','pending']

const ROLE_COLOR: Record<string, string> = {
  admin:     'bg-red-100 text-red-700',
  director:  'bg-purple-100 text-purple-700',
  gerente:   'bg-blue-100 text-blue-700',
  lider:     'bg-indigo-100 text-indigo-700',
  usuario:   'bg-green-100 text-green-700',
  pending:   'bg-gray-100 text-gray-500',
}

export default function AdminUsers() {
  const qc = useQueryClient()

  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ['admin-users'],
    queryFn: () => api.get<UserRow[]>('/api/users'),
  })

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.put(`/api/users/${id}/role`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Rol actualizado')
    },
    onError: (e: any) => toast.error(e.message),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{users.length} usuarios registrados</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No hay usuarios registrados</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Rol</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Registrado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5 font-medium">{u.display_name || '—'}</td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <select
                      value={u.role}
                      onChange={e => updateRole.mutate({ id: u.id, role: e.target.value })}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${ROLE_COLOR[u.role] || 'bg-gray-100'}`}
                    >
                      {ROLES.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs hidden lg:table-cell">
                    {new Date(u.created_at).toLocaleDateString('es-MX')}
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
