import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Lenis from 'lenis'
import { ArrowDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import continueImg from '@/assets/images/continue.jpg'
import leavesImg from '@/assets/images/leaves-dark.jpg'
import recordImg from '@/assets/images/record.jpg'
import understandImg from '@/assets/images/understand.jpg'
import { Cursor } from '@/components/motion/Cursor'
import { EASE } from '@/components/motion/easing'
import { Orbs } from '@/components/motion/Orbs'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { SplitWords } from '@/components/motion/SplitWords'
import { Logo, LogoMark } from '@/components/ui/Logo'
import { Footer } from '@/components/ui/primitives'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { FeatureSection } from './FeatureSection'
import { RoleCard } from './RoleCard'

const ROUTES = { doctor: '/doctor', patient: '/patient' } as const

export default function Landing() {
  useDocumentMeta('', { index: true })
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const [chosen, setChosen] = useState<'doctor' | 'patient' | null>(null)

  // Lenis smooth scroll (landing only)
  useEffect(() => {
    if (reduce) return
    const lenis = new Lenis({ duration: 1.25, easing: (t) => 1 - Math.pow(1 - t, 4) })
    let id = 0
    const raf = (time: number) => {
      lenis.raf(time)
      id = requestAnimationFrame(raf)
    }
    id = requestAnimationFrame(raf)
    return () => {
      cancelAnimationFrame(id)
      lenis.destroy()
    }
  }, [reduce])

  const choose = (id: 'doctor' | 'patient') => {
    setChosen(id)
    window.setTimeout(() => navigate(ROUTES[id]), reduce ? 200 : 750)
  }

  return (
    <PageTransition>
      <div className="grain grain-fixed relative min-h-dvh overflow-x-clip bg-ink text-ivory">
        <Cursor />

        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="bg-dark-gradient relative flex min-h-dvh flex-col overflow-hidden">
          <img
            src={leavesImg}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.15] mix-blend-luminosity"
          />
          <Orbs />

          <header className="relative z-10 mx-auto flex w-full max-w-[1240px] items-center justify-between px-6 pt-6 md:px-10 md:pt-8">
            <Logo tone="light" />
            <motion.p
              className="hidden text-[12px] tracking-[0.18em] text-sage sm:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.9 }}
            >
              Private. Secure. Yours.
            </motion.p>
          </header>

          <div className="relative z-10 mx-auto flex w-full max-w-[1240px] flex-1 flex-col items-center justify-center px-6 py-16 text-center md:px-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="mb-6"
            >
              <LogoMark size={56} duration={1.2} strokeWidth={1.6} />
            </motion.div>
            <motion.p
              className="eyebrow"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8, ease: EASE }}
            >
              Continuo
            </motion.p>
            <SplitWords
              className="t-hero mt-5 max-w-[900px] text-ivory"
              delay={1.1}
              words={[{ text: 'Every' }, { text: 'conversation,' }, { text: 'continued.', italic: true }]}
            />
            <motion.p
              className="mt-6 text-[18px] text-sage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.9 }}
            >
              A quiet companion for the consultation room.
            </motion.p>

            <motion.p
              className="mt-14 font-display text-[26px] italic text-champagne-soft md:mt-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: chosen ? 0 : 1 }}
              transition={{ delay: chosen ? 0 : 1.8, duration: 0.8 }}
            >
              Are you a…
            </motion.p>

            <div className="mt-6 flex w-full flex-col items-center justify-center gap-5 md:flex-row md:gap-6">
              <RoleCard
                id="doctor"
                title="Doctor"
                line="Capture and continue your consultations."
                art="leaf"
                delay={1.95}
                chosen={chosen}
                onChoose={choose}
              />
              <RoleCard
                id="patient"
                title="Patient"
                line="Revisit what was said, anytime."
                art="heartHand"
                delay={2.1}
                chosen={chosen}
                onChoose={choose}
              />
            </div>
          </div>

          <motion.a
            href="#how"
            className="relative z-10 mx-auto mb-8 hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-sage transition-colors hover:text-champagne md:flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: chosen ? 0 : 1 }}
            transition={{ delay: chosen ? 0 : 2.6, duration: 0.9 }}
          >
            How it works
            <motion.span animate={reduce ? {} : { y: [0, 4, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>
              <ArrowDown size={14} strokeWidth={1.25} />
            </motion.span>
          </motion.a>
        </section>

        {/* ── Below the fold ───────────────────────────────── */}
        <div id="how" className="relative bg-[linear-gradient(180deg,var(--forest)_0%,var(--ink)_100%)]">
          <FeatureSection
            index="i."
            eyebrow="Record"
            title="Stay with the person,"
            italic="not the page."
            body="Record the consultation, or upload one you already have. Continuo listens quietly in the background, so your attention stays where it belongs."
            image={recordImg}
            alt="Two people in conversation across a wooden table in a warm consulting room"
          />
          <FeatureSection
            index="ii."
            eyebrow="Understand"
            title="A clear note,"
            italic="written for you."
            body="The conversation becomes a calm, readable session note: what was discussed, the plan, and what happens next. No jargon, nothing lost."
            image={understandImg}
            alt="An open notebook with handwritten notes and a pen in warm afternoon light"
            flip
          />
          <FeatureSection
            index="iii."
            eyebrow="Continue"
            title="Every visit,"
            italic="connected."
            body="Patients revisit their sessions whenever they need to. Doctors pick up exactly where they left off. Care becomes one continuous thread."
            image={continueImg}
            alt="A quiet woodland path in soft morning light"
          />

          <Reveal className="mx-auto max-w-[1240px] px-6 pb-24 pt-8 text-center md:px-10 md:pb-40">
            <LogoMark size={44} strokeWidth={1.6} />
            <h2 className="t-h2 mx-auto mt-8 max-w-[720px] text-ivory">
              Time returned to <em className="text-champagne-soft">the conversation.</em>
            </h2>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button type="button" className="btn btn-primary" onClick={() => choose('doctor')}>
                I'm a doctor
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => choose('patient')}>
                I'm a patient
              </button>
            </div>
          </Reveal>

          <footer className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-4 border-t border-hairline px-6 py-10 sm:flex-row md:px-10">
            <Logo tone="light" size="sm" draw={false} />
            <Footer tone="dark" />
            <p className="text-[12px] text-sage/70">© {new Date().getFullYear()} Continuo</p>
          </footer>
        </div>

        {/* Expand-to-navigate overlay (shared layout with the chosen card) */}
        <AnimatePresence>
          {chosen && (
            <motion.div
              layoutId={`role-bg-${chosen}`}
              className="fixed inset-0 z-[70]"
              style={{ borderRadius: 0, background: chosen === 'doctor' ? 'var(--ink)' : 'var(--forest)' }}
              transition={{ duration: 0.7, ease: EASE }}
            />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
