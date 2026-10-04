import { motion, useReducedMotion } from 'framer-motion'
import { EASE } from '../motion/easing'

/**
 * Single-line SVG illustrations (spec §9, image D): continuous champagne
 * strokes on transparent, drawn in with a stroke-dash animation.
 */
const ART = {
  notebook: [
    'M20 34c14-6 28-6 44 2v74c-16-8-30-8-44-2z',
    'M64 36c16-8 30-8 44-2v74c-14-6-28-6-44 2',
    'M30 52c8-2 16-2 24 1M30 64c8-2 16-2 24 1M30 76c6-1 12-1 18 0M74 53c8-3 16-3 24-1M74 65c8-3 16-3 24-1',
    'M96 20l8 8-26 40-10 4 2-10z',
  ],
  mic: [
    'M64 18c-10 0-16 7-16 16v28c0 9 6 16 16 16s16-7 16-16V34c0-9-6-16-16-16z',
    'M38 56c0 16 11 28 26 28s26-12 26-28',
    'M64 84v20M48 106h32',
    'M56 36h16M56 46h16M56 56h16',
  ],
  leaf: [
    'M30 98C30 56 58 26 102 22c2 44-24 76-66 78',
    'M30 98c18-20 38-40 62-62',
    'M52 76c-2-8-2-16 0-24M66 62c-1-8 0-16 2-22M64 80c8 0 16-2 22-6M78 66c8-1 14-4 18-8',
  ],
  heartHand: [
    'M64 52c-6-10-22-10-22 4 0 10 12 18 22 26 10-8 22-16 22-26 0-14-16-14-22-4z',
    'M18 96c10-6 20-8 30-6l22 4c6 1 6 9 0 10l-16 1',
    'M54 105l26-3c8-1 16-6 24-14 4-4 10 0 7 5-8 12-20 20-34 22H18',
  ],
  loop: [
    'M64 64c-10-14-18-22-28-22a22 22 0 0 0 0 44c10 0 18-8 28-22s18-22 28-22a22 22 0 0 1 0 44c-10 0-18-8-28-22z',
  ],
} as const

export type LineArtName = keyof typeof ART

interface LineArtProps {
  name: LineArtName
  size?: number
  strokeWidth?: number
  className?: string
  color?: string
  delay?: number
  duration?: number
  /** Animate only when scrolled into view. */
  inView?: boolean
}

export function LineArt({
  name,
  size = 120,
  strokeWidth = 1.25,
  className,
  color = 'var(--champagne)',
  delay = 0,
  duration = 1.8,
  inView = false,
}: LineArtProps) {
  const reduce = useReducedMotion()
  const paths = ART[name]
  const target = { pathLength: 1, opacity: 1 }
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none" aria-hidden className={className}>
      {paths.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={reduce ? false : { pathLength: 0, opacity: 0 }}
          {...(inView
            ? { whileInView: target, viewport: { once: true, amount: 0.4 } }
            : { animate: target })}
          transition={{
            pathLength: { duration, ease: EASE, delay: delay + i * 0.25 },
            opacity: { duration: 0.2, delay: delay + i * 0.25 },
          }}
        />
      ))}
    </svg>
  )
}

interface EmptyStateProps {
  art: LineArtName
  message: string
  action?: React.ReactNode
  className?: string
}

/** Line illustration + one calm sentence + one action. */
export function EmptyState({ art, message, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center px-6 py-16 text-center ${className}`}>
      <LineArt name={art} size={120} />
      <p className="mt-6 max-w-sm font-display text-[24px] leading-snug text-ink">{message}</p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  )
}
