import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useFinePointer } from '@/hooks/useMedia'

/**
 * Custom cursor (landing only, desktop): a 10px champagne dot and a 36px ring
 * that lags behind. Over elements with `data-cursor="enter"` the ring grows to
 * 64px and shows "Enter".
 */
export function Cursor() {
  const fine = useFinePointer()
  const reduce = useReducedMotion()
  const enabled = fine && !reduce

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const rx = useSpring(x, { stiffness: 180, damping: 22, mass: 0.6 })
  const ry = useSpring(y, { stiffness: 180, damping: 22, mass: 0.6 })
  const [mode, setMode] = useState<'default' | 'enter' | 'link'>('default')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('custom-cursor')
    const move = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setVisible(true)
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-cursor], a, button')
      if (!el) setMode('default')
      else if (el.dataset.cursor === 'enter') setMode('enter')
      else setMode('link')
    }
    const leave = () => setVisible(false)
    window.addEventListener('pointermove', move)
    document.addEventListener('pointerleave', leave)
    return () => {
      document.documentElement.classList.remove('custom-cursor')
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
    }
  }, [enabled, x, y])

  if (!enabled) return null

  const ringSize = mode === 'enter' ? 64 : mode === 'link' ? 48 : 36

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      <motion.div
        className="absolute left-0 top-0 rounded-full bg-champagne"
        style={{ x, y, width: 10, height: 10, translateX: '-50%', translateY: '-50%' }}
        animate={{ opacity: visible && mode !== 'enter' ? 1 : 0, scale: mode === 'link' ? 0.6 : 1 }}
        transition={{ duration: 0.25 }}
      />
      <motion.div
        className="absolute left-0 top-0 flex items-center justify-center rounded-full border border-champagne/70"
        style={{ x: rx, y: ry, translateX: '-50%', translateY: '-50%' }}
        animate={{
          width: ringSize,
          height: ringSize,
          opacity: visible ? 1 : 0,
          backgroundColor: mode === 'enter' ? 'rgba(200,169,106,0.92)' : 'rgba(200,169,106,0)',
        }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.span
          className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink"
          animate={{ opacity: mode === 'enter' ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          Enter
        </motion.span>
      </motion.div>
    </div>
  )
}
