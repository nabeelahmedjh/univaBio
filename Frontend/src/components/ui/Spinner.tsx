interface SpinnerProps {
  size?: number
  className?: string
  /** Track colour; defaults to translucent ink. */
  track?: string
  color?: string
}

/** Thin champagne loading ring. */
export function Spinner({ size = 18, className = '', track = 'rgba(15,26,23,0.18)', color = 'var(--champagne)' }: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={{ animation: 'spin-slow 0.9s linear infinite' }}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" fill="none" stroke={track} strokeWidth="1.6" />
      <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

interface ProgressRingProps {
  value: number // 0..1
  size?: number
}

export function ProgressRing({ value, size = 120 }: ProgressRingProps) {
  const r = 52
  const c = 2 * Math.PI * r
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120" className="-rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--hairline)" strokeWidth="1.5" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="var(--champagne)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          style={{ transition: 'stroke-dashoffset 300ms var(--ease)' }}
        />
      </svg>
      <span
        className="absolute font-display text-[30px] leading-none"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Upload progress"
      >
        {pct}
        <span className="text-[16px] text-stone">%</span>
      </span>
    </div>
  )
}
