import { animate, motion, useInView, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { EASE } from '../motion/easing'

/** Counts up from 0 over 1.2s (ease-out) the first time it scrolls into view. */
export function CountUp({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setDisplay(value)
      return
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, value, duration, reduce])

  return (
    <span ref={ref} aria-label={String(value)}>
      {display.toLocaleString('en-GB')}
    </span>
  )
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/** Seven tiny bars (Mon → Sun) that grow in. Brightens on parent hover. */
export function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(1, ...data)
  const today = (new Date().getDay() + 6) % 7
  return (
    <div className="flex h-12 items-end gap-[6px]" role="img" aria-label={`Sessions by day this week: ${data.join(', ')}`}>
      {data.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <motion.span
            className={`block w-[6px] origin-bottom rounded-full transition-colors duration-500 ${
              i === today ? 'bg-champagne group-hover:bg-[#b8954f]' : 'bg-champagne/35 group-hover:bg-champagne/70'
            }`}
            style={{ height: `${Math.max(8, (v / max) * 36)}px` }}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.3 + i * 0.06 }}
          />
          <span className="text-[9px] font-semibold text-stone/70">{DAYS[i]}</span>
        </div>
      ))}
    </div>
  )
}

interface StatProps {
  label: string
  value: number
  detail?: string
  aside?: ReactNode
}

export function Stat({ label, value, detail, aside }: StatProps) {
  return (
    <div className="card group h-full p-7 transition-colors duration-500 hover:border-champagne">
      <p className="t-label text-stone">{label}</p>
      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="t-stat text-ink">
            <CountUp value={value} />
          </p>
          {detail && <p className="mt-2 text-[13px] text-stone">{detail}</p>}
        </div>
        {aside}
      </div>
    </div>
  )
}
