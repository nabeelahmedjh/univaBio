import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary'
type Tone = 'dark' | 'light'

interface BaseProps {
  variant?: Variant
  /** Surface the button sits on. Affects secondary text colour. */
  tone?: Tone
  size?: 'md' | 'sm'
  block?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
}

function classes({ variant = 'primary', tone = 'dark', size = 'md', block }: BaseProps, extra = '') {
  return [
    'btn',
    variant === 'primary' ? 'btn-primary' : 'btn-secondary',
    tone === 'light' && variant === 'secondary' ? 'on-light' : '',
    size === 'sm' ? 'btn-sm' : '',
    block ? 'w-full' : '',
    extra,
  ]
    .filter(Boolean)
    .join(' ')
}

interface ButtonProps extends BaseProps, ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
}

export function Button({
  variant,
  tone,
  size,
  block,
  icon,
  iconRight,
  loading,
  loadingText,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classes({ variant, tone, size, block }, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Spinner size={18} track="rgba(15,26,23,0.2)" color={variant === 'secondary' ? 'var(--champagne)' : 'var(--ink)'} />
      ) : (
        icon
      )}
      <span>{loading && loadingText ? loadingText : children}</span>
      {!loading && iconRight}
    </button>
  )
}

interface ButtonLinkProps extends BaseProps, LinkProps {}

export function ButtonLink({ variant, tone, size, block, icon, iconRight, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={classes({ variant, tone, size, block }, className)} {...rest}>
      {icon}
      <span>{children}</span>
      {iconRight}
    </Link>
  )
}
