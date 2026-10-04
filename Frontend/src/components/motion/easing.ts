import type { Transition } from 'framer-motion'

/** Global easing: cubic-bezier(0.22, 1, 0.36, 1) */
export const EASE = [0.22, 1, 0.36, 1] as const

export const T_ENTER: Transition = { duration: 0.7, ease: EASE }
export const T_EXIT: Transition = { duration: 0.35, ease: 'easeIn' }
export const T_SLOW: Transition = { duration: 0.9, ease: EASE }
