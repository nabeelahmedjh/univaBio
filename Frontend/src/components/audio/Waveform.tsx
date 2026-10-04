import { Pause, Play } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { formatClock } from '@/lib/format'

interface WaveformProps {
  file: Blob
  /** Called once the audio is decoded with its duration in seconds. */
  onReady?: (durationSec: number) => void
  height?: number
  label?: string
}

/** Waveform preview with play/pause and click-to-scrub (wavesurfer.js). */
export function Waveform({ file, onReady, height = 56, label = 'recording' }: WaveformProps) {
  const container = useRef<HTMLDivElement>(null)
  const ws = useRef<WaveSurfer | null>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [failed, setFailed] = useState(false)
  const url = useMemo(() => URL.createObjectURL(file), [file])
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  useEffect(() => {
    if (!container.current) return
    setFailed(false)
    const inst = WaveSurfer.create({
      container: container.current,
      url,
      height,
      waveColor: 'rgba(107,107,99,0.35)',
      progressColor: '#C8A96A',
      cursorColor: '#2F4A41',
      cursorWidth: 1,
      barWidth: 2,
      barGap: 3,
      barRadius: 2,
      normalize: true,
      dragToSeek: true,
    })
    ws.current = inst
    inst.on('ready', (d) => {
      setDuration(d)
      onReadyRef.current?.(d)
    })
    inst.on('timeupdate', (t) => setTime(t))
    inst.on('play', () => setPlaying(true))
    inst.on('pause', () => setPlaying(false))
    inst.on('finish', () => setPlaying(false))
    inst.on('error', () => setFailed(true))
    return () => {
      inst.destroy()
      ws.current = null
    }
  }, [url, height])

  useEffect(() => () => URL.revokeObjectURL(url), [url])

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => ws.current?.playPause()}
        disabled={failed || duration === 0}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-hairline text-ink transition-colors hover:border-champagne hover:bg-champagne/10 disabled:opacity-40"
        aria-label={playing ? `Pause ${label}` : `Play ${label}`}
      >
        {playing ? <Pause size={16} strokeWidth={1.5} /> : <Play size={16} strokeWidth={1.5} className="translate-x-[1px]" />}
      </button>
      <div className="min-w-0 flex-1">
        {failed ? (
          <p className="text-[13px] text-stone">A preview isn't available for this format, but it can still be uploaded.</p>
        ) : (
          <div ref={container} className="w-full cursor-pointer" aria-label={`${label} waveform, click to seek`} />
        )}
      </div>
      <span className="font-mono-ish w-[92px] shrink-0 text-right text-[12px] text-stone tabular-nums">
        {formatClock(time)} / {formatClock(duration)}
      </span>
    </div>
  )
}
