import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Users, Shield, Settings2, X, Check, Loader2, Building2, FolderKanban } from 'lucide-react'

interface UserRow {
  id: string; email: string; display_name: string; role: string; created_at: string
}

interface UserPerms {
  user: { id: string; email: string; display_name: string } | null
  role: string
  modules: string[]
  companyIds: string[]
  portfolioIds: string[]
}

interface Company { id: string; name: string }
interface Portfolio { id: string; name: string; company_id: string }

const ROLES = ['admin','director','gerente','lider','usuario','pending']

const ROLE_COLOR: Record<string, string> = {
  admin:    'bg-red-100 text-red-700',
  director: 'bg-purple-100 text-purple-700',
  gerente:  'bg-blue-100 text-blue-700',
  lider:    'bg-indigo-100 text-indigo-700',
  usuario:  'bg-green-100 text-green-700',
  pending:  'bg-gray-100 text-gray-500',
}

const ALL_MODULES = [
  { id: 'dashboard', label: 'Dashboard', section: 'Proyectos' },
  { id: 'projects', label: 'En Proceso', section: 'Proyectos' },
  { id: 'completed', label: 'Completados', section: 'Proyectos' },
  { id: 'cancelled', label: 'Cancelados', section: 'Proyectos' },
  { id: 'project-costs', label: 'Costo de Proyectos', section: 'Proyectos' },
  { id: 'res-dashboard', label: 'Dashboard Recursos', section: 'Recursos' },
  { id: 'res-assignments', label: 'Asignaciones', section: 'Recursos' },
  { id: 'res-reports', label: 'Reportes', section: 'Recursos' },
  { id: 'res-workload', label: 'Carga de Trabajo', section: 'Recursos' },
  { id: 'res-gantt', label: 'Gantt', section: 'Recursos' },
  { id: 'budget', label: 'Presupuestos', section: 'Presupuesto' },
  { id: 'structures', label: 'Estructuras', section: 'Presupuesto' },
]

export default function AdminUsers() {
  const qc = useQueryClient()
  const [editingUser, setEditingUser] = useState<string | null>(null)

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
          <h1 className="text-2xl font-bold">Usuarios y Permisos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {users.length} usuarios · Clic en ⚙ para configurar módulos, empresas y portafolios
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Permisos</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5 font-medium">{u.display_name || '—'}</td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <select value={u.role}
                      onChange={e => updateRole.mutate({ id: u.id, role: e.target.value })}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${ROLE_COLOR[u.role] || 'bg-gray-100'}`}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs hidden lg:table-cell">
                    {new Date(u.created_at).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => setEditingUser(u.id)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Configurar permisos">
                      <Settings2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Permissions modal */}
      {editingUser && (
        <PermissionsEditor userId={editingUser} onClose={() => setEditingUser(null)} />
      )}
    </div>
  )
}

function PermissionsEditor({ userId, onClose }: { userId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [selectedPortfolios, setSelectedPortfolios] = useState<string[]>([])
  const [initialized, setInitialized] = useState(false)

  const { data: perms, isLoading: loadingPerms } = useQuery<UserPerms>({
    queryKey: ['permissions', userId],
    queryFn: () => api.get(`/api/permissions/${userId}`),
  })

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: () => api.get('/api/companies'),
  })

  const { data: portfolios = [] } = useQuery<Portfolio[]>({
    queryKey: ['portfolios'],
    queryFn: () => api.get('/api/portfolios'),
  })

  // Initialize selections from server data
  if (perms && !initialized) {
    setSelectedModules(perms.modules)
    setSelectedCompanies(perms.companyIds)
    setSelectedPortfolios(perms.portfolioIds)
    setInitialized(true)
  }

  const saveModules = useMutation({
    mutationFn: () => api.put(`/api/permissions/${userId}/modules`, { modules: selectedModules }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['permissions', userId] }); toast.success('Módulos guardados') },
    onError: (e: any) => toast.error(e.message),
  })

  const saveCompanies = useMutation({
    mutationFn: () => api.put(`/api/permissions/${userId}/companies`, { companyIds: selectedCompanies }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['permissions', userId] }); toast.success('Empresas guardadas') },
    onError: (e: any) => toast.error(e.message),
  })

  const savePortfolios = useMutation({
    mutationFn: () => api.put(`/api/permissions/${userId}/portfolios`, { portfolioIds: selectedPortfolios }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['permissions', userId] }); toast.success('Portafolios guardados') },
    onError: (e: any) => toast.error(e.message),
  })

  const toggleModule = (mod: string) => {
    setSelectedModules(prev => prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod])
  }

  const toggleCompany = (id: string) => {
    setSelectedCompanies(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  const togglePortfolio = (id: string) => {
    setSelectedPortfolios(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const selectAllModules = () => setSelectedModules(ALL_MODULES.map(m => m.id))
  const clearAllModules = () => setSelectedModules([])

  const saving = saveModules.isPending || saveCompanies.isPending || savePortfolios.isPending

  const handleSaveAll = async () => {
    await Promise.all([
      saveModules.mutateAsync(),
      saveCompanies.mutateAsync(),
      savePortfolios.mutateAsync(),
    ])
  }

  // Group modules by section
  const sections = [...new Set(ALL_MODULES.map(m => m.section))]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold">Configurar permisos</h2>
            <p className="text-sm text-muted-foreground">
              {perms?.user?.display_name || '...'} · <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLOR[perms?.role || 'pending']}`}>{perms?.role}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        {loadingPerms ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Módulos */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2"><FolderKanban className="h-4 w-4 text-primary" /> Módulos habilitados</h3>
                <div className="flex gap-2">
                  <button onClick={selectAllModules} className="text-xs text-primary hover:underline">Todos</button>
                  <span className="text-muted-foreground">|</span>
                  <button onClick={clearAllModules} className="text-xs text-muted-foreground hover:underline">Ninguno</button>
                </div>
              </div>
              {sections.map(section => (
                <div key={section} className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{section}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ALL_MODULES.filter(m => m.section === section).map(mod => (
                      <label key={mod.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                          selectedModules.includes(mod.id) ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted'
                        }`}>
                        <input type="checkbox" checked={selectedModules.includes(mod.id)}
                          onChange={() => toggleModule(mod.id)}
                          className="rounded border-gray-300 text-primary focus:ring-primary" />
                        <span className="text-sm">{mod.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Empresas */}
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-3"><Building2 className="h-4 w-4 text-primary" /> Acceso a empresas</h3>
              {companies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay empresas registradas</p>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {companies.map(c => (
                    <label key={c.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        selectedCompanies.includes(c.id) ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted'
                      }`}>
                      <input type="checkbox" checked={selectedCompanies.includes(c.id)}
                        onChange={() => toggleCompany(c.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary" />
                      <span className="text-sm">{c.name}</span>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Sin empresas asignadas = acceso a todas. Con empresas asignadas = solo ve esas.
              </p>
            </div>

            {/* Portafolios */}
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-3"><FolderKanban className="h-4 w-4 text-primary" /> Acceso a portafolios</h3>
              {portfolios.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay portafolios registrados</p>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {portfolios.map(p => (
                    <label key={p.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        selectedPortfolios.includes(p.id) ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted'
                      }`}>
                      <input type="checkbox" checked={selectedPortfolios.includes(p.id)}
                        onChange={() => togglePortfolio(p.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary" />
                      <span className="text-sm">{p.name}</span>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Sin portafolios asignados = acceso a todos. Con portafolios asignados = solo ve esos.
              </p>
            </div>

            {/* Save button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted">Cancelar</button>
              <button onClick={handleSaveAll} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Guardar permisos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
