import { useAnimationControls } from 'framer-motion'
import { useCallback } from 'react'

/** Subtle horizontal shake: x ±6px, 3 cycles, ~400ms. */
export function useShake() {
  const controls = useAnimationControls()
  const shake = useCallback(
    () =>
      controls.start({
        x: [0, -6, 6, -6, 6, -6, 6, 0],
        transition: { duration: 0.42, ease: 'easeInOut' },
      }),
    [controls],
  )
  return { controls, shake }
}
