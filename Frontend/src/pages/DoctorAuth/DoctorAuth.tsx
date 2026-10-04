import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import doctorRoom from '@/assets/images/doctor-room.jpg'
import { useCurtain } from '@/components/motion/Curtain'
import { EASE } from '@/components/motion/easing'
import { PageTransition } from '@/components/motion/PageTransition'
import { Button } from '@/components/ui/Button'
import { FieldError, LineInput } from '@/components/ui/Input'
import { Logo } from '@/components/ui/Logo'
import { Footer } from '@/components/ui/primitives'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useShake } from '@/hooks/useShake'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { USE_MOCK } from '@/lib/config'
import { ApiError } from '@/lib/errors'
import { RequestAccessModal } from './RequestAccessModal'

const schema = z.object({
  doctorId: z.string().trim().min(1, 'Please enter your Doctor ID.').min(4, 'Your Doctor ID is at least 4 characters.'),
  password: z.string().min(1, 'Please enter your password.').min(4, 'Your password is at least 4 characters.'),
})
type Values = z.infer<typeof schema>

export default function DoctorAuth() {
  useDocumentMeta('Doctor sign-in')
  const navigate = useNavigate()
  const location = useLocation()
  const curtain = useCurtain()
  const { signInDoctor } = useAuth()
  const { controls, shake } = useShake()
  const [serverError, setServerError] = useState<string>()
  const [opening, setOpening] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), mode: 'onTouched' })

  const onSubmit = async (v: Values) => {
    setServerError(undefined)
    try {
      const res = await api.loginDoctor(v)
      setOpening(true)
      signInDoctor(res.token, res.doctor)
      const to = (location.state as { from?: string } | null)?.from ?? '/doctor/dashboard'
      await curtain({ color: 'var(--ivory)', onCovered: () => navigate(to) })
    } catch (e) {
      setServerError(e instanceof ApiError && e.status === 401 ? "That ID or password isn't right." : (e as Error).message)
      shake()
    }
  }

  const busy = isSubmitting || opening

  return (
    <PageTransition>
      <div className="grid min-h-dvh bg-ink lg:grid-cols-2">
        {/* Image panel (top on mobile/tablet, right on desktop) */}
        <div className="photo-treat relative order-1 h-[30vh] lg:order-2 lg:h-auto">
          <img
            src={doctorRoom}
            alt="A doctor listening in a softly lit, warm consulting room"
            className="ken-burns absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-forest/35" aria-hidden />
          <motion.figure
            className="glass absolute bottom-6 left-6 right-6 z-10 hidden max-w-[400px] rounded-[20px] p-7 lg:bottom-10 lg:left-10 lg:block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.6 }}
          >
            <blockquote className="font-display text-[28px] italic leading-tight text-ivory">
              “Time returned to the conversation.”
            </blockquote>
            <figcaption className="eyebrow mt-4">Continuo</figcaption>
          </motion.figure>
        </div>

        {/* Form panel */}
        <div className="grain on-dark bg-dark-gradient relative order-2 flex flex-col px-6 py-8 sm:px-12 lg:order-1 lg:px-16">
          <div className="relative z-10 flex items-center justify-between">
            <Logo tone="light" size="sm" />
            <Link to="/" className="link-underline text-[13px] text-sage hover:text-ivory">
              <ArrowLeft size={14} strokeWidth={1.25} /> Back
            </Link>
          </div>

          <div className="relative z-10 flex flex-1 items-center justify-center py-12">
            <motion.form
              animate={controls}
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="w-full max-w-[400px]"
              aria-describedby="doctor-form-error"
            >
              <p className="eyebrow">Doctor portal</p>
              <h1 className="t-h2 mt-4 text-ivory">
                Welcome <em className="text-champagne-soft">back.</em>
              </h1>

              <div className="mt-10 space-y-3">
                <LineInput
                  label="Doctor ID"
                  autoComplete="username"
                  autoCapitalize="characters"
                  spellCheck={false}
                  error={errors.doctorId?.message}
                  {...register('doctorId')}
                />
                <LineInput
                  label="Password"
                  revealable
                  autoComplete="current-password"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              <FieldError id="doctor-form-error" message={serverError} />

              <Button type="submit" block className="mt-6" loading={busy} loadingText="Opening your space…">
                Enter Continuo
              </Button>

              <p className="mt-6 flex items-center gap-2 text-[13px] text-sage">
                <Lock size={14} strokeWidth={1.25} className="shrink-0 text-champagne" />
                Access is provided by your clinic administrator.
              </p>
              <button
                type="button"
                onClick={() => setRequestOpen(true)}
                className="link-underline mt-3 text-[13px] text-champagne"
              >
                Request access
              </button>

              {USE_MOCK && (
                <p className="mt-8 rounded-xl border border-hairline px-4 py-3 text-[12px] leading-relaxed text-sage/80">
                  Demo mode · use <span className="font-mono-ish text-champagne-soft">DR-2048</span> with any password
                  (4+ characters).
                </p>
              )}
            </motion.form>
          </div>

          <Footer tone="dark" className="relative z-10" />
        </div>
      </div>
      <RequestAccessModal open={requestOpen} onClose={() => setRequestOpen(false)} />
    </PageTransition>
  )
}
