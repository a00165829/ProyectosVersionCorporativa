import { useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { usePortfolio } from '@/context/PortfolioContext'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, FolderKanban, CheckCircle2, XCircle, DollarSign,
  Building2 as BuildingIcon, Users, UserCheck, LogOut, Menu, Building2,
  ChevronDown, ChevronRight, Check, ListChecks, HardDrive, Briefcase,
  BarChart3, CalendarRange, Weight, Trash2, Settings, type LucideIcon, Shield
} from 'lucide-react'
import { api } from '@/lib/api'
import { DEV_MODE } from '@/lib/msal'
import { getDevRole, setDevRole } from '@/lib/api'

// Icon map — maps string names from DB to actual components
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, FolderKanban, CheckCircle2, XCircle, DollarSign,
  Building2: BuildingIcon, Users, UserCheck, ListChecks, HardDrive,
  Briefcase, BarChart3, CalendarRange, Weight, Trash2, Settings,
  LogOut, Menu,
}

interface MenuItemConfig {
  id: string; module_id: string; label: string; href: string
  icon: string; section: string; sort_order: number; visible: boolean
}

const DEFAULT_SECTION_LABELS: Record<string, string> = {
  proyectos: 'Proyectos',
  recursos: 'Recursos',
  presupuesto: 'Presupuesto',
  administracion: 'Administración',
}

// Sections that require at least manager role (admin, director, gerente)
const MANAGER_SECTIONS: string[] = []
// Sections that require at least lider role (admin, director, gerente, lider)
const LIDER_SECTIONS = ['recursos', 'presupuesto']
// Sections that require admin role
const ADMIN_SECTIONS = ['administracion']
// Module IDs that require at least lider (not usuario)
const LIDER_MODULES = ['project-costs']

// Fixed section order — always consistent
const SECTION_ORDER = ['proyectos', 'recursos', 'presupuesto', 'administracion']

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut, isAdmin, isManager } = useAuth()
  const {
    companies, activeCompany, activeCompanyId, setActiveCompanyId,
    companyPortfolios, activePortfolio, setActivePortfolioId
  } = usePortfolio()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [showCompanies, setShowCompanies] = useState(false)
  const [showPortfolios, setShowPortfolios] = useState(false)

  const [sections, setSections] = useState<Record<string, boolean>>({
    proyectos: true, recursos: true, presupuesto: true, administracion: true,
  })
  const toggleSection = (key: string) => setSections(prev => ({ ...prev, [key]: !prev[key] }))
  const closeDropdowns = () => { setShowCompanies(false); setShowPortfolios(false) }

  // Fetch dynamic menu config from backend
  const { data: menuConfig = [] } = useQuery<MenuItemConfig[]>({
    queryKey: ['menu-config'],
    queryFn: () => api.get('/api/menu-config'),
  })

  // Filter by visibility and role permissions + per-user module permissions
  const userRole = user?.role || 'usuario'
  const userModules = user?.modules || []
  const hasModulePerms = userModules.length > 0

  const visibleItems = useMemo(() => {
    const filtered = menuConfig.filter(item => {
      if (!item.visible) return false
      if (userRole === 'admin') return true
      if (ADMIN_SECTIONS.includes(item.section)) return false
      if (LIDER_SECTIONS.includes(item.section) && userRole === 'usuario') return false
      if (LIDER_MODULES.includes(item.module_id) && userRole === 'usuario') return false
      if (hasModulePerms && !userModules.includes(item.module_id)) return false
      return true
    })
    return filtered
  }, [menuConfig, userRole, hasModulePerms, userModules])

  // Group visible items by section using fixed order
  const menuSections = useMemo(() => {
    const grouped: Record<string, MenuItemConfig[]> = {}

    for (const item of visibleItems) {
      if (!grouped[item.section]) grouped[item.section] = []
      grouped[item.section].push(item)
    }

    // Sort items within each section
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => a.sort_order - b.sort_order)
    }

    // Use fixed order, only include sections that have visible items
    return SECTION_ORDER
      .filter(section => grouped[section] && grouped[section].length > 0)
      .map(section => ({
        key: section,
        label: DEFAULT_SECTION_LABELS[section] || section.charAt(0).toUpperCase() + section.slice(1),
        items: grouped[section],
      }))
  }, [visibleItems])

  const NavLink = ({ item }: { item: MenuItemConfig }) => {
    const Icon = ICON_MAP[item.icon] || FolderKanban
    return (
      <Link to={item.href} onClick={() => setOpen(false)}
        className={cn(
          'sidebar-nav-link flex items-center gap-3 px-3 py-1.5 rounded-lg text-[13px] font-medium',
          location.pathname === item.href ? 'active' : ''
        )}>
        <Icon className="h-4 w-4 shrink-0"/>{item.label}
      </Link>
    )
  }

  const SectionHeader = ({ label, sectionKey }: { label: string; sectionKey: string }) => (
    <button onClick={() => toggleSection(sectionKey)}
      className="sidebar-section-btn w-full flex items-center justify-between pt-3 pb-1 px-3 group">
      <p className="sidebar-section-label text-[10px] font-bold uppercase tracking-[0.15em]">{label}</p>
      {sections[sectionKey]
        ? <ChevronDown className="h-3 w-3 opacity-40"/>
        : <ChevronRight className="h-3 w-3 opacity-40"/>
      }
    </button>
  )

  const Sidebar = () => (
    <div className="sidebar-dark flex flex-col h-full">
      {/* Brand header */}
      <div className="px-4 py-3 sidebar-header border-b">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, hsl(185 80% 50%), hsl(210 100% 45%))' }}>
            <Building2 className="h-4 w-4 text-white"/>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight text-white">Portal de Portafolio</p>
            <p className="text-[8px] uppercase tracking-[0.12em] opacity-40">Planeación · Recursos · Control</p>
          </div>
        </div>
      </div>

      {/* Company + Portfolio selectors */}
      <div className="px-3 py-2.5 sidebar-header border-b space-y-1.5" onClick={e => e.stopPropagation()}>
        <div className="relative">
          <button onClick={() => { setShowCompanies(!showCompanies); setShowPortfolios(false) }}
            className="sidebar-company-trigger w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm font-semibold">
            <div className="flex items-center gap-2 min-w-0">
              <BuildingIcon className="h-3.5 w-3.5 shrink-0"/>
              <span className="truncate">{activeCompany?.name || 'Empresa...'}</span>
            </div>
            <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-200", showCompanies && "rotate-180")}/>
          </button>
          {showCompanies && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card text-foreground border rounded-lg shadow-xl z-50 overflow-hidden">
              {companies.map(c => (
                <button key={c.id}
                  onClick={() => { setActiveCompanyId(c.id); setShowCompanies(false) }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted transition-colors text-left">
                  <div className="flex items-center gap-2">
                    <BuildingIcon className="h-3.5 w-3.5 text-muted-foreground"/>
                    <p className="font-medium">{c.name}</p>
                  </div>
                  {activeCompanyId === c.id && <Check className="h-4 w-4 text-primary shrink-0"/>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" onClick={e => e.stopPropagation()}>
          <button onClick={() => { setShowPortfolios(!showPortfolios); setShowCompanies(false) }}
            className="sidebar-dropdown-trigger w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-medium">
            <span className="truncate">{activePortfolio?.name || 'Portafolio...'}</span>
            <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-200", showPortfolios && "rotate-180")}/>
          </button>
          {showPortfolios && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card text-foreground border rounded-lg shadow-xl z-50 overflow-hidden">
              {companyPortfolios.length === 0 ? (
                <div className="px-3 py-2.5 text-sm text-muted-foreground text-center">No hay portafolios</div>
              ) : companyPortfolios.map(p => (
                <button key={p.id}
                  onClick={() => { setActivePortfolioId(p.id); setShowPortfolios(false) }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted transition-colors text-left">
                  <p className="font-medium">{p.name}</p>
                  {activePortfolio?.id === p.id && <Check className="h-4 w-4 text-primary shrink-0"/>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {menuSections.map(({ key, label, items }) => (
          <div key={key}>
            <SectionHeader label={label} sectionKey={key}/>
            {(sections[key] ?? true) && (
              <div className="space-y-0.5">
                {items.map(item => <NavLink key={item.id} item={item}/>)}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Dev role switcher — only in development */}
      {DEV_MODE && (
        <div className="px-3 py-2 sidebar-header border-t">
          <div className="flex items-center gap-2 px-2 mb-1.5">
            <Shield className="h-3 w-3 opacity-50"/>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">Simular rol</span>
          </div>
          <select
            value={getDevRole()}
            onChange={e => { setDevRole(e.target.value); window.location.reload() }}
            className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/10 border border-white/10 text-white/80 focus:outline-none focus:ring-1 focus:ring-white/20"
          >
            <option value="admin" style={{color:'#333'}}>Admin — acceso total + administración</option>
            <option value="director" style={{color:'#333'}}>Director — todo excepto administración</option>
            <option value="gerente" style={{color:'#333'}}>Gerente — todo excepto administración</option>
            <option value="lider" style={{color:'#333'}}>Líder — todo (solo ve lo que creó)</option>
            <option value="usuario" style={{color:'#333'}}>Usuario — solo proyectos (lectura)</option>
          </select>
        </div>
      )}

      {/* User footer */}
      <div className="p-3 sidebar-header border-t">
        <div className="sidebar-user-card flex items-center gap-2.5 px-2.5 py-2 rounded-lg">
          <div className="sidebar-user-avatar h-7 w-7 rounded-full flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold">{user?.displayName?.charAt(0).toUpperCase() || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-white/90">{user?.displayName}</p>
            <p className="text-[10px] truncate opacity-50 capitalize">{user?.role}</p>
          </div>
          <button onClick={signOut} className="opacity-50 hover:opacity-100 hover:text-red-400 transition-all">
            <LogOut className="h-3.5 w-3.5"/>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background" onClick={closeDropdowns}>
      <aside className="hidden md:flex w-[260px] shrink-0 flex-col"><Sidebar/></aside>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}/>
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] flex flex-col shadow-2xl"><Sidebar/></aside>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b bg-card shadow-sm">
          <button onClick={() => setOpen(true)} className="p-1"><Menu className="h-5 w-5"/></button>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-bold">{activeCompany?.name}</span>
            {activePortfolio && <span className="text-muted-foreground font-medium">/ {activePortfolio.name}</span>}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-background">{children}</main>
      </div>
    </div>
  )
}
