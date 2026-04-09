import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { PortfolioProvider } from '@/context/PortfolioContext'
import AppLayout from '@/components/layout/AppLayout'
import Login from '@/pages/Login'
import PendingApproval from '@/pages/PendingApproval'
import Dashboard from '@/pages/Dashboard'
import ProjectsList from '@/pages/ProjectsList'
import ProjectDetail from '@/pages/ProjectDetail'
import CompletedProjects from '@/pages/CompletedProjects'
import CancelledProjects from '@/pages/CancelledProjects'
import ProjectCosts from '@/pages/ProjectCosts'
import Budget from '@/pages/Budget'
import Structures from '@/pages/Structures'
import ResourceDashboard from '@/pages/ResourceDashboard'
import ResourceAssignments from '@/pages/ResourceAssignments'
import ResourceReports from '@/pages/ResourceReports'
import ResourceWorkload from '@/pages/ResourceWorkload'
import ResourceGantt from '@/pages/ResourceGantt'
import AdminUsers from '@/pages/AdminUsers'
import ParticipantsList from '@/pages/ParticipantsList'
import ActivitiesCatalog from '@/pages/ActivitiesCatalog'
import ResourcesCatalog from '@/pages/ResourcesCatalog'
import CompaniesCatalog from '@/pages/CompaniesCatalog'
import Trash from '@/pages/Trash'
import EditMenus from '@/pages/EditMenus'
import { Loader2 } from 'lucide-react'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5 } },
})

function AppRoutes() {
  const { user, loading, isApproved, isAdmin, isManager, isLider } = useAuth()
  const isLiderOrAbove = isManager || isLider

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
  if (!user) return <Routes><Route path="*" element={<Login />} /></Routes>
  if (!isApproved) return <Routes><Route path="*" element={<PendingApproval />} /></Routes>
  return (
    <PortfolioProvider>
      <AppLayout>
        <Routes>
          {/* Proyectos — todos los roles */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<ProjectsList />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/completed" element={<CompletedProjects />} />
          <Route path="/cancelled" element={<CancelledProjects />} />

          {/* Costo de proyectos — lider y superiores */}
          {isLiderOrAbove && <Route path="/project-costs" element={<ProjectCosts />} />}

          {/* Recursos — lider y superiores */}
          {isLiderOrAbove && <Route path="/resources/dashboard" element={<ResourceDashboard />} />}
          {isLiderOrAbove && <Route path="/resources/assignments" element={<ResourceAssignments />} />}
          {isLiderOrAbove && <Route path="/resources/reports" element={<ResourceReports />} />}
          {isLiderOrAbove && <Route path="/resources/workload" element={<ResourceWorkload />} />}
          {isLiderOrAbove && <Route path="/resources/gantt" element={<ResourceGantt />} />}

          {/* Presupuesto — lider y superiores */}
          {isLiderOrAbove && <Route path="/budget" element={<Budget />} />}
          {isLiderOrAbove && <Route path="/structures" element={<Structures />} />}

          {/* Administración — solo admin */}
          {isAdmin && <Route path="/admin/users" element={<AdminUsers />} />}
          {isAdmin && <Route path="/admin/participants" element={<ParticipantsList />} />}
          {isAdmin && <Route path="/admin/activities" element={<ActivitiesCatalog />} />}
          {isAdmin && <Route path="/admin/resources" element={<ResourcesCatalog />} />}
          {isAdmin && <Route path="/admin/companies" element={<CompaniesCatalog />} />}
          {isAdmin && <Route path="/admin/trash" element={<Trash />} />}
          {isAdmin && <Route path="/admin/menus" element={<EditMenus />} />}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </PortfolioProvider>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}