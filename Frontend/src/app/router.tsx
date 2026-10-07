import { AnimatePresence } from 'framer-motion'
import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'

const Landing = lazy(() => import('@/pages/Landing/Landing'))
const DoctorAuth = lazy(() => import('@/pages/DoctorAuth/DoctorAuth'))
const DoctorDashboard = lazy(() => import('@/pages/DoctorDashboard/DoctorDashboard'))
const DoctorSession = lazy(() => import('@/pages/DoctorSession/DoctorSession'))
const PatientEntry = lazy(() => import('@/pages/PatientEntry/PatientEntry'))
const PatientSessions = lazy(() => import('@/pages/PatientSessions/PatientSessions'))
const AdminLogin = lazy(() => import('@/pages/AdminLogin/AdminLogin'))
const AdminPanel = lazy(() => import('@/pages/AdminPanel/AdminPanel'))
const NotFound = lazy(() => import('@/pages/NotFound/NotFound'))

/** Top-level route key: sub-navigation inside a page (e.g. ?s=) must not re-animate. */
function routeKey(pathname: string) {
  if (pathname.startsWith('/patient/')) return '/patient/:id'
  return pathname
}

export function AppRouter() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <Suspense fallback={<div className="min-h-dvh bg-ivory" />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={routeKey(location.pathname)}>
          <Route path="/" element={<Landing />} />
          <Route path="/doctor" element={<DoctorAuth />} />
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute role="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/session"
            element={
              <ProtectedRoute role="doctor">
                <DoctorSession />
              </ProtectedRoute>
            }
          />
          <Route path="/patient" element={<PatientEntry />} />
          <Route path="/patient/:id" element={<PatientSessions />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/admin/panel"
            element={
              <ProtectedRoute role="admin">
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}
