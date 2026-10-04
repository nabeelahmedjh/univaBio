import { motion } from 'framer-motion'
import { ChevronDown, ChevronRight, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DoctorShell } from '@/app/layouts/DoctorShell'
import { EASE } from '@/components/motion/easing'
import { MagneticButton } from '@/components/motion/MagneticButton'
import { PageTransition } from '@/components/motion/PageTransition'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { ButtonLink, Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/LineArt'
import { Monogram } from '@/components/ui/Monogram'
import { Skeleton } from '@/components/ui/primitives'
import { Sparkline, Stat } from '@/components/ui/Stat'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useAuth } from '@/lib/auth'
import { errorMessage } from '@/lib/errors'
import { formatEyebrowDate, formatRelativeDay, greeting, lastName, plural } from '@/lib/format'
import { useDoctorOverview, useDoctorPatients } from '@/lib/queries'
import type { PatientListItem } from '@/lib/types'

type Sort = 'recent' | 'name' | 'sessions'
const PAGE = 8

function sortPatients(list: PatientListItem[], sort: Sort) {
  const c = [...list]
  if (sort === 'name') c.sort((a, b) => a.name.localeCompare(b.name))
  else if (sort === 'sessions') c.sort((a, b) => b.sessionCount - a.sessionCount)
  else c.sort((a, b) => (b.lastSessionAt ?? '').localeCompare(a.lastSessionAt ?? ''))
  return c
}

function PatientRow({ p }: { p: PatientListItem }) {
  return (
    <Link
      to={`/patient/${encodeURIComponent(p.id)}`}
      className="group relative flex min-h-[76px] items-center gap-4 overflow-hidden rounded-[16px] border border-transparent px-4 py-3 transition-colors duration-500 hover:border-hairline hover:bg-paper sm:gap-5 sm:px-5"
    >
      <span
        aria-hidden
        className="absolute left-0 top-1/2 h-0 w-[2px] -translate-y-1/2 rounded-full bg-champagne transition-all duration-500 group-hover:h-[60%] group-focus-visible:h-[60%]"
      />
      <Monogram name={p.name} size={44} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-medium text-ink">{p.name}</p>
        <p className="font-mono-ish text-[12px] text-stone">{p.id}</p>
      </div>
      <p className="hidden w-28 text-[14px] text-stone sm:block">{plural(p.sessionCount, 'session')}</p>
      <p className="hidden w-32 text-[14px] text-stone md:block">{formatRelativeDay(p.lastSessionAt)}</p>
      <ChevronRight
        size={18}
        strokeWidth={1.25}
        className="shrink-0 text-stone transition-transform duration-500 group-hover:translate-x-1.5 group-hover:text-ink"
      />
    </Link>
  )
}

export default function DoctorDashboard() {
  useDocumentMeta('Dashboard')
  const { doctor } = useAuth()
  const overview = useDoctorOverview()
  const patients = useDoctorPatients()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('recent')
  const [limit, setLimit] = useState(PAGE)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = patients.data ?? []
    const f = q ? list.filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)) : list
    return sortPatients(f, sort)
  }, [patients.data, query, sort])

  const visible = filtered.slice(0, limit)
  const o = overview.data

  return (
    <PageTransition>
      <DoctorShell>
        <div className="mx-auto max-w-[1360px] px-5 pt-10 sm:px-8 md:px-12 md:pt-14">
          {/* Header */}
          <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow on-light">{formatEyebrowDate()}</p>
              <h1 className="t-h1 mt-3 text-ink">
                {greeting()}, <em className="font-display italic">Dr. {lastName(doctor.name)}.</em>
              </h1>
            </div>
            <MagneticButton>
              <span className="relative inline-flex rounded-full">
                <span className="pulse-ring" aria-hidden />
                <ButtonLink to="/doctor/session" icon={<Plus size={16} strokeWidth={1.75} />}>
                  New session
                </ButtonLink>
              </span>
            </MagneticButton>
          </header>

          {/* Insight cards */}
          <section aria-label="Overview" className="mt-12">
            {overview.isError ? (
              <div className="card flex items-center justify-between p-6">
                <p className="text-stone">{errorMessage(overview.error)}</p>
                <Button variant="secondary" tone="light" size="sm" onClick={() => overview.refetch()}>
                  Retry
                </Button>
              </div>
            ) : !o ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[170px] rounded-[20px]" />
                ))}
              </div>
            ) : (
              <Stagger trigger="mount" className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                <StaggerItem>
                  <Stat label="Total patients" value={o.totalPatients} detail="under your care" />
                </StaggerItem>
                <StaggerItem>
                  <Stat label="Total sessions" value={o.totalSessions} detail="all time" />
                </StaggerItem>
                <StaggerItem>
                  <Stat label="This week" value={o.weekSessions} detail="sessions" aside={<Sparkline data={o.weekByDay} />} />
                </StaggerItem>
                <StaggerItem>
                  <Stat label="Today" value={o.todaySessions} detail="sessions today" />
                </StaggerItem>
              </Stagger>
            )}
          </section>

          {/* Patient list */}
          <section id="patients" aria-labelledby="patients-title" className="mt-16 scroll-mt-10 md:mt-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 id="patients-title" className="t-h2 text-ink">
                  Your patients
                </h2>
                {patients.data && (
                  <p className="mt-1 text-[14px] text-stone">{plural(patients.data.length, 'patient')}</p>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative sm:w-[300px]">
                  <Search
                    size={16}
                    strokeWidth={1.25}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone"
                  />
                  <label htmlFor="patient-search" className="sr-only">
                    Search patients by name or ID
                  </label>
                  <input
                    id="patient-search"
                    type="search"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setLimit(PAGE)
                    }}
                    placeholder="Search by name or ID"
                    className="field-box !rounded-full pl-11"
                  />
                </div>
                <div className="relative">
                  <label htmlFor="patient-sort" className="sr-only">
                    Sort patients
                  </label>
                  <select
                    id="patient-sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Sort)}
                    className="field-box !rounded-full appearance-none pr-11 sm:w-[170px]"
                  >
                    <option value="recent">Recent</option>
                    <option value="name">Name</option>
                    <option value="sessions">Sessions</option>
                  </select>
                  <ChevronDown
                    size={16}
                    strokeWidth={1.25}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-hairline pt-4">
              {patients.isError ? (
                <div className="flex items-center justify-between py-8">
                  <p className="text-stone">{errorMessage(patients.error)}</p>
                  <Button variant="secondary" tone="light" size="sm" onClick={() => patients.refetch()}>
                    Retry
                  </Button>
                </div>
              ) : patients.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex h-[76px] items-center gap-5 px-5">
                      <Skeleton className="h-11 w-11 !rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (patients.data?.length ?? 0) === 0 ? (
                <EmptyState
                  art="notebook"
                  message="No patients yet. Begin your first session."
                  action={
                    <ButtonLink to="/doctor/session" icon={<Plus size={16} strokeWidth={1.75} />}>
                      New session
                    </ButtonLink>
                  }
                />
              ) : filtered.length === 0 ? (
                <p className="py-16 text-center font-display text-[22px] text-stone">
                  No patients match “{query}”.
                </p>
              ) : (
                <>
                  <div className="hidden px-5 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone/80 sm:flex sm:gap-5">
                    <span className="w-11" />
                    <span className="flex-1">Patient</span>
                    <span className="w-28">Sessions</span>
                    <span className="hidden w-32 md:block">Last session</span>
                    <span className="w-[18px]" />
                  </div>
                  <Stagger key={`${sort}-${query}`} trigger="mount" as="ul" className="space-y-1">
                    {visible.map((p) => (
                      <StaggerItem as="li" key={p.id}>
                        <PatientRow p={p} />
                      </StaggerItem>
                    ))}
                  </Stagger>
                  {filtered.length > limit && (
                    <motion.div
                      className="mt-8 flex justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, ease: EASE }}
                    >
                      <button
                        type="button"
                        onClick={() => setLimit((l) => l + PAGE)}
                        className="link-underline text-[12px] font-semibold uppercase tracking-[0.18em] text-ink"
                      >
                        Load more · {filtered.length - limit} remaining
                      </button>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </DoctorShell>
    </PageTransition>
  )
}
