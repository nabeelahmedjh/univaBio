import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/lib/auth'
import type { Role } from '@/lib/types'

/**
 * Guards doctor/admin routes. Redirects to the role's sign-in page when there
 * is no valid token. While AUTH_ENABLED is false every route is open.
 */
export function ProtectedRoute({ role, children }: { role: Role; children: ReactNode }) {
  const { isAllowed } = useAuth()
  const location = useLocation()
  if (!isAllowed(role)) {
    return <Navigate to={role === 'admin' ? '/admin' : '/doctor'} replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}
