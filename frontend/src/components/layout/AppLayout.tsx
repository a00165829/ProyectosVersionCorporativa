import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { usePortfolio } from '@/context/PortfolioContext'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, FolderKanban, CheckCircle2, XCircle,
  Users, LogOut, Menu, Building2, ChevronDown, Check
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',   href: '/',           icon: LayoutDashboard },
  { label: 'En Proceso',  href: '/projects',   icon: FolderKanban },
  { label: 'Completados', href: '/completed',  icon: CheckCircle2 },
  { label: 'Cancelados',  href: '/cancelled',  icon: XCircle },
]
const adminItems = [
  { label: 'Usuarios', href: '/admin/users', icon: Users },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut, isAdmin } = useAuth()
  const { portfolios, activePortfolio, setActivePortfolioId } = usePortfolio()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [showPortfolios, setShowPortfolios] = useState(false)

  const NavLink = ({ href, icon: Icon, label }: typeof navItems[0]) => (
    <Link to={href} onClick={() => setOpen(false)}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
        location.pathname === href
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}>
      <Icon className="h-4 w-4 shrink-0"/>{label}
    </Link>
  )

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-5 border-b">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Building2 className="h-4 w-4 text-primary-foreground"/>
        </div>
        <span className="font-semibold text-sm">PMO Portal</span>
      </div>

      {/* Portfolio selector */}
      <div className="px-3 py-3 border-b">
        <p className="text-xs text-muted-foreground mb-1.5 px-1">Portafolio</p>
        <div className="relative">
          <button onClick={() => setShowPortfolios(!showPortfolios)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium">
            <span className="truncate">{activePortfolio?.name || 'Seleccionar...'}</span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", showPortfolios && "rotate-180")}/>
          </button>
          {showPortfolios && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-50 overflow-hidden">
              {portfolios.map(p => (
                <button key={p.id}
                  onClick={() => { setActivePortfolioId(p.id); setShowPortfolios(false) }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    {p.company_name && <p className="text-xs text-muted-foreground">{p.company_name}</p>}
                  </div>
                  {activePortfolio?.id === p.id && <Check className="h-4 w-4 text-primary shrink-0"/>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 pb-1">Proyectos</p>
        {navItems.map(item => <NavLink key={item.href} {...item}/>)}
        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Administración</p>
            </div>
            {adminItems.map(item => <NavLink key={item.href} {...item}/>)}
          </>
        )}
      </nav>

      <div className="p-3 border-t">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">
              {user?.displayName?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{user?.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
          </div>
          <button onClick={signOut} className="text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4"/>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background" onClick={() => showPortfolios && setShowPortfolios(false)}>
      <aside className="hidden md:flex w-60 shrink-0 border-r flex-col"><Sidebar/></aside>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)}/>
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-background border-r flex flex-col"><Sidebar/></aside>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b">
          <button onClick={() => setOpen(true)}><Menu className="h-5 w-5"/></button>
          <span className="font-semibold text-sm">PMO Portal</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
