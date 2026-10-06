import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, Mic, MicOff, Pause, Play, RotateCcw, Square } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { formatClock } from '@/lib/format'
import { Button } from '../ui/Button'
import { EASE } from '../motion/easing'
import { Waveform } from './Waveform'

type Phase = 'idle' | 'requesting' | 'denied' | 'recording' | 'paused' | 'review' | 'accepted'

const BARS = 40

/** Preferred → fallback. iOS Safari only supports audio/mp4. */
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']


function pickMime(): string | undefined {
  return MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported?.(m))
}

function extFor(mime: string): string {
  if (mime.includes('mp4')) return 'm4a'
  if (mime.includes('ogg')) return 'ogg'
  return 'webm'
}

interface RecorderProps {
  patientId: string
  /** Called when the doctor accepts a recording (or null when cleared). */
  onComplete: (file: File | null, durationSec?: number) => void
  /** True while recording/paused or holding an un-accepted take (for leave guards). */
  onActiveChange?: (active: boolean) => void
}

export function Recorder({ patientId, onComplete, onActiveChange }: RecorderProps) {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<Phase>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [take, setTake] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const stream = useRef<MediaStream | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const audioCtx = useRef<AudioContext | null>(null)
  const analyser = useRef<AnalyserNode | null>(null)
  const raf = useRef<number>(0)
  const bars = useRef<(HTMLSpanElement | null)[]>([])
  const startedAt = useRef(0)
  const accumulated = useRef(0)
  const tick = useRef<number>(0)

  useEffect(() => {
    onActiveChange?.(phase === 'recording' || phase === 'paused' || phase === 'review')
  }, [phase, onActiveChange])

  const cleanup = useCallback(() => {
    cancelAnimationFrame(raf.current)
    window.clearInterval(tick.current)
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
    audioCtx.current?.close().catch(() => {})
    audioCtx.current = null
    analyser.current = null
  }, [])

  useEffect(() => cleanup, [cleanup])

  const drawRef = useRef<() => void>(() => {})

  const draw = useCallback(() => {
    const a = analyser.current
    if (!a) return
    const data = new Uint8Array(a.frequencyBinCount)
    a.getByteFrequencyData(data)
    const step = Math.floor(data.length / BARS) || 1
    for (let i = 0; i < BARS; i++) {
      // Mirror around the centre so the shape feels balanced.
      const idx = Math.abs(i - BARS / 2) * step
      const v = data[Math.min(idx, data.length - 1)] / 255
      const el = bars.current[i]
      if (el) el.style.transform = `scaleY(${Math.max(0.08, v * 1.15)})`
    }
    raf.current = requestAnimationFrame(() => drawRef.current())
  }, [])

  useEffect(() => {
    drawRef.current = draw
  }, [draw])

  const currentElapsed = () => accumulated.current + (Date.now() - startedAt.current) / 1000

  const start = async () => {
    setError(null)
    setPhase('requesting')
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      stream.current = s

      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new Ctx()
      const src = ctx.createMediaStreamSource(s)
      const an = ctx.createAnalyser()
      an.fftSize = 256
      an.smoothingTimeConstant = 0.8
      src.connect(an)
      audioCtx.current = ctx
      analyser.current = an

      const mime = pickMime()
      const rec = new MediaRecorder(s, mime ? { mimeType: mime } : undefined)
      chunks.current = []
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data)
      rec.onstop = () => {
        const type = rec.mimeType || mime || 'audio/webm'
        const blob = new Blob(chunks.current, { type })
        const file = new File([blob], `session-${patientId}-${Date.now()}.${extFor(type)}`, { type })
        setTake(file)
        setPhase('review')
        cleanup()
      }
      recorder.current = rec
      rec.start(1000)

      accumulated.current = 0
      startedAt.current = Date.now()
      setElapsed(0)
      tick.current = window.setInterval(() => setElapsed(currentElapsed()), 250)
      setPhase('recording')
      draw()
    } catch (err) {
      cleanup()
      const name = (err as DOMException)?.name
      if (name === 'NotAllowedError' || name === 'SecurityError') setPhase('denied')
      else {
        setPhase('idle')
        setError(
          name === 'NotFoundError'
            ? 'No microphone was found. Please connect one and try again.'
            : 'The microphone could not be started. Please try again.',
        )
      }
    }
  }

  const pause = () => {
    recorder.current?.pause()
    accumulated.current = currentElapsed()
    window.clearInterval(tick.current)
    cancelAnimationFrame(raf.current)
    bars.current.forEach((el) => el && (el.style.transform = 'scaleY(0.08)'))
    setElapsed(accumulated.current)
    setPhase('paused')
  }

  const resume = () => {
    recorder.current?.resume()
    startedAt.current = Date.now()
    tick.current = window.setInterval(() => setElapsed(currentElapsed()), 250)
    setPhase('recording')
    draw()
  }

  const stop = () => {
    if (phase === 'recording') accumulated.current = currentElapsed()
    setElapsed(accumulated.current)
    window.clearInterval(tick.current)
    cancelAnimationFrame(raf.current)
    recorder.current?.stop()
  }

  const reRecord = () => {
    setTake(null)
    setElapsed(0)
    onComplete(null)
    setPhase('idle')
  }

  const accept = () => {
    if (!take) return
    onComplete(take, accumulated.current)
    setPhase('accepted')
  }

  const live = phase === 'recording' || phase === 'paused'

  if (phase === 'denied') {
    return (
      <div className="rounded-[20px] border border-hairline bg-paper p-8 text-center" role="alert">
        <MicOff size={28} strokeWidth={1.25} className="mx-auto text-[#8a6f3a]" />
        <p className="mt-4 font-display text-[24px] text-ink">Microphone access is turned off.</p>
        <p className="mx-auto mt-2 max-w-md text-[14px] text-stone">
          To record, allow microphone access for this site. In most browsers, click the lock or settings icon beside the
          address bar, set Microphone to “Allow”, then try again. You can also upload a recording instead.
        </p>
        <Button variant="secondary" tone="light" className="mt-6" onClick={() => setPhase('idle')}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-[20px] border border-hairline bg-paper px-6 py-10 sm:px-10">
      <AnimatePresence mode="wait" initial={false}>
        {phase === 'review' || phase === 'accepted' ? (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <p className="eyebrow on-light mb-2">Recording · {formatClock(elapsed)}</p>
            <p className="mb-6 font-display text-[26px] leading-tight text-ink">
              {phase === 'accepted' ? 'Recording ready to save.' : 'Listen back, or keep it.'}
            </p>
            {take && <Waveform file={take} label="recording" />}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="secondary" tone="light" onClick={reRecord} icon={<RotateCcw size={16} strokeWidth={1.5} />}>
                Re-record
              </Button>
              {phase === 'review' ? (
                <Button onClick={accept} icon={<Check size={16} strokeWidth={1.75} />}>
                  Use this recording
                </Button>
              ) : (
                <span className="inline-flex items-center gap-2 text-[13px] text-forest">
                  <Check size={16} strokeWidth={1.75} className="text-[#8a6f3a]" /> Added to this session
                </span>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="live"
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            {phase === 'idle' || phase === 'requesting' ? (
              <p className="mb-8 max-w-sm text-center text-[14px] text-stone">
                Continuo needs your microphone to listen. Nothing is stored until you save.
              </p>
            ) : (
              <p
                className="mb-6 font-display text-[40px] leading-none text-ink tabular-nums"
                aria-live="off"
                aria-label={`Recording time ${formatClock(elapsed)}`}
              >
                {formatClock(elapsed)}
              </p>
            )}

            <div className="relative flex h-[120px] w-[120px] items-center justify-center">
              {phase === 'recording' && !reduce && (
                <span className="rec-pulse absolute inset-[12px] rounded-full border-2 border-champagne" aria-hidden />
              )}
              <button
                type="button"
                onClick={live ? stop : start}
                disabled={phase === 'requesting'}
                className={`relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-champagne transition-colors duration-500 ${
                  live ? 'bg-champagne text-ink' : 'bg-ivory text-forest hover:bg-champagne/10'
                }`}
                aria-label={live ? 'Stop recording' : 'Start recording'}
              >
                {live ? <Square size={24} strokeWidth={1.5} fill="currentColor" /> : <Mic size={30} strokeWidth={1.25} />}
              </button>
            </div>

            <div className="sr-only" aria-live="assertive">
              {phase === 'recording' ? 'Recording started' : phase === 'paused' ? 'Recording paused' : ''}
            </div>

            {/* Live waveform: 40 thin bars driven by an AnalyserNode */}
            <div className="mt-8 flex h-14 w-full max-w-[360px] items-center justify-between" aria-hidden>
              {Array.from({ length: BARS }).map((_, i) => (
                <span
                  key={i}
                  ref={(el) => {
                    bars.current[i] = el
                  }}
                  className="block h-full w-[2px] origin-center rounded-full bg-champagne/80"
                  style={{ transform: 'scaleY(0.08)', transition: 'transform 90ms linear' }}
                />
              ))}
            </div>

            {live && (
              <div className="mt-8 flex gap-3">
                {phase === 'recording' ? (
                  <Button variant="secondary" tone="light" size="sm" onClick={pause} icon={<Pause size={14} strokeWidth={1.5} />}>
                    Pause
                  </Button>
                ) : (
                  <Button variant="secondary" tone="light" size="sm" onClick={resume} icon={<Play size={14} strokeWidth={1.5} />}>
                    Resume
                  </Button>
                )}
                <Button variant="secondary" tone="light" size="sm" onClick={stop} icon={<Square size={12} strokeWidth={1.5} />}>
                  Stop
                </Button>
              </div>
            )}

            <p className="mt-8 text-center text-[12px] text-stone">
              Please make sure the patient has agreed to be recorded.
            </p>
            <div aria-live="polite">{error && <p className="field-error pt-3 text-center">{error}</p>}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
