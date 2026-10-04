import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { EASE } from './easing'

/**
 * Route-level transition (spec §7.2).
 * Exit: opacity 1→0, y 0→-12, 350ms easeIn.  Enter: opacity 0→1, y 16→0, 700ms.
 */
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : 16 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } }}
      exit={{ opacity: 0, y: reduce ? 0 : -12, transition: { duration: 0.35, ease: 'easeIn' } }}
    >
      {children}
    </motion.div>
  )
}
