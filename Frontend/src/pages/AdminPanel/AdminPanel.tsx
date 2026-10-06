import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  Copy,
  KeyRound,
  LogOut,
  RefreshCw,
  Shield,
  UserCheck,
  UserPlus,
  UserX,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { EASE } from '@/components/motion/easing'
import { PageTransition } from '@/components/motion/PageTransition'
import { Button } from '@/components/ui/Button'
import { BoxInput } from '@/components/ui/Input'
import { LogoMark } from '@/components/ui/Logo'
import { Modal } from '@/components/ui/Modal'
import { Monogram } from '@/components/ui/Monogram'
import { Footer, Skeleton } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { errorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/format'
import { generateDoctorId, generatePassword } from '@/lib/generate'
import { qk, useDoctors } from '@/lib/queries'
import type { AdminDoctor } from '@/lib/types'

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter the doctor’s full name.'),
  doctorId: z
    .string()
    .trim()
    .min(3, 'Doctor ID must be at least 3 characters.')
    .regex(/^[A-Z0-9_-]+$/i, 'Doctor ID can contain letters, numbers, hyphens and underscores.'),
  password: z.string().min(6, 'Password should be at least 6 characters.'),
  specialty: z.string().trim().optional(),
  email: z.string().trim().email('Please enter a valid email address.').optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

interface CreatedCredentials {
  name: string
  doctorId: string
  password: string
}

export default function AdminPanel() {
  useDocumentMeta('Admin Panel — Manage Doctors')
  const { signOut } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const doctorsQuery = useDoctors()
  const doctors = doctorsQuery.data ?? []

  // Newly created doctor ID for 2s highlight animation
  const [highlightId, setHighlightId] = useState<string | null>(null)

  // One-time credential modal
  const [credentialsModal, setCredentialsModal] = useState<CreatedCredentials | null>(null)
  const [copiedCreds, setCopiedCreds] = useState(false)

  // Reset password state & modal
  const [resetModal, setResetModal] = useState<{ doctor: AdminDoctor; newPassword?: string } | null>(null)
  const [resetting, setResetting] = useState(false)
  const [copiedReset, setCopiedReset] = useState(false)

  // Deactivate confirm modal
  const [deactivateModal, setDeactivateModal] = useState<{ doctor: AdminDoctor; targetActive: boolean } | null>(null)
  const [deactivating, setDeactivating] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      doctorId: generateDoctorId(),
      password: generatePassword(12),
      specialty: '',
      email: '',
    },
  })

  const currentDoctorId = watch('doctorId')
  const currentPassword = watch('password')

  const regenerateId = () => {
    setValue('doctorId', generateDoctorId(), { shouldValidate: true })
  }

  const regeneratePassword = () => {
    setValue('password', generatePassword(12), { shouldValidate: true })
  }

  const [copiedField, setCopiedField] = useState<'id' | 'password' | null>(null)
  const copyText = async (text: string, field: 'id' | 'password') => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await api.createDoctor({
        name: values.name,
        doctorId: values.doctorId,
        password: values.password,
        specialty: values.specialty || undefined,
        email: values.email || undefined,
      })

      // Invalidate queries so list refreshes
      qc.invalidateQueries({ queryKey: qk.doctors })

      // Highlight the new row
      setHighlightId(res.doctor.id)
      setTimeout(() => setHighlightId(null), 2500)

      // Store credentials for the one-time display modal
      setCredentialsModal({
        name: res.doctor.name,
        doctorId: res.doctor.doctorId,
        password: values.password,
      })

      toast.show({
        title: 'Doctor added',
        description: `${res.doctor.name} has been enrolled into Continuo.`,
      })

      // Reset form with new fresh suggested credentials
      reset({
        name: '',
        doctorId: generateDoctorId(),
        password: generatePassword(12),
        specialty: '',
        email: '',
      })
    } catch (e) {
      toast.show({
        title: 'Could not add doctor',
        description: errorMessage(e),
      })
    }
  }

  const copyFullCredentials = async () => {
    if (!credentialsModal) return
    const text = `Continuo Doctor Credentials\nName: ${credentialsModal.name}\nDoctor ID: ${credentialsModal.doctorId}\nTemporary Password: ${credentialsModal.password}\nPortal URL: ${window.location.origin}/doctor`
    await navigator.clipboard.writeText(text)
    setCopiedCreds(true)
    setTimeout(() => setCopiedCreds(false), 2500)
  }

  const onSignOut = () => {
    signOut()
    toast.show({ title: 'Admin signed out', description: 'Administrative session ended.' })
    navigate('/admin')
  }

  // Action: Reset Password
  const handleResetPassword = async (doc: AdminDoctor) => {
    setResetting(true)
    try {
      const { password } = await api.resetDoctorPassword(doc.id)
      setResetModal({ doctor: doc, newPassword: password })
      toast.show({ title: 'Password regenerated', description: `New password issued for ${doc.name}.` })
    } catch (e) {
      toast.show({ title: 'Password reset failed', description: errorMessage(e) })
    } finally {
      setResetting(false)
    }
  }

  // Action: Set Active / Deactivate
  const handleConfirmDeactivate = async () => {
    if (!deactivateModal) return
    setDeactivating(true)
    try {
      await api.setDoctorActive(deactivateModal.doctor.id, deactivateModal.targetActive)
      qc.invalidateQueries({ queryKey: qk.doctors })
      toast.show({
        title: deactivateModal.targetActive ? 'Doctor reactivated' : 'Doctor deactivated',
        description: `${deactivateModal.doctor.name}'s account status has been updated.`,
      })
      setDeactivateModal(null)
    } catch (e) {
      toast.show({ title: 'Action failed', description: errorMessage(e) })
    } finally {
      setDeactivating(false)
    }
  }

  return (
    <PageTransition>
      <div className="on-light min-h-dvh bg-ivory text-ink">
        {/* Top bar with logo, "Admin" tag and sign out */}
        <header className="sticky top-0 z-30 border-b border-hairline bg-ivory/95 backdrop-blur-md">
          <div className="mx-auto flex h-18 max-w-[1240px] items-center justify-between px-6 sm:px-10">
            <div className="flex items-center gap-3">
              <LogoMark size={28} />
              <span className="wordmark text-[22px] text-ink">Continuo</span>
              <span className="rounded-full border border-hairline bg-linen px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-forest">
                Admin
              </span>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="link-underline inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-stone hover:text-ink"
            >
              <LogOut size={15} strokeWidth={1.25} />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        {/* Main layout (max-width 1240px, centered) */}
        <main className="mx-auto max-w-[1240px] px-6 py-10 sm:px-10 md:py-14">
          <div className="mb-10">
            <p className="eyebrow on-light">Staff directory & access</p>
            <h1 className="t-h1 mt-2 text-ink">Manage Doctors</h1>
          </div>

          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left: Add a doctor form card (lg:col-span-5) */}
            <section
              aria-labelledby="add-doctor-title"
              className="card rounded-[24px] p-7 sm:p-8 lg:col-span-5"
            >
              <div className="flex items-center gap-2.5">
                <UserPlus size={20} strokeWidth={1.25} className="text-forest" />
                <h2 id="add-doctor-title" className="t-h3 text-ink">
                  Add a doctor
                </h2>
              </div>
              <p className="mt-1 text-[13px] text-stone">
                Enrol a new practitioner with an auto-generated ID and secure temporary password.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
                <BoxInput
                  label="Full name"
                  placeholder="e.g. Dr. Julian Ashby"
                  autoComplete="name"
                  error={errors.name?.message}
                  {...register('name')}
                />

                <BoxInput
                  label="Doctor ID"
                  error={errors.doctorId?.message}
                  {...register('doctorId')}
                  trailing={
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => copyText(currentDoctorId, 'id')}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-stone hover:bg-ivory hover:text-ink"
                        title="Copy Doctor ID"
                        aria-label="Copy Doctor ID"
                      >
                        {copiedField === 'id' ? <Check size={14} className="text-forest" /> : <Copy size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={regenerateId}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-stone hover:bg-ivory hover:text-ink"
                        title="Generate another Doctor ID"
                        aria-label="Regenerate Doctor ID"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  }
                />

                <BoxInput
                  label="Temporary password"
                  type="text"
                  error={errors.password?.message}
                  {...register('password')}
                  trailing={
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => copyText(currentPassword, 'password')}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-stone hover:bg-ivory hover:text-ink"
                        title="Copy Password"
                        aria-label="Copy Temporary Password"
                      >
                        {copiedField === 'password' ? <Check size={14} className="text-forest" /> : <Copy size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={regeneratePassword}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-stone hover:bg-ivory hover:text-ink"
                        title="Generate another password"
                        aria-label="Regenerate Password"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  }
                />

                <BoxInput
                  label="Specialty (optional)"
                  placeholder="e.g. Cardiology, General Practice"
                  error={errors.specialty?.message}
                  {...register('specialty')}
                />

                <BoxInput
                  label="Email (optional)"
                  type="email"
                  placeholder="practitioner@clinic.com"
                  error={errors.email?.message}
                  {...register('email')}
                />

                <div className="pt-2">
                  <Button type="submit" block loading={isSubmitting} loadingText="Adding doctor…">
                    Add doctor
                  </Button>
                </div>
              </form>
            </section>

            {/* Right: Doctors list (lg:col-span-7) */}
            <section aria-labelledby="doctors-list-title" className="lg:col-span-7">
              <div className="flex items-center justify-between pb-4">
                <div>
                  <h2 id="doctors-list-title" className="t-h2 text-ink">
                    Doctors
                  </h2>
                  <p className="text-[13px] text-stone">
                    {doctors.length} registered {doctors.length === 1 ? 'practitioner' : 'practitioners'}
                  </p>
                </div>
              </div>

              <div className="mt-2 space-y-3">
                {doctorsQuery.isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : doctors.length === 0 ? (
                  <div className="rounded-[20px] border border-hairline bg-linen p-8 text-center text-stone">
                    No doctors added yet. Use the form to enroll your first doctor.
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {doctors.map((doc) => {
                      const isHighlighted = highlightId === doc.id
                      const isActive = doc.active !== false

                      return (
                        <motion.div
                          key={doc.id}
                          layout
                          initial={{ opacity: 0, y: -16, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.6, ease: EASE }}
                          className={`relative overflow-hidden rounded-[20px] border p-5 transition-colors duration-700 ${
                            isHighlighted
                              ? 'border-champagne bg-champagne/15'
                              : 'border-hairline bg-linen/70 hover:border-champagne/60 hover:bg-paper'
                          }`}
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4">
                              <Monogram name={doc.name} size={44} tone={isActive ? 'forest' : 'ivory'} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="truncate font-display text-[19px] font-medium leading-tight text-ink">
                                    {doc.name}
                                  </h3>
                                  {!isActive && (
                                    <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-danger">
                                      Inactive
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-stone">
                                  <span className="font-mono-ish text-ink font-medium">{doc.doctorId}</span>
                                  {doc.specialty && <span>· {doc.specialty}</span>}
                                  {doc.email && <span className="hidden sm:inline">· {doc.email}</span>}
                                </div>
                                <p className="mt-1 text-[11px] text-stone/80">
                                  Enrolled {formatDate(doc.createdAt)}
                                </p>
                              </div>
                            </div>

                            {/* Actions: Reset password & Activate/Deactivate */}
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <button
                                type="button"
                                disabled={resetting}
                                onClick={() => handleResetPassword(doc)}
                                className="flex h-9 items-center gap-1.5 rounded-full border border-hairline bg-ivory px-3 text-[12px] font-medium text-stone hover:border-champagne hover:text-ink disabled:opacity-50"
                                title="Reset credentials"
                              >
                                <KeyRound size={13} strokeWidth={1.5} />
                                <span>{resetting ? 'Resetting…' : 'Reset'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDeactivateModal({
                                    doctor: doc,
                                    targetActive: !isActive,
                                  })
                                }
                                className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-colors ${
                                  isActive
                                    ? 'border-hairline bg-ivory text-stone hover:border-danger/40 hover:text-danger'
                                    : 'border-champagne bg-champagne/10 text-forest hover:bg-champagne/20'
                                }`}
                                title={isActive ? 'Deactivate doctor' : 'Reactivate doctor'}
                              >
                                {isActive ? (
                                  <>
                                    <UserX size={13} strokeWidth={1.5} />
                                    <span>Deactivate</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck size={13} strokeWidth={1.5} />
                                    <span>Activate</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                )}
              </div>
            </section>
          </div>
        </main>

        <Footer tone="light" className="px-6 pb-12 pt-8 text-center" />

        {/* Modal: One-time credentials display on doctor creation */}
        <Modal
          open={credentialsModal !== null}
          onClose={() => setCredentialsModal(null)}
          eyebrow="Doctor enrolled"
          title="Practitioner credentials"
          width={520}
        >
          {credentialsModal && (
            <div className="space-y-5">
              <div className="rounded-xl border border-hairline bg-linen/80 p-4">
                <div className="space-y-2 text-[14px]">
                  <div>
                    <span className="font-semibold text-stone uppercase tracking-wider text-[11px] block">Name</span>
                    <span className="font-medium text-ink">{credentialsModal.name}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-stone uppercase tracking-wider text-[11px] block">Doctor ID</span>
                    <span className="font-mono-ish text-[16px] text-ink font-semibold">
                      {credentialsModal.doctorId}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-stone uppercase tracking-wider text-[11px] block">
                      Temporary Password
                    </span>
                    <span className="font-mono-ish text-[16px] text-[#8a6f3a] font-semibold">
                      {credentialsModal.password}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-[#C8A96A]/40 bg-[#C8A96A]/10 p-3.5 text-[13px] text-forest">
                <Shield size={16} className="shrink-0 mt-0.5 text-[#8a6f3a]" />
                <p>
                  <strong>The password will not be shown again.</strong> Copy these credentials and share them
                  securely with the doctor.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button onClick={copyFullCredentials} className="flex-1" icon={<Copy size={15} strokeWidth={1.5} />}>
                  {copiedCreds ? 'Copied credentials!' : 'Copy credentials'}
                </Button>
                <Button variant="secondary" tone="light" onClick={() => setCredentialsModal(null)}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal: Password reset result */}
        <Modal
          open={resetModal !== null}
          onClose={() => setResetModal(null)}
          eyebrow="Credentials regenerated"
          title="New Password"
          width={480}
        >
          {resetModal && (
            <div className="space-y-4">
              <p className="text-[14px] text-stone">
                A new temporary password was generated for <strong>{resetModal.doctor.name}</strong> (
                {resetModal.doctor.doctorId}).
              </p>

              <div className="flex items-center justify-between rounded-xl border border-hairline bg-linen p-4">
                <span className="font-mono-ish text-[18px] font-semibold text-[#8a6f3a]">
                  {resetModal.newPassword}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    if (resetModal.newPassword) {
                      await navigator.clipboard.writeText(resetModal.newPassword)
                      setCopiedReset(true)
                      setTimeout(() => setCopiedReset(false), 2000)
                    }
                  }}
                  className="btn btn-secondary btn-sm on-light"
                >
                  {copiedReset ? 'Copied' : 'Copy'}
                </button>
              </div>

              <p className="text-[12px] text-stone">
                Please deliver this password securely to the doctor.
              </p>

              <div className="pt-2">
                <Button block onClick={() => setResetModal(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal: Deactivate Confirmation */}
        <Modal
          open={deactivateModal !== null}
          onClose={() => setDeactivateModal(null)}
          eyebrow="Practitioner status"
          title={deactivateModal?.targetActive ? 'Reactivate doctor?' : 'Deactivate doctor?'}
          width={460}
        >
          {deactivateModal && (
            <div className="space-y-4">
              <p className="text-[14px] text-stone">
                {deactivateModal.targetActive ? (
                  <>
                    Are you sure you want to reactivate access for <strong>{deactivateModal.doctor.name}</strong> (
                    {deactivateModal.doctor.doctorId})? They will be able to sign in and record sessions again.
                  </>
                ) : (
                  <>
                    Are you sure you want to deactivate access for <strong>{deactivateModal.doctor.name}</strong> (
                    {deactivateModal.doctor.doctorId})? They will immediately be prevented from signing in.
                  </>
                )}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  loading={deactivating}
                  onClick={handleConfirmDeactivate}
                  className="flex-1"
                >
                  Confirm
                </Button>
                <Button
                  variant="secondary"
                  tone="light"
                  disabled={deactivating}
                  onClick={() => setDeactivateModal(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PageTransition>
  )
}
