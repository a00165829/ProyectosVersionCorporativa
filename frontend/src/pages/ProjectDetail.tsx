// ProjectDetail.tsx
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { ArrowLeft, Calendar, Tag } from 'lucide-react'

interface Project {
  id: string; name: string; stage: string; description: string
  dev_start_date: string | null; go_live_date: string | null
  planned_go_live_date: string | null; project_start_date: string | null
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: () => api.get<Project>(`/api/projects/${id}`),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )

  if (!project) return (
    <div className="text-center py-20 text-muted-foreground">Proyecto no encontrado</div>
  )

  const dateRow = (label: string, value: string | null) => value ? (
    <div className="flex items-center gap-2 text-sm">
      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{new Date(value).toLocaleDateString('es-MX')}</span>
    </div>
  ) : null

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/projects" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">{project.name}</h1>
      </div>

      <div className="bg-card border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{project.stage}</span>
        </div>
        {project.description && (
          <p className="text-sm text-muted-foreground">{project.description}</p>
        )}
        <div className="space-y-2 pt-2 border-t">
          {dateRow('Inicio desarrollo', project.dev_start_date)}
          {dateRow('Go-Live planeado', project.planned_go_live_date)}
          {dateRow('Go-Live real', project.go_live_date)}
        </div>
      </div>
    </div>
  )
}
