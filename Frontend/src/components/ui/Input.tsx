import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { useId, useState, type InputHTMLAttributes, type ReactNode, type Ref } from 'react'

/** Inline error: danger, 13px, slides down 4px with a fade. Announced politely. */
export function FieldError({ id, message }: { id?: string; message?: string }) {
  return (
    <div aria-live="polite" id={id} className="min-h-[20px]">
      <AnimatePresence initial={false}>
        {message && (
          <motion.p
            key={message}
            className="field-error pt-2"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

interface LineInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  label: string
  error?: string
  ref?: Ref<HTMLInputElement>
  /** Show a show/hide toggle for password fields. */
  revealable?: boolean
  trailing?: ReactNode
}

/** Dark-screen input: bottom hairline, floating label, centre-grow champagne underline. */
export function LineInput({ label, error, revealable, trailing, type = 'text', id, ref, className, ...rest }: LineInputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errId = `${inputId}-err`
  const [shown, setShown] = useState(false)
  const actualType = revealable ? (shown ? 'text' : 'password') : type
  return (
    <div className={className}>
      <div className={`field-line ${error ? 'is-invalid' : ''}`}>
        <input
          ref={ref}
          id={inputId}
          type={actualType}
          placeholder=" "
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errId : undefined}
          {...rest}
        />
        <label htmlFor={inputId}>{label}</label>
        <span className="field-bar" aria-hidden />
        {revealable && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            className="absolute right-0 bottom-1 flex h-10 w-10 items-center justify-center text-sage transition-colors hover:text-champagne"
            aria-label={shown ? 'Hide password' : 'Show password'}
            aria-pressed={shown}
          >
            {shown ? <EyeOff size={18} strokeWidth={1.25} /> : <Eye size={18} strokeWidth={1.25} />}
          </button>
        )}
        {trailing && <div className="absolute right-0 bottom-2">{trailing}</div>}
      </div>
      <FieldError id={errId} message={error} />
    </div>
  )
}

interface BoxInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  ref?: Ref<HTMLInputElement>
  trailing?: ReactNode
  hideLabel?: boolean
}

/** Light-screen input: soft rounded linen box with hairline border. */
export function BoxInput({ label, error, hint, trailing, id, ref, className, hideLabel, ...rest }: BoxInputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errId = `${inputId}-err`
  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className={hideLabel ? 'sr-only' : 'mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-stone'}
      >
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          className={`field-box ${error ? 'is-invalid' : ''} ${trailing ? 'pr-24' : ''}`}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errId : undefined}
          {...rest}
        />
        {trailing && <div className="absolute inset-y-0 right-2 flex items-center gap-1">{trailing}</div>}
      </div>
      {hint && !error && <p className="pt-2 text-[12px] text-stone">{hint}</p>}
      <FieldError id={errId} message={error} />
    </div>
  )
}
