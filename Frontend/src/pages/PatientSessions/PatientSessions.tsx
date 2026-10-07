import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowUp,
  Calendar,
  Clock,
  Menu,
  Printer,
  Search,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { EASE } from '@/components/motion/easing'
import { PageTransition } from '@/components/motion/PageTransition'
import { SessionMarkdown } from '@/components/markdown/SessionMarkdown'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/LineArt'
import { LogoMark } from '@/components/ui/Logo'
import { Monogram } from '@/components/ui/Monogram'
import { Footer, Skeleton } from '@/components/ui/primitives'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { errorMessage } from '@/lib/errors'
import {
  formatDuration,
  formatLongDate,
  formatMonthYear,
  formatShortDate,
  formatTime,
  plural,
} from '@/lib/format'
import { usePatient, usePatientSessions, useSession } from '@/lib/queries'
import type { SessionSummary } from '@/lib/types'

export default function PatientSessions() {
  const { id: rawId } = useParams<{ id: string }>()
  const patientId = rawId ? decodeURIComponent(rawId) : ''
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const patientQuery = usePatient(patientId)
  const sessionsQuery = usePatientSessions(patientId)

  const patient = patientQuery.data
  const sessions = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data])

  useDocumentMeta(patient ? `${patient.name} — Sessions` : 'Patient Sessions')

  // Search filter inside sidebar
  const [search, setSearch] = useState('')
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Determine active session
  const paramSessionId = searchParams.get('s')
  const activeSessionId = useMemo(() => {
    if (paramSessionId && sessions.some((s) => s.id === paramSessionId)) {
      return paramSessionId
    }
    return sessions[0]?.id ?? null
  }, [paramSessionId, sessions])

  const selectSession = (sessionId: string) => {
    setSearchParams({ s: sessionId }, { replace: true })
    setMobileDrawerOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Active session details
  const sessionDetailQuery = useSession(activeSessionId ?? undefined)
  const currentSummary = sessions.find((s) => s.id === activeSessionId)

  // Scroll listener for reading progress bar and back to top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setShowBackToTop(scrollY > 600)

      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollY / docHeight) * 100))
        setScrollProgress(progress)
      } else {
        setScrollProgress(0)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Scroll to top when active session changes
  const prevSessionRef = useRef(activeSessionId)
  useEffect(() => {
    if (prevSessionRef.current !== activeSessionId) {
      prevSessionRef.current = activeSessionId
      window.scrollTo(0, 0)
    }
  }, [activeSessionId])

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sessions
    return sessions.filter((s) => {
      const titleMatch = s.title.toLowerCase().includes(q)
      const excerptMatch = s.excerpt?.toLowerCase().includes(q)
      const dateMatch = formatLongDate(s.date).toLowerCase().includes(q)
      return titleMatch || excerptMatch || dateMatch
    })
  }, [sessions, search])

  // Group by Month ("October 2026")
  const groupedByMonth = useMemo(() => {
    const groups: { month: string; items: SessionSummary[] }[] = []
    filteredSessions.forEach((s) => {
      const month = formatMonthYear(s.date)
      let group = groups.find((g) => g.month === month)
      if (!group) {
        group = { month, items: [] }
        groups.push(group)
      }
      group.items.push(s)
    })
    return groups
  }, [filteredSessions])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const printSession = () => {
    window.print()
  }

  // Sidebar content component (used in desktop rail and mobile drawer)
  const renderSidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Top Patient Profile */}
      <div className="border-b border-hairline p-6">
        <div className="flex items-center justify-between">
          <Link
            to="/patient"
            className="link-underline inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-stone hover:text-ink"
          >
            <ArrowLeft size={14} strokeWidth={1.5} /> Portal
          </Link>
          <LogoMark size={24} />
        </div>

        <div className="mt-6 flex items-start gap-3.5">
          <Monogram name={patient?.name ?? patientId} size={48} tone="forest" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-[22px] font-medium leading-snug text-ink">
              {patient?.name ?? <Skeleton className="h-6 w-32" />}
            </h2>
            <p className="font-mono-ish text-[12px] text-stone">ID: {patientId}</p>
            {patient?.doctorName && (
              <p className="mt-1 text-[13px] text-forest/80">Dr. {patient.doctorName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Session History Header & Filter */}
      <div className="border-b border-hairline px-6 py-4">
        <div className="flex items-center justify-between">
          <p className="eyebrow on-light text-[11px]">Session history</p>
          <span className="font-mono-ish text-[12px] text-stone">
            {plural(sessions.length, 'session')}
          </span>
        </div>

        {sessions.length > 2 && (
          <div className="relative mt-3">
            <Search
              size={14}
              strokeWidth={1.5}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by topic or date"
              className="field-box !rounded-full py-1.5 pl-9 pr-3 text-[13px]"
            />
          </div>
        )}
      </div>

      {/* Timeline List */}
      <div className="thin-scroll flex-1 overflow-y-auto px-4 py-6">
        {sessionsQuery.isLoading ? (
          <div className="space-y-4 px-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <p className="px-4 py-8 text-center text-[14px] text-stone">
            {search ? 'No matching sessions found.' : 'No sessions recorded yet.'}
          </p>
        ) : (
          <div className="space-y-6">
            {groupedByMonth.map(({ month, items }) => (
              <div key={month} className="relative">
                <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone">
                  {month}
                </p>

                {/* Vertical timeline connecting line */}
                <div className="relative pl-3">
                  <div
                    aria-hidden
                    className="absolute bottom-4 left-[21px] top-4 w-[1px] bg-champagne/40"
                  />

                  <div className="space-y-1.5">
                    {items.map((item) => {
                      const isSelected = item.id === activeSessionId
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectSession(item.id)}
                          className={`group relative flex w-full items-start gap-3.5 rounded-2xl p-3 text-left transition-colors duration-300 ${
                            isSelected ? 'text-ink' : 'text-stone hover:text-ink'
                          }`}
                        >
                          {/* Sliding ivory pill background */}
                          {isSelected && (
                            <motion.div
                              layoutId="active-session-pill"
                              className="absolute inset-0 rounded-2xl border border-hairline bg-ivory shadow-sm"
                              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            />
                          )}

                          {/* Timeline dot */}
                          <div className="relative z-10 mt-1 flex h-4 w-4 shrink-0 items-center justify-center">
                            <span
                              className={`h-2.5 w-2.5 rounded-full border transition-colors duration-300 ${
                                isSelected
                                  ? 'border-champagne bg-champagne'
                                  : 'border-champagne/60 bg-linen group-hover:border-champagne'
                              }`}
                            />
                          </div>

                          {/* Summary text */}
                          <div className="relative z-10 min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-[13px] ${
                                  isSelected ? 'font-semibold text-ink' : 'font-medium'
                                }`}
                              >
                                {formatShortDate(item.date)}
                              </span>
                              <span className="font-mono-ish text-[11px] text-stone/80">
                                {formatTime(item.date)}
                              </span>
                            </div>
                            <p
                              className={`mt-1 line-clamp-2 text-[14px] leading-snug ${
                                isSelected ? 'font-medium text-ink' : 'text-stone'
                              }`}
                            >
                              {item.title}
                            </p>
                            {item.excerpt && (
                              <p className="mt-1 line-clamp-1 text-[12px] text-stone/80">
                                {item.excerpt}
                              </p>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-hairline p-4 text-center">
        <Footer tone="light" className="text-[11px]" />
      </div>
    </div>
  )

  return (
    <PageTransition>
      <div className="on-light min-h-dvh bg-ivory text-ink">
        {/* Reading progress bar */}
        <div
          aria-hidden
          className="no-print fixed inset-x-0 top-0 z-50 h-[2.5px] bg-transparent"
        >
          <div
            className="h-full bg-champagne transition-all duration-150 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Mobile top navigation rail */}
        <header className="no-print sticky top-0 z-40 flex items-center justify-between border-b border-hairline bg-ivory/95 px-5 py-3.5 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="btn btn-secondary btn-sm on-light gap-2"
              aria-label="Open session history"
            >
              <Menu size={16} strokeWidth={1.5} />
              <span>Sessions ({sessions.length})</span>
            </button>
            {currentSummary && (
              <span className="truncate text-[13px] text-stone">
                {formatShortDate(currentSummary.date)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={printSession}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-stone hover:text-ink"
              aria-label="Print or save as PDF"
            >
              <Printer size={15} strokeWidth={1.25} />
            </button>
            <Link
              to="/patient"
              className="text-[12px] font-semibold uppercase tracking-[0.14em] text-stone hover:text-ink"
            >
              Exit
            </Link>
          </div>
        </header>

        {/* Mobile Left Drawer */}
        <AnimatePresence>
          {mobileDrawerOpen && (
            <div className="no-print fixed inset-0 z-50 flex lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setMobileDrawerOpen(false)}
                className="fixed inset-0 bg-ink/40 backdrop-blur-xs"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.4, ease: EASE }}
                className="relative z-10 flex h-full w-[320px] max-w-[85vw] flex-col bg-linen shadow-lux"
              >
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full text-stone hover:bg-ivory hover:text-ink"
                  aria-label="Close session history"
                >
                  <X size={18} strokeWidth={1.5} />
                </button>
                {renderSidebarContent()}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Desktop Layout (Two Column) */}
        <div className="mx-auto flex min-h-dvh max-w-[1360px]">
          {/* Left Desktop Sidebar (320px, sticky, linen) */}
          <aside className="no-print sticky top-0 hidden h-dvh w-[320px] shrink-0 border-r border-hairline bg-linen lg:block">
            {renderSidebarContent()}
          </aside>

          {/* Center (The Reader): max-width 720px reading column */}
          <main className="print-full flex-1 px-6 pb-28 pt-8 md:px-12 lg:px-16 lg:pt-24">
            <div className="mx-auto max-w-[720px]">
              {/* Reader actions header */}
              <div className="no-print mb-8 flex items-center justify-between">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-stone hover:text-ink lg:hidden"
                >
                  <LogoMark size={22} />
                  <span className="font-display text-[18px]">Continuo</span>
                </Link>

                <div className="ml-auto hidden items-center gap-3 lg:flex">
                  <button
                    type="button"
                    onClick={printSession}
                    className="link-underline inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-stone hover:text-ink"
                  >
                    <Printer size={15} strokeWidth={1.25} /> Print / Save as PDF
                  </button>
                </div>
              </div>

              {/* State handling */}
              {patientQuery.isError ? (
                <div className="rounded-2xl border border-hairline bg-linen p-8 text-center">
                  <p className="font-display text-[24px] text-ink">We couldn't load this profile.</p>
                  <p className="mt-2 text-[14px] text-stone">{errorMessage(patientQuery.error)}</p>
                  <Button
                    variant="secondary"
                    tone="light"
                    className="mt-6"
                    onClick={() => navigate('/patient')}
                  >
                    Return to patient portal
                  </Button>
                </div>
              ) : sessionsQuery.isLoading ? (
                <div className="space-y-6 pt-10">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-12 w-3/4" />
                  <Skeleton className="mt-8 h-48 w-full rounded-2xl" />
                  <Skeleton className="h-32 w-full rounded-2xl" />
                </div>
              ) : sessions.length === 0 ? (
                <EmptyState
                  art="notebook"
                  message="Your first session will appear here."
                  action={
                    <ButtonLink to="/patient" variant="secondary" tone="light">
                      Return to portal
                    </ButtonLink>
                  }
                />
              ) : !currentSummary ? (
                <p className="py-20 text-center text-stone">Please choose a session to view.</p>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.article
                    key={activeSessionId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="relative"
                  >
                    {/* Meta Row */}
                    <header className="border-b border-hairline pb-8">
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-[13px] text-stone">
                        <span className="eyebrow on-light text-[11px]">Clinical Session Note</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar size={14} strokeWidth={1.25} />
                          {formatLongDate(currentSummary.date)}
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={14} strokeWidth={1.25} />
                          {formatDuration(currentSummary.durationSec)}
                        </span>
                      </div>

                      <h1 className="mt-4 font-display text-[36px] font-medium leading-[1.08] tracking-[-0.015em] text-ink sm:text-[44px] md:text-[48px]">
                        {currentSummary.title}
                      </h1>

                      {patient?.doctorName && (
                        <p className="mt-3 text-[15px] text-stone">
                          Consultation with <strong className="font-semibold text-ink">Dr. {patient.doctorName}</strong>
                        </p>
                      )}
                    </header>

                    {/* Markdown Body */}
                    <div className="pt-8">
                      {sessionDetailQuery.isLoading ? (
                        <div className="space-y-4 pt-4">
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-20 w-full" />
                          <Skeleton className="h-6 w-48 pt-4" />
                          <Skeleton className="h-28 w-full" />
                        </div>
                      ) : sessionDetailQuery.isError ? (
                        <div className="rounded-2xl border border-hairline bg-linen p-6">
                          <p className="text-[15px] text-ink">Could not load session notes.</p>
                          <Button
                            variant="secondary"
                            tone="light"
                            size="sm"
                            className="mt-4"
                            onClick={() => sessionDetailQuery.refetch()}
                          >
                            Retry
                          </Button>
                        </div>
                      ) : sessionDetailQuery.data?.markdown ? (
                        <SessionMarkdown markdown={sessionDetailQuery.data.markdown} />
                      ) : null}
                    </div>

                    {/* Reader Footer */}
                    <footer className="mt-16 border-t border-hairline pt-8 text-[13px] text-stone">
                      <p>
                        Prepared securely by Continuo for {patient?.name ?? 'patient'}.
                        If you have questions about your notes, please speak with your doctor at your next appointment.
                      </p>
                    </footer>
                  </motion.article>
                </AnimatePresence>
              )}
            </div>
          </main>
        </div>

        {/* Floating "Back to top" pill after 600px scroll */}
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              type="button"
              onClick={scrollToTop}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="no-print fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-hairline bg-ink px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-ivory shadow-lux transition-transform hover:-translate-y-0.5 hover:bg-forest"
              aria-label="Back to top"
            >
              <ArrowUp size={14} strokeWidth={1.5} />
              <span>Top</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
