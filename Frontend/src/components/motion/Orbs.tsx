import { motion, useReducedMotion } from 'framer-motion'

/** Two blurred champagne orbs (600px, 12% opacity) drifting on a 30s loop. */
export function Orbs() {
  const reduce = useReducedMotion()
  const drift = (a: number[], b: number[]) =>
    reduce ? {} : { x: a, y: b, transition: { duration: 30, repeat: Infinity, ease: 'easeInOut' as const } }
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-[180px] top-[8%] h-[600px] w-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(200,169,106,0.12) 0%, transparent 65%)', filter: 'blur(40px)' }}
        animate={drift([0, 160, 60, 0], [0, 80, 200, 0])}
      />
      <motion.div
        className="absolute -right-[160px] bottom-[-10%] h-[600px] w-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(228,211,168,0.12) 0%, transparent 65%)', filter: 'blur(50px)' }}
        animate={drift([0, -140, -40, 0], [0, -120, -40, 0])}
      />
    </div>
  )
}
