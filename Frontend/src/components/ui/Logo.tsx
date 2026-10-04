import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { EASE } from '../motion/easing'

/** The continuous single-line loop (infinity-like ribbon). viewBox 0 0 64 64. */
export const LOOP_PATH =
  'M32 32c-5-7-9-11-14-11a11 11 0 0 0 0 22c5 0 9-4 14-11s9-11 14-11a11 11 0 0 1 0 22c-5 0-9-4-14-11z'

interface MarkProps {
  size?: number
  /** Draw the stroke in on mount. */
  draw?: boolean
  /** Keep re-drawing (processing screen). */
  loop?: boolean
  delay?: number
  duration?: number
  strokeWidth?: number
  className?: string
  color?: string
}

export function LogoMark({
  size = 32,
  draw = true,
  loop = false,
  delay = 0,
  duration = 1.4,
  strokeWidth = 2.2,
  className,
  color = 'var(--champagne)',
}: MarkProps) {
  const reduce = useReducedMotion()
  const animated = draw && !reduce
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={className}
    >
      {loop && (
        <path d={LOOP_PATH} stroke={color} strokeOpacity={0.14} strokeWidth={strokeWidth} />
      )}
      <motion.path
        d={LOOP_PATH}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0, opacity: 0 } : false}
        animate={
          loop && !reduce
            ? { pathLength: [0, 1, 1], pathOffset: [0, 0, 1], opacity: 1 }
            : { pathLength: 1, opacity: 1 }
        }
        transition={
          loop && !reduce
            ? { duration: 3.2, ease: 'easeInOut', repeat: Infinity, times: [0, 0.55, 1] }
            : { pathLength: { duration, ease: EASE, delay }, opacity: { duration: 0.2, delay } }
        }
      />
    </svg>
  )
}

interface LogoProps {
  tone?: 'light' | 'dark'
  draw?: boolean
  to?: string
  size?: 'sm' | 'md'
}

/** Mark + "Continuo" wordmark. `tone="light"` = ivory text for dark screens. */
export function Logo({ tone = 'light', draw = true, to = '/', size = 'md' }: LogoProps) {
  const text = tone === 'light' ? 'text-ivory' : 'text-ink'
  return (
    <Link to={to} className={`inline-flex items-center gap-3 ${text}`} aria-label="Continuo, home">
      <LogoMark size={size === 'sm' ? 26 : 32} draw={draw} />
      <span className={`wordmark ${size === 'sm' ? 'text-[20px]' : 'text-[24px]'} leading-none`}>Continuo</span>
    </Link>
  )
}
