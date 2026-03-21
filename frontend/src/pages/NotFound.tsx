import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-7xl font-bold text-muted-foreground/20 mb-4">404</p>
      <h1 className="text-xl font-bold mb-2">Página no encontrada</h1>
      <p className="text-sm text-muted-foreground mb-6">La página que buscas no existe o fue movida.</p>
      <Link to="/" className="text-sm text-primary hover:underline">← Volver al dashboard</Link>
    </div>
  )
}
