import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { useRef, type ReactNode, type PointerEvent } from 'react'
import { useFinePointer } from '@/hooks/useMedia'

interface MagneticProps {
  children: ReactNode
  /** Max travel in px. Default 12. */
  strength?: number
  className?: string
}

/**
 * The wrapped element follows the cursor within `strength` px
 * (spring stiffness 150, damping 15). Disabled on touch and reduced motion.
 */
export function MagneticButton({ children, strength = 12, className }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null)
  const fine = useFinePointer()
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 150, damping: 15, mass: 0.6 })
  const sy = useSpring(y, { stiffness: 150, damping: 15, mass: 0.6 })
  const enabled = fine && !reduce

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!enabled || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
    x.set(Math.max(-1, Math.min(1, dx)) * strength)
    y.set(Math.max(-1, Math.min(1, dy)) * strength)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={className ?? 'inline-flex'}
      style={enabled ? { x: sx, y: sy } : undefined}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.div>
  )
}
