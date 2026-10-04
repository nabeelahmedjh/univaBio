import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Lock } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import handsTea from '@/assets/images/hands-tea.jpg'
import { EASE } from '@/components/motion/easing'
import { PageTransition } from '@/components/motion/PageTransition'
import { Button } from '@/components/ui/Button'
import { FieldError } from '@/components/ui/Input'
import { LOOP_PATH, Logo } from '@/components/ui/Logo'
import { Footer } from '@/components/ui/primitives'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useShake } from '@/hooks/useShake'
import { api } from '@/lib/api'
import { PATIENT_SECOND_FACTOR, USE_MOCK } from '@/lib/config'
import { ApiError } from '@/lib/errors'

const NOT_FOUND = "We couldn't find that ID. Please check with your doctor's office."

export default function PatientEntry() {
  useDocumentMeta('Patient portal')
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const { controls, shake } = useShake()
  const [id, setId] = useState('')
  const [secondFactor, setSecondFactor] = useState('')
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const value = id.trim()
    if (!value) {
      setError('Please enter your patient ID.')
      shake()
      return
    }
    setError(undefined)
    setLoading(true)
    try {
      const patient = await api.getPatient(value)
      navigate(`/patient/${encodeURIComponent(patient.id)}`)
    } catch (err) {
      setLoading(false)
      setError(err instanceof ApiError && err.status === 404 ? NOT_FOUND : (err as Error).message || NOT_FOUND)
      shake()
    }
  }

  return (
    <PageTransition>
      <div className="grain on-dark relative flex min-h-dvh flex-col overflow-hidden bg-[radial-gradient(120%_80%_at_50%_0%,var(--moss)_0%,var(--forest)_45%,var(--ink)_100%)] text-ivory">
        {/* Huge faint line-art loop slowly rotating (120s) */}
        <motion.svg
          aria-hidden
          viewBox="0 0 64 64"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[170vmax] w-[170vmax] -translate-x-1/2 -translate-y-1/2 md:h-[130vmax] md:w-[130vmax]"
          animate={reduce ? {} : { rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
        >
          <path d={LOOP_PATH} fill="none" stroke="var(--champagne)" strokeOpacity="0.08" strokeWidth="0.15" />
        </motion.svg>

        <header className="relative z-10 mx-auto flex w-full max-w-[1240px] items-center justify-between px-6 pt-6 md:px-10 md:pt-8">
          <Logo tone="light" size="sm" />
          <Link to="/" className="link-underline text-[13px] text-sage hover:text-ivory">
            <ArrowLeft size={14} strokeWidth={1.25} /> Back
          </Link>
        </header>

        <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-16">
          <motion.form
            onSubmit={submit}
            animate={controls}
            noValidate
            className="flex w-full max-w-[560px] flex-col items-center text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: EASE }}
              className="photo-treat mb-10 h-24 w-24 overflow-hidden rounded-full border border-hairline"
            >
              <img src={handsTea} alt="Hands holding a warm cup near a window" className="h-full w-full object-cover" />
            </motion.div>
            <p className="eyebrow">Patient portal</p>
            <h1 className="t-h2 mt-4 text-ivory">
              Your sessions, <em className="text-champagne-soft">whenever you need them.</em>
            </h1>

            <div className="relative mt-14 w-full">
              <label htmlFor="patient-id" className="sr-only">
                Patient ID
              </label>
              <input
                id="patient-id"
                value={id}
                onChange={(e) => {
                  setId(e.target.value)
                  if (error) setError(undefined)
                }}
                placeholder="Enter your patient ID"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-invalid={!!error || undefined}
                aria-describedby="patient-id-error"
                className="peer w-full border-0 border-b border-hairline bg-transparent pb-4 text-center font-display text-[26px] tracking-[0.12em] text-ivory outline-none placeholder:text-sage/60 placeholder:tracking-[0.06em] focus-visible:outline-none sm:text-[32px]"
              />
              <span className="pointer-events-none absolute bottom-0 left-0 right-0 h-px origin-center scale-x-0 bg-champagne transition-transform duration-300 peer-focus:scale-x-100" />
            </div>

            {/* Slot for a second factor (DOB / PIN / one-time code) once the backend supports it */}
            {PATIENT_SECOND_FACTOR && (
              <div className="relative mt-8 w-full">
                <label htmlFor="patient-2fa" className="sr-only">
                  Date of birth
                </label>
                <input
                  id="patient-2fa"
                  type="text"
                  inputMode="numeric"
                  value={secondFactor}
                  onChange={(e) => setSecondFactor(e.target.value)}
                  placeholder="Date of birth (DD/MM/YYYY)"
                  className="w-full border-0 border-b border-hairline bg-transparent pb-3 text-center text-[18px] tracking-[0.08em] text-ivory outline-none placeholder:text-sage/60"
                />
              </div>
            )}

            <FieldError id="patient-id-error" message={error} />

            <Button type="submit" className="mt-6 min-w-[240px]" loading={loading} loadingText="Opening…">
              View my sessions
            </Button>

            <p className="mt-8 flex items-center gap-2 text-[13px] text-sage">
              <Lock size={14} strokeWidth={1.25} className="text-champagne" />
              Your ID was given to you by your doctor.
            </p>
            {USE_MOCK && (
              <p className="mt-4 text-[12px] text-sage/70">
                Demo · try <span className="font-mono-ish text-champagne-soft">PT-48213</span>
              </p>
            )}
          </motion.form>
        </main>

        <Footer tone="dark" className="relative z-10 pb-8 text-center" />
      </div>
    </PageTransition>
  )
}
