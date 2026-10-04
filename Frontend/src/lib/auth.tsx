import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { AUTH_ENABLED } from './config'
import { getAuth, setAuth, type StoredAuth } from './token'
import type { DoctorProfile, Role } from './types'

/**
 * Used while authentication is disabled (AUTH_ENABLED=false) so doctor
 * screens still have a name to greet. Matches the mock seed.
 */
export const DEMO_DOCTOR: DoctorProfile = {
  id: 'doc_1',
  name: 'Dr. Amara Whitfield',
  doctorId: 'DR-2048',
  specialty: 'General Practice',
}

interface AuthContextValue {
  auth: StoredAuth | null
  /** Doctor profile for the current session (or the demo doctor when auth is off). */
  doctor: DoctorProfile
  isAllowed: (role: Role) => boolean
  signInDoctor: (token: string, doctor: DoctorProfile) => void
  signInAdmin: (token: string) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setState] = useState<StoredAuth | null>(() => getAuth())

  const update = useCallback((next: StoredAuth | null) => {
    setAuth(next)
    setState(next)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      doctor: (auth?.role === 'doctor' && auth.doctor) || DEMO_DOCTOR,
      isAllowed: (role) => !AUTH_ENABLED || (auth?.role === role && !!auth.token),
      signInDoctor: (token, doctor) => update({ role: 'doctor', token, doctor }),
      signInAdmin: (token) => update({ role: 'admin', token }),
      signOut: () => update(null),
    }),
    [auth, update],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
