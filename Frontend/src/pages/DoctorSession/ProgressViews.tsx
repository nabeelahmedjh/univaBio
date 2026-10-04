import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { LogoMark } from '@/components/ui/Logo'
import { ProgressRing } from '@/components/ui/Spinner'
import { EASE } from '@/components/motion/easing'

const LINES = ['Listening closely…', 'Finding the important moments…', 'Writing it up…']

export function UploadingView({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col items-center py-16 text-center" aria-live="polite">
      <ProgressRing value={progress} />
      <p className="mt-8 font-display text-[28px] text-ink">Sending the recording…</p>
      <p className="mt-2 text-[14px] text-stone">Please keep this page open.</p>
    </div>
  )
}

/** Calm processing screen: the logo loop draws itself repeatedly, microcopy rotates every 3s. */
export function ProcessingView() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setI((x) => (x + 1) % LINES.length), 3000)
    return () => window.clearInterval(t)
  }, [])
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <LogoMark size={140} loop strokeWidth={1.4} />
      <div className="relative mt-10 h-[40px] w-full" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            className="absolute inset-x-0 font-display text-[30px] italic text-ink"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            {LINES[i]}
          </motion.p>
        </AnimatePresence>
      </div>
      <p className="mt-4 text-[14px] text-stone">This usually takes a minute or two. You can stay here.</p>
    </div>
  )
}
