import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Reveal } from '@/components/motion/Reveal'

interface Props {
  index: string
  eyebrow: string
  title: string
  italic: string
  body: string
  image: string
  alt: string
  flip?: boolean
}

/** Full-width reveal block with a parallax photograph. */
export function FeatureSection({ index, eyebrow, title, italic, body, image, alt, flip }: Props) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['-8%', '8%'])

  return (
    <section ref={ref} className="relative mx-auto max-w-[1240px] px-6 py-24 md:px-10 md:py-40">
      <div className={`grid items-center gap-12 md:grid-cols-2 md:gap-20 ${flip ? 'md:[&>*:first-child]:order-2' : ''}`}>
        <Reveal>
          <div className="photo-treat aspect-[4/5] overflow-hidden rounded-[24px] border border-hairline md:aspect-[5/6]">
            <motion.img
              src={image}
              alt={alt}
              loading="lazy"
              decoding="async"
              style={{ y, scale: 1.18 }}
              className="h-full w-full object-cover"
            />
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="font-display text-[20px] italic text-champagne/80">{index}</p>
          <p className="eyebrow mt-4">{eyebrow}</p>
          <h2 className="t-h2 mt-5 text-ivory">
            {title} <em className="text-champagne-soft">{italic}</em>
          </h2>
          <p className="mt-6 max-w-[440px] text-[17px] leading-[1.75] text-sage">{body}</p>
        </Reveal>
      </div>
    </section>
  )
}
