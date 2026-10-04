import { motion, useReducedMotion, type HTMLMotionProps, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'
import { EASE } from './easing'

interface StaggerProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  /** Seconds between children. Default 90ms. */
  gap?: number
  delay?: number
  as?: 'div' | 'ul' | 'ol' | 'section'
  /** Animate when in view (default) or immediately on mount. */
  trigger?: 'view' | 'mount'
}

/** Staggers its <StaggerItem> children by 90ms. */
export function Stagger({ children, gap = 0.09, delay = 0, as = 'div', trigger = 'view', ...rest }: StaggerProps) {
  const Comp = motion[as] as typeof motion.div
  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: gap, delayChildren: delay } },
  }
  const triggerProps =
    trigger === 'view'
      ? { whileInView: 'show', viewport: { once: true, amount: 0.1 } }
      : { animate: 'show' }
  return (
    <Comp variants={variants} initial="hidden" {...triggerProps} {...rest}>
      {children}
    </Comp>
  )
}

interface ItemProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  y?: number
  as?: 'div' | 'li' | 'article'
}

export function StaggerItem({ children, y = 18, as = 'div', ...rest }: ItemProps) {
  const reduce = useReducedMotion()
  const Comp = motion[as] as typeof motion.div
  const variants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : y },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
  }
  return (
    <Comp variants={variants} {...rest}>
      {children}
    </Comp>
  )
}
