import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-surface-container-lowest rounded-xl elevation-ambient ${className}`}
      {...props}
    />
  )
}
