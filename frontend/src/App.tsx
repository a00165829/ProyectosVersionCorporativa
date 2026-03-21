import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MsalProvider } from '@azure/msal-react'
import { Toaster } from 'sonner'
import { msalInstance } from '@/lib/msal'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import AppLayout from '@/components/layout/AppLayout'
import Login from '@/pages/Login'
import PendingApproval from '@/pages/PendingApproval'
import Dashboard from '@/pages/Dashboard'
import ProjectsList from '@/pages/ProjectsList'
import ProjectDetail from '@/pages/ProjectDetail'
import AdminUsers from '@/pages/AdminUsers'
import NotFound from '@/pages/NotFound'
import { Loader2 } from 'lucide-react'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5 } },
})

function AppRoutes() {
  const { user, loading, isApproved, isAdmin } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  if (!user) return (
    <Routes>
      <Route path="*" element={<Login />} />
    </Routes>
  )

  if (!isApproved) return (
    <Routes>
      <Route path="*" element={<PendingApproval />} />
    </Routes>
  )

  return (
    <AppLayout>
      <Routes>
        <Route path="/"                element={<Dashboard />} />
        <Route path="/projects"        element={<ProjectsList />} />
        <Route path="/projects/:id"    element={<ProjectDetail />} />
        {isAdmin && <Route path="/admin/users" element={<AdminUsers />} />}
        <Route path="/404"             element={<NotFound />} />
        <Route path="*"                element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
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
