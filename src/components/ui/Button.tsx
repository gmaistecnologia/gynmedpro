import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'tertiary' | 'danger'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  isLoading?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-sm px-5 py-2.5 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-primary-container to-primary text-on-primary shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.98]',
  secondary:
    'bg-surface-container-high text-secondary hover:bg-surface-container-highest',
  tertiary: 'text-primary hover:bg-primary/5 px-3 py-2',
  danger: 'bg-error-container text-on-error-container hover:brightness-95',
}

export function Button({ variant = 'primary', isLoading, className = '', children, disabled, ...props }: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled || isLoading} {...props}>
      {isLoading && (
        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
      )}
      {children}
    </button>
  )
}
