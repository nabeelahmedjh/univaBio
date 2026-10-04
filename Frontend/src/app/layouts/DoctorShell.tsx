import { LayoutGrid, LogOut, Mic, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogoMark } from '@/components/ui/Logo'
import { Footer } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/auth'

const NAV = [
  { to: '/doctor/dashboard', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/doctor/session', label: 'New session', icon: Mic, end: true },
  { to: '/doctor/dashboard#patients', label: 'Patients', icon: Users, end: false, hash: true },
]

function RailItem({ to, label, icon: Icon, end, hash }: (typeof NAV)[number]) {
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={label}
      className={({ isActive }) =>
        `group relative flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-500 ${
          isActive && !hash ? 'bg-moss text-champagne' : 'text-sage hover:bg-moss/70 hover:text-ivory'
        }`
      }
    >
      <Icon size={20} strokeWidth={1.25} />
      <span
        role="tooltip"
        className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 z-50 -translate-x-1 -translate-y-1/2 whitespace-nowrap rounded-full border border-hairline bg-ink px-3 py-1.5 text-[12px] font-medium tracking-wide text-ivory opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
      >
        {label}
      </span>
    </NavLink>
  )
}

/**
 * Doctor app shell: slim 72px forest nav rail on desktop, bottom tab bar on
 * mobile (<768px). Light ivory main area.
 */
export function DoctorShell({ children }: { children: ReactNode }) {
  const { signOut } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const onSignOut = () => {
    signOut()
    toast.show({ title: 'Signed out', description: 'Your session has been closed securely.' })
    navigate('/')
  }

  return (
    <div className="on-light min-h-dvh bg-ivory">
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col items-center bg-forest py-6 md:flex">
        <Link to="/doctor/dashboard" aria-label="Continuo dashboard" className="mb-10">
          <LogoMark size={34} />
        </Link>
        <nav aria-label="Primary" className="flex flex-1 flex-col items-center gap-3">
          {NAV.map((n) => (
            <RailItem key={n.to} {...n} />
          ))}
        </nav>
        <button
          type="button"
          onClick={onSignOut}
          aria-label="Sign out"
          className="group relative flex h-12 w-12 items-center justify-center rounded-full text-sage transition-colors duration-500 hover:bg-moss/70 hover:text-ivory"
        >
          <LogOut size={20} strokeWidth={1.25} />
          <span className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-hairline bg-ink px-3 py-1.5 text-[12px] text-ivory opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Sign out
          </span>
        </button>
      </aside>

      <main className="min-h-dvh pb-24 md:pb-0 md:pl-[72px]">
        {children}
        <Footer tone="light" className="no-print px-6 pb-10 pt-6 text-center md:px-12" />
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Primary"
        className="no-print fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-hairline bg-forest px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 md:hidden"
      >
        {NAV.map(({ to, label, icon: Icon, end, hash }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-[48px] min-w-[64px] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold uppercase tracking-[0.12em] ${
                isActive && !hash ? 'text-champagne' : 'text-sage'
              }`
            }
          >
            <Icon size={20} strokeWidth={1.25} />
            {label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={onSignOut}
          className="flex min-h-[48px] min-w-[64px] flex-col items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sage"
        >
          <LogOut size={20} strokeWidth={1.25} />
          Sign out
        </button>
      </nav>
    </div>
  )
}
