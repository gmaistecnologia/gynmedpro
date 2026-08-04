import { useEffect, useState } from 'react'
import { DateField } from '../ui/DateField'

export function ProtocoloDateInput({
  valor,
  onCommit,
  compact = false,
}: {
  valor: string | null
  onCommit: (novoValor: string) => void
  compact?: boolean
}) {
  const [local, setLocal] = useState(valor ?? '')

  useEffect(() => setLocal(valor ?? ''), [valor])

  return (
    <DateField
      value={local}
      onChange={(iso) => {
        setLocal(iso)
        if (iso !== (valor ?? '')) onCommit(iso)
      }}
      variant={compact ? 'compact' : 'default'}
      placeholder="Sem data"
    />
  )
}

export function ObservacaoInputCompacto({
  valor,
  onCommit,
}: {
  valor: string
  onCommit: (novoValor: string) => void
}) {
  const [local, setLocal] = useState(valor)

  useEffect(() => setLocal(valor), [valor])

  return (
    <input
      type="text"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== valor) onCommit(local)
      }}
      placeholder="Adicionar observação…"
      className="w-full min-w-[160px] bg-transparent text-xs text-on-surface placeholder:text-on-surface-variant border border-transparent hover:border-outline-variant/30 focus:border-primary focus:outline-none rounded-md px-1.5 py-1 transition-colors"
    />
  )
}

export function ObservacaoTextarea({ valor, onCommit }: { valor: string; onCommit: (novoValor: string) => void }) {
  const [local, setLocal] = useState(valor)

  useEffect(() => setLocal(valor), [valor])

  return (
    <textarea
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== valor) onCommit(local)
      }}
      rows={3}
      placeholder="Adicionar observação…"
      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-2.5 px-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors resize-none"
    />
  )
}
