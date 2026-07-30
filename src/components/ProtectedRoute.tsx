import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import type { Role } from '../lib/types'

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
    </div>
  )
}

export function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) return <FullScreenLoader />
  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const { profile, loading } = useAuth()

  if (loading) return <FullScreenLoader />
  if (profile && !roles.includes(profile.role as Role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export function RoleHomeRedirect() {
  const { profile, loading } = useAuth()

  if (loading || !profile) return <FullScreenLoader />

  return <Navigate to={profile.role === 'representante' ? '/dashboard' : '/aprovacoes'} replace />
}
