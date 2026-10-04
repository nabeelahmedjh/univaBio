import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow ${className}`}>{children}</p>
}

export function Card({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div aria-hidden className={`skeleton ${className}`} style={style} />
}

/** Footer microcopy present on every screen. */
export function Footer({ tone = 'dark', className = '' }: { tone?: 'dark' | 'light'; className?: string }) {
  return (
    <p
      className={`text-[12px] tracking-[0.12em] ${tone === 'dark' ? 'text-sage/80' : 'text-stone'} ${className}`}
    >
      Continuo · Private by design.
    </p>
  )
}
