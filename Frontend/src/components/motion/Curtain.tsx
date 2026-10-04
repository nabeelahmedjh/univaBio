import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { EASE } from './easing'

type CurtainFn = (opts?: { color?: string; onCovered?: () => void }) => Promise<void>

const CurtainContext = createContext<CurtainFn | null>(null)

/**
 * Full-screen "curtain" wipe used after a successful sign-in (spec §8.2):
 * the screen fills with ivory from the bottom (500ms), `onCovered` runs
 * (usually navigation), then the curtain lifts away.
 */
export function CurtainProvider({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  const [state, setState] = useState<{ color: string; phase: 'in' | 'out' } | null>(null)
  const resolver = useRef<(() => void) | null>(null)
  const coveredCb = useRef<(() => void) | undefined>(undefined)

  const run = useCallback<CurtainFn>((opts = {}) => {
    coveredCb.current = opts.onCovered
    setState({ color: opts.color ?? 'var(--ivory)', phase: 'in' })
    return new Promise<void>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const onComplete = () => {
    if (state?.phase === 'in') {
      coveredCb.current?.()
      // Let the next route mount beneath the curtain before lifting it.
      setTimeout(() => setState((s) => (s ? { ...s, phase: 'out' } : s)), 380)
    }
  }

  return (
    <CurtainContext.Provider value={run}>
      {children}
      <AnimatePresence
        onExitComplete={() => {
          resolver.current?.()
          resolver.current = null
        }}
      >
        {state && state.phase === 'in' && (
          <motion.div
            key="curtain"
            aria-hidden
            className="fixed inset-0 z-[90]"
            style={{ background: state.color, transformOrigin: 'bottom' }}
            initial={reduce ? { opacity: 0 } : { scaleY: 0 }}
            animate={reduce ? { opacity: 1 } : { scaleY: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6, ease: EASE } }}
            transition={{ duration: 0.5, ease: EASE }}
            onAnimationComplete={onComplete}
          />
        )}
      </AnimatePresence>
    </CurtainContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCurtain(): CurtainFn {
  const ctx = useContext(CurtainContext)
  if (!ctx) throw new Error('useCurtain must be used within <CurtainProvider>')
  return ctx
}
