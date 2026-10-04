import { motion, useReducedMotion } from 'framer-motion'
import { Fragment } from 'react'
import { EASE } from './easing'

export interface Word {
  text: string
  italic?: boolean
}

interface SplitWordsProps {
  words: Word[]
  /** Seconds before the first word. */
  delay?: number
  /** Seconds between words. Default 60ms. */
  stagger?: number
  className?: string
  as?: 'h1' | 'h2' | 'p'
}

/** Words reveal one by one with a mask slide-up. */
export function SplitWords({ words, delay = 0, stagger = 0.06, className, as = 'h1' }: SplitWordsProps) {
  const reduce = useReducedMotion()
  const Tag = as
  const label = words.map((w) => w.text).join(' ')
  return (
    <Tag className={className} aria-label={label}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-bottom -mb-[0.12em]">
            <motion.span
              className={`inline-block ${w.italic ? 'italic text-champagne-soft' : ''}`}
              initial={{ y: reduce ? 0 : '110%', opacity: reduce ? 0 : 1 }}
              animate={{ y: '0%', opacity: 1 }}
              transition={{ duration: 0.9, ease: EASE, delay: delay + i * stagger }}
            >
              {w.text}
            </motion.span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  )
}
