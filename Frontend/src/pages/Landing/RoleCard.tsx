import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { PointerEvent } from 'react'
import { LineArt, type LineArtName } from '@/components/ui/LineArt'
import { EASE } from '@/components/motion/easing'

interface RoleCardProps {
  id: 'doctor' | 'patient'
  title: string
  line: string
  art: LineArtName
  delay: number
  chosen: string | null
  onChoose: (id: 'doctor' | 'patient') => void
}

/** Glassy role card with cursor-follow glow, lift on hover and expand-to-navigate. */
export function RoleCard({ id, title, line, art, delay, chosen, onChoose }: RoleCardProps) {
  const reduce = useReducedMotion()
  const isChosen = chosen === id
  const isOther = chosen !== null && !isChosen

  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 40 }}
      animate={{ opacity: isOther ? 0 : 1, y: 0 }}
      transition={{ duration: isOther ? 0.4 : 0.9, ease: EASE, delay: chosen ? 0 : delay }}
      className="w-full md:w-[440px]"
    >
      <motion.button
        type="button"
        data-cursor="enter"
        onPointerMove={onMove}
        onClick={() => onChoose(id)}
        disabled={chosen !== null}
        whileHover={reduce ? undefined : { y: -6 }}
        transition={{ duration: 0.5, ease: EASE }}
        aria-label={`I am a ${id}. ${line}`}
        className="role-card group relative flex h-[240px] w-full flex-col justify-between overflow-hidden rounded-[24px] p-8 text-left transition-[border-color] duration-500 hover:border-champagne focus-visible:border-champagne disabled:cursor-default md:h-[300px] md:p-10"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--hairline)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        {/* Shared-layout background that expands to fill the screen on click */}
        {!isChosen && (
          <motion.span
            layoutId={`role-bg-${id}`}
            className="pointer-events-none absolute inset-0 rounded-[24px]"
            style={{ background: 'transparent' }}
          />
        )}
        <LineArt name={art} size={64} strokeWidth={1.25} delay={delay + 0.4} />
        <div className="relative">
          <p className="font-display text-[32px] leading-none text-ivory md:text-[36px]">{title}</p>
          <div className="mt-3 flex items-end justify-between gap-6">
            <p className="max-w-[260px] text-[15px] leading-relaxed text-sage">{line}</p>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-hairline text-champagne transition-all duration-500 group-hover:translate-x-1.5 group-hover:border-champagne group-hover:bg-champagne group-hover:text-ink">
              <ArrowRight size={18} strokeWidth={1.25} />
            </span>
          </div>
        </div>
      </motion.button>
    </motion.div>
  )
}
