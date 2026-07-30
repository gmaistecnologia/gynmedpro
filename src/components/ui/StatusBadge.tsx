import type { StatusSolicitacao } from '../../lib/types'

const STATUS_CONFIG: Record<StatusSolicitacao, { label: string; className: string }> = {
  rascunho: {
    label: 'Rascunho',
    className: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30',
  },
  enviado: {
    label: 'Enviado',
    className: 'bg-primary-container/10 text-primary-container border-primary-container/20',
  },
  aprovado_gerente: {
    label: 'Aprovado',
    className: 'bg-tertiary-container/10 text-tertiary-container border-tertiary-container/20',
  },
  recusado: {
    label: 'Recusado',
    className: 'bg-error-container text-on-error-container border-error/20',
  },
  faturado: {
    label: 'Faturado',
    className: 'bg-secondary-container/40 text-on-secondary-container border-secondary/20',
  },
}

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as StatusSolicitacao] ?? {
    label: status,
    className: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30',
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${config.className}`}
    >
      {config.label}
    </span>
  )
}
