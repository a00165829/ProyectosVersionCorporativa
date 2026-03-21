import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MsalProvider } from '@azure/msal-react'
import { Toaster } from 'sonner'
import { msalInstance } from '@/lib/msal'
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
import Budget from '@/pages/Budget'
import Structures from '@/pages/Structures'
import AdminUsers from '@/pages/AdminUsers'
import { Loader2 } from 'lucide-react'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5 } },
})

function AppRoutes() {
  const { user, loading, isApproved, isAdmin, isManager } = useAuth()
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
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<ProjectsList />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/completed" element={<CompletedProjects />} />
          <Route path="/cancelled" element={<CancelledProjects />} />
          {isManager && <Route path="/budget" element={<Budget />} />}
          {isManager && <Route path="/structures" element={<Structures />} />}
          {isAdmin && <Route path="/admin/users" element={<AdminUsers />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </PortfolioProvider>
  )
}

export default function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </MsalProvider>
  )
}