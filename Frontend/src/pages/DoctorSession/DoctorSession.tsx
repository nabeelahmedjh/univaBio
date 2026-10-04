import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, Check, CloudUpload, Mic, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { DoctorShell } from '@/app/layouts/DoctorShell'
import { Dropzone } from '@/components/audio/Dropzone'
import { isRecordingSupported, Recorder } from '@/components/audio/Recorder'
import { EASE } from '@/components/motion/easing'
import { PageTransition } from '@/components/motion/PageTransition'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Monogram } from '@/components/ui/Monogram'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useLeaveGuard } from '@/hooks/useLeaveGuard'
import { api } from '@/lib/api'
import { STATUS_POLL_MS } from '@/lib/config'
import { errorMessage } from '@/lib/errors'
import { qk } from '@/lib/queries'
import type { Patient } from '@/lib/types'
import { ProcessingView, UploadingView } from './ProgressViews'

type Method = 'upload' | 'record'
type Verify = { state: 'idle' } | { state: 'checking' } | { state: 'ok'; patient: Patient } | { state: 'error'; message: string }
type Phase = 'form' | 'uploading' | 'processing' | 'done'

function CheckDraw() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="var(--champagne)"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
      />
      <motion.path
        d="M7.5 12.5l3 3 6-6.5"
        stroke="#8a6f3a"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, ease: EASE, delay: 0.45 }}
      />
    </svg>
  )
}

interface OptionProps {
  value: Method
  selected: Method | null
  onSelect: (m: Method) => void
  icon: React.ReactNode
  title: string
  line: string
}

function MethodOption({ value, selected, onSelect, icon, title, line }: OptionProps) {
  const isSel = selected === value
  const dim = selected !== null && !isSel
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSel}
      onClick={() => onSelect(value)}
      className={`relative flex min-h-[200px] flex-1 flex-col justify-between rounded-[20px] p-7 text-left transition-all duration-500 ${
        isSel
          ? 'border-[1.5px] border-champagne bg-paper'
          : 'border border-hairline bg-linen/60 hover:border-champagne/70 hover:bg-paper'
      } ${dim ? 'opacity-60 hover:opacity-100' : ''}`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ivory text-forest">{icon}</span>
      <AnimatePresence>
        {isSel && (
          <motion.span
            className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-champagne text-ink"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <Check size={14} strokeWidth={2} />
          </motion.span>
        )}
      </AnimatePresence>
      <span>
        <span className="block font-display text-[26px] leading-tight text-ink">{title}</span>
        <span className="mt-1 block text-[14px] text-stone">{line}</span>
      </span>
    </button>
  )
}

function Expand({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function DoctorSession() {
  useDocumentMeta('New session')
  const toast = useToast()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const recordSupported = isRecordingSupported()

  const [patientId, setPatientId] = useState(params.get('patient') ?? '')
  const [verify, setVerify] = useState<Verify>({ state: 'idle' })
  const [method, setMethod] = useState<Method | null>(null)
  const [audio, setAudio] = useState<File | null>(null)
  const [duration, setDuration] = useState<number | undefined>()
  const [recActive, setRecActive] = useState(false)
  const [phase, setPhase] = useState<Phase>('form')
  const [progress, setProgress] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const verifySeq = useRef(0)

  // Leave guard: mid-recording, holding an unsaved take, or uploading.
  const guard = useLeaveGuard(recActive || phase === 'uploading' || (audio !== null && phase === 'form'))

  /* Step 1: verify patient ID (300ms debounce, also on blur) */
  const runVerify = useCallback(async (raw: string) => {
    const id = raw.trim()
    const seq = ++verifySeq.current
    if (id.length < 3) {
      setVerify(id ? { state: 'error', message: 'Patient IDs are a little longer than that.' } : { state: 'idle' })
      return
    }
    setVerify({ state: 'checking' })
    try {
      const patient = await api.getPatient(id)
      if (seq === verifySeq.current) setVerify({ state: 'ok', patient })
    } catch (e) {
      if (seq === verifySeq.current) setVerify({ state: 'error', message: errorMessage(e, "We couldn't find that patient.") })
    }
  }, [])

  useEffect(() => {
    if (!patientId.trim()) {
      verifySeq.current++
      setVerify({ state: 'idle' })
      return
    }
    const t = window.setTimeout(() => runVerify(patientId), 300)
    return () => window.clearTimeout(t)
  }, [patientId, runVerify])

  const verified = verify.state === 'ok'
  const canSubmit = verified && audio !== null && !recActive

  const setAudioFile = useCallback((f: File | null, d?: number) => {
    setAudio(f)
    setDuration(d)
    setSubmitError(null)
  }, [])

  const chooseMethod = (m: Method) => {
    if (m === method) return
    setMethod(m)
    setAudioFile(null)
  }

  /* Poll processing status every 3s */
  useEffect(() => {
    if (phase !== 'processing' || !sessionId) return
    let alive = true
    const poll = async () => {
      try {
        const { status } = await api.getSessionStatus(sessionId)
        if (!alive) return
        if (status === 'ready') {
          setPhase('done')
          qc.invalidateQueries({ queryKey: qk.overview })
          qc.invalidateQueries({ queryKey: qk.patients })
          if (verify.state === 'ok') qc.invalidateQueries({ queryKey: qk.patientSessions(verify.patient.id) })
          toast.show({
            title: 'Session saved',
            description: 'The note is ready to read.',
            action: verify.state === 'ok'
              ? { label: 'View session', onClick: () => navigate(`/patient/${encodeURIComponent(verify.patient.id)}?s=${sessionId}`) }
              : undefined,
          })
        } else if (status === 'failed') {
          setPhase('form')
          setSubmitError('Continuo could not process this recording. Your audio is still here, so you can try again.')
        }
      } catch {
        /* transient: keep polling */
      }
    }
    const t = window.setInterval(poll, STATUS_POLL_MS)
    poll()
    return () => {
      alive = false
      window.clearInterval(t)
    }
  }, [phase, sessionId, qc, toast, navigate, verify])

  const submit = async () => {
    if (!canSubmit || verify.state !== 'ok' || !audio) return
    setSubmitError(null)
    setProgress(0)
    setPhase('uploading')
    try {
      const res = await api.createSession(
        { patientId: verify.patient.id, audio, durationSec: duration },
        { onProgress: setProgress },
      )
      setSessionId(res.sessionId)
      setPhase(res.status === 'ready' ? 'done' : 'processing')
    } catch (e) {
      setPhase('form')
      setSubmitError(errorMessage(e, 'The upload did not complete.'))
    }
  }

  const startAnother = () => {
    setPhase('form')
    setPatientId('')
    setMethod(null)
    setAudioFile(null)
    setSessionId(null)
  }

  return (
    <PageTransition>
      <DoctorShell>
        <div className="mx-auto max-w-[640px] px-5 pb-40 pt-10 sm:px-8 md:pt-14">
          <Link to="/doctor/dashboard" className="link-underline text-[13px] text-stone hover:text-ink">
            <ArrowLeft size={14} strokeWidth={1.25} /> Dashboard
          </Link>

          <AnimatePresence mode="wait">
            {phase === 'uploading' ? (
              <motion.div key="up" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <UploadingView progress={progress} />
              </motion.div>
            ) : phase === 'processing' ? (
              <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ProcessingView />
              </motion.div>
            ) : phase === 'done' ? (
              <motion.div
                key="done"
                className="flex flex-col items-center py-20 text-center"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-champagne">
                  <Check size={26} strokeWidth={1.25} className="text-[#8a6f3a]" />
                </span>
                <p className="eyebrow on-light mt-8">Session saved</p>
                <h1 className="t-h2 mt-3 text-ink">
                  The note is <em className="italic">ready.</em>
                </h1>
                {verify.state === 'ok' && (
                  <p className="mt-3 text-stone">
                    {verify.patient.name} can read it from their patient portal.
                  </p>
                )}
                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  {verify.state === 'ok' && sessionId && (
                    <ButtonLink to={`/patient/${encodeURIComponent(verify.patient.id)}?s=${sessionId}`}>View session</ButtonLink>
                  )}
                  <Button variant="secondary" tone="light" onClick={startAnother}>
                    Begin another
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <header className="mt-10">
                  <p className="eyebrow on-light">New session</p>
                  <h1 className="t-h1 mt-3 text-ink">
                    Begin a <em className="italic">conversation.</em>
                  </h1>
                </header>

                {/* Step 1 */}
                <section className="mt-14" aria-labelledby="step1">
                  <p id="step1" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone">
                    Step 1
                  </p>
                  <div className="relative mt-2">
                    <label htmlFor="session-patient" className="sr-only">
                      Patient ID
                    </label>
                    <input
                      id="session-patient"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      onBlur={() => patientId.trim() && runVerify(patientId)}
                      placeholder="Patient ID"
                      autoComplete="off"
                      spellCheck={false}
                      autoCapitalize="characters"
                      aria-invalid={verify.state === 'error' || undefined}
                      aria-describedby="patient-status"
                      className="peer w-full border-0 border-b border-[rgba(15,26,23,0.18)] bg-transparent pb-3 pt-2 font-display text-[28px] tracking-[0.04em] text-ink outline-none placeholder:text-stone/50 focus-visible:outline-none"
                    />
                    <span className="pointer-events-none absolute bottom-0 left-0 right-0 h-px origin-center scale-x-0 bg-champagne transition-transform duration-300 peer-focus:scale-x-100" />
                    {verify.state === 'checking' && (
                      <span className="absolute bottom-4 right-0">
                        <Spinner size={18} />
                      </span>
                    )}
                  </div>
                  <div id="patient-status" aria-live="polite" className="min-h-[56px] pt-4">
                    <AnimatePresence mode="wait">
                      {verify.state === 'ok' && (
                        <motion.div
                          key="ok"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4, ease: EASE }}
                          className="inline-flex items-center gap-3 rounded-full border border-hairline bg-paper py-1.5 pl-1.5 pr-4"
                        >
                          <Monogram name={verify.patient.name} size={30} />
                          <span className="text-[14px] font-medium text-ink">{verify.patient.name}</span>
                          <CheckDraw />
                        </motion.div>
                      )}
                      {verify.state === 'error' && (
                        <motion.p
                          key="err"
                          className="field-error flex items-center gap-2"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          <AlertCircle size={14} strokeWidth={1.5} /> {verify.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </section>

                {/* Step 2 */}
                <Expand show={verified}>
                  <section className="pt-6" aria-labelledby="step2">
                    <p id="step2" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone">
                      Step 2 · Choose a method
                    </p>
                    <div role="radiogroup" aria-labelledby="step2" className="mt-4 flex flex-col gap-4 sm:flex-row">
                      <MethodOption
                        value="upload"
                        selected={method}
                        onSelect={chooseMethod}
                        icon={<CloudUpload size={22} strokeWidth={1.25} />}
                        title="Upload audio"
                        line="Add a recording you already have."
                      />
                      {recordSupported && (
                        <MethodOption
                          value="record"
                          selected={method}
                          onSelect={chooseMethod}
                          icon={<Mic size={22} strokeWidth={1.25} />}
                          title="Record now"
                          line="Capture the conversation live."
                        />
                      )}
                    </div>
                    {!recordSupported && (
                      <p className="mt-3 text-[13px] text-stone">
                        Live recording isn't available in this browser. You can still upload a recording.
                      </p>
                    )}
                  </section>
                </Expand>

                {/* Step 3 */}
                <Expand show={verified && method !== null}>
                  <section className="pt-10" aria-label="Audio">
                    <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone">
                      Step 3 · {method === 'record' ? 'Record' : 'Upload'}
                    </p>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={method}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5, ease: EASE }}
                      >
                        {method === 'upload' && <Dropzone file={audio} onFile={setAudioFile} />}
                        {method === 'record' && verify.state === 'ok' && (
                          <Recorder patientId={verify.patient.id} onComplete={setAudioFile} onActiveChange={setRecActive} />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </section>
                </Expand>

                <AnimatePresence>
                  {submitError && (
                    <motion.div
                      role="alert"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-8 flex flex-col gap-4 rounded-[16px] border border-danger/30 bg-danger/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <p className="flex items-start gap-2 text-[14px] text-danger">
                        <AlertCircle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" /> {submitError}
                      </p>
                      <Button variant="secondary" tone="light" size="sm" onClick={submit} icon={<RotateCcw size={14} strokeWidth={1.5} />}>
                        Retry
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sticky submit bar */}
        <AnimatePresence>
          {phase === 'form' && verified && (
            <motion.div
              className="no-print fixed inset-x-0 bottom-[72px] z-30 border-t border-hairline bg-ivory/90 backdrop-blur-md md:bottom-0 md:left-[72px]"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <div className="mx-auto flex max-w-[640px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
                <p className="hidden text-[13px] text-stone sm:block">
                  {audio ? 'Ready when you are.' : recActive ? 'Stop the recording to continue.' : 'Add audio to continue.'}
                </p>
                <Button onClick={submit} disabled={!canSubmit} className="w-full sm:w-auto">
                  Create session
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Modal open={guard.pending !== null} onClose={guard.stay} eyebrow="Unsaved audio" title="Leave this session?">
          <p className="text-[15px] text-stone">
            {recActive
              ? 'You are still recording. If you leave now, the recording will be lost.'
              : 'The audio has not been saved yet. If you leave now, it will be lost.'}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button onClick={guard.stay}>Stay</Button>
            <Button variant="secondary" tone="light" onClick={guard.leave}>
              Leave anyway
            </Button>
          </div>
        </Modal>
      </DoctorShell>
    </PageTransition>
  )
}
