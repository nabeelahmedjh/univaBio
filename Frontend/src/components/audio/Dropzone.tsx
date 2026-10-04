import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CloudUpload, FileAudio, X } from 'lucide-react'
import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react'
import { ACCEPTED_AUDIO, ACCEPTED_AUDIO_MIME, LARGE_FILE_WARN_MB, MAX_UPLOAD_MB } from '@/lib/config'
import { formatBytes, formatClock } from '@/lib/format'
import { EASE } from '../motion/easing'
import { Waveform } from './Waveform'

interface DropzoneProps {
  file: File | null
  onFile: (file: File | null, durationSec?: number) => void
}

function validate(file: File): string | null {
  const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`
  const okType = ACCEPTED_AUDIO.includes(ext) || ACCEPTED_AUDIO_MIME.includes(file.type)
  if (!okType) return `That file type isn't supported. Please use ${ACCEPTED_AUDIO.join(', ')}.`
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return `That file is larger than ${MAX_UPLOAD_MB} MB.`
  return null
}

export function Dropzone({ file, onFile }: DropzoneProps) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duration, setDuration] = useState<number | null>(null)

  const take = (f: File | undefined) => {
    if (!f) return
    const err = validate(f)
    setError(err)
    setDuration(null)
    if (!err) onFile(f)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    take(e.dataTransfer.files?.[0])
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      input.current?.click()
    }
  }

  const large = file && file.size > LARGE_FILE_WARN_MB * 1024 * 1024

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept={[...ACCEPTED_AUDIO, 'audio/*'].join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          take(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <AnimatePresence mode="wait" initial={false}>
        {!file ? (
          <motion.div
            key="zone"
            role="button"
            tabIndex={0}
            aria-label="Upload audio. Drop a file here or press Enter to browse."
            onKeyDown={onKey}
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(true)
            }}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: EASE }}
            className={`flex h-[240px] cursor-pointer flex-col items-center justify-center rounded-[20px] border px-6 text-center transition-[background-color,border-color] duration-500 ${
              over
                ? 'border-solid border-champagne bg-champagne/[0.06]'
                : 'border-dashed border-champagne/60 bg-paper/40 hover:bg-paper'
            }`}
          >
            <motion.div animate={{ y: over ? -6 : 0 }} transition={{ duration: 0.5, ease: EASE }}>
              <CloudUpload size={36} strokeWidth={1.25} className="text-[#8a6f3a]" />
            </motion.div>
            <p className="mt-5 font-display text-[24px] leading-tight text-ink">
              Drop your audio here or <em className="text-[#8a6f3a] underline decoration-champagne underline-offset-4">browse</em>
            </p>
            <p className="mt-2 text-[13px] text-stone">
              {ACCEPTED_AUDIO.join(', ')} · up to {MAX_UPLOAD_MB} MB
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="rounded-[20px] border border-hairline bg-paper p-5"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linen">
                <FileAudio size={18} strokeWidth={1.25} className="text-forest" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-ink">{file.name}</p>
                <p className="text-[12px] text-stone">
                  {formatBytes(file.size)}
                  {duration != null && ` · ${formatClock(duration)}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onFile(null)
                  setDuration(null)
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full text-stone transition-colors hover:bg-linen hover:text-ink"
                aria-label={`Remove ${file.name}`}
              >
                <X size={18} strokeWidth={1.25} />
              </button>
            </div>
            <Waveform
              file={file}
              label={file.name}
              onReady={(d) => {
                setDuration(d)
                onFile(file, d)
              }}
            />
            {large && (
              <p className="mt-4 flex items-center gap-2 text-[13px] text-stone">
                <AlertCircle size={14} strokeWidth={1.5} className="text-[#8a6f3a]" />
                This is a large file, so the upload may take a little while.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <div aria-live="polite">
        {error && <p className="field-error pt-3">{error}</p>}
      </div>
    </div>
  )
}
