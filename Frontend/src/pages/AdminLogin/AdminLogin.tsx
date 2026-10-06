import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useCurtain } from '@/components/motion/Curtain'
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

const schema = z.object({
  username: z.string().trim().min(1, 'Please enter your username.'),
  password: z.string().min(1, 'Please enter your password.'),
})
type Values = z.infer<typeof schema>

export default function AdminLogin() {
  useDocumentMeta('Administration Login')
  const navigate = useNavigate()
  const curtain = useCurtain()
  const { signInAdmin } = useAuth()
  const { controls, shake } = useShake()

  const [serverError, setServerError] = useState<string>()
  const [opening, setOpening] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
  })

  const onSubmit = async (v: Values) => {
    setServerError(undefined)
    try {
      const res = await api.loginAdmin(v)
      setOpening(true)
      signInAdmin(res.token)
      await curtain({
        color: 'var(--ivory)',
        onCovered: () => navigate('/admin/panel'),
      })
    } catch (e) {
      setServerError(
        e instanceof ApiError && e.status === 401
          ? "That username or password isn't right."
          : (e as Error).message || "That username or password isn't right.",
      )
      shake()
    }
  }

  const busy = isSubmitting || opening

  return (
    <PageTransition>
      <div className="grain on-dark relative flex min-h-dvh flex-col justify-between bg-ink px-6 py-8 text-ivory sm:px-10">
        <header className="relative z-10 mx-auto flex w-full max-w-[1240px] items-center justify-between">
          <Logo tone="light" size="sm" />
          <Link
            to="/"
            className="link-underline inline-flex items-center gap-1.5 text-[13px] text-sage hover:text-ivory"
          >
            <ArrowLeft size={14} strokeWidth={1.25} /> Back
          </Link>
        </header>

        <main className="relative z-10 flex flex-1 items-center justify-center py-12">
          <motion.div
            animate={controls}
            className="glass w-full max-w-[420px] rounded-[24px] p-8 sm:p-10"
            style={{
              background: 'rgba(22, 48, 42, 0.45)',
              border: '1px solid var(--hairline)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            <div className="flex items-center justify-between">
              <p className="eyebrow">Administration</p>
              <Shield size={16} strokeWidth={1.25} className="text-champagne" />
            </div>

            <h1 className="t-h2 mt-4 text-ivory">Admin access.</h1>
            <p className="mt-2 text-[14px] text-sage">Manage clinical accounts and permissions.</p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-4">
              <LineInput
                label="Username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                error={errors.username?.message}
                {...register('username')}
              />
              <LineInput
                label="Password"
                revealable
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password')}
              />

              <FieldError id="admin-error" message={serverError} />

              <Button
                type="submit"
                block
                className="mt-6"
                loading={busy}
                loadingText="Signing in…"
              >
                Sign in
              </Button>

              {USE_MOCK && (
                <div className="mt-8 rounded-xl border border-hairline/60 bg-ink/40 p-3.5 text-center text-[12px] text-sage">
                  Demo credentials: <span className="font-mono-ish text-champagne-soft">admin</span> /{' '}
                  <span className="font-mono-ish text-champagne-soft">continuo</span>
                </div>
              )}
            </form>
          </motion.div>
        </main>

        <Footer tone="dark" className="relative z-10 text-center" />
      </div>
    </PageTransition>
  )
}

