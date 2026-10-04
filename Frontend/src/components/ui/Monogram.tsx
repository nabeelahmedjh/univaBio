import { initials } from '@/lib/format'

interface MonogramProps {
  name: string
  size?: number
  tone?: 'forest' | 'ivory' | 'champagne'
  className?: string
}

/** Circular monogram avatar with initials in Cormorant. */
export function Monogram({ name, size = 44, tone = 'forest', className = '' }: MonogramProps) {
  const styles = {
    forest: 'bg-forest text-ivory',
    ivory: 'bg-ivory text-forest border border-hairline',
    champagne: 'bg-champagne text-ink',
  }[tone]
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-medium tracking-wide ${styles} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials(name)}
    </span>
  )
}
