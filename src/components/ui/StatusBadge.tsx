import { statusBadgeClasse } from '../../lib/statusVisual'

// Rótulo e ícone por valor de "Situação" — a cor não vive mais aqui: ela vem de
// `statusBadgeClasse` (lib/statusVisual.ts), a mesma paleta usada pelo Status Final, para que
// valores iguais ou equivalentes das duas colunas (ex.: "Cirurgia realizada" / "CIRURGIA
// REALIZADA") fiquem sempre com a mesma cor.
const STATUS_CONFIG: Record<string, { label: string; icon: string }> = {
  // Vocabulário atual (planilha importada, coluna Situacao)
  Faturado: { label: 'Faturado', icon: 'receipt_long' },
  Aprovado: { label: 'Aprovado', icon: 'verified' },
  'Cirurgia realizada': { label: 'Cirurgia realizada', icon: 'health_and_safety' },
  'A vencer': { label: 'A vencer', icon: 'schedule' },
  Vencido: { label: 'Vencido', icon: 'event_busy' },
  Reprovado: { label: 'Reprovado', icon: 'cancel' },
  // Vocabulário legado (fluxo manual de solicitacoes_cirurgicas, desativado no momento)
  rascunho: { label: 'Rascunho', icon: 'draft' },
  enviado: { label: 'Enviado', icon: 'send' },
  aprovado_gerente: { label: 'Aprovado', icon: 'verified' },
  recusado: { label: 'Recusado', icon: 'cancel' },
  faturado: { label: 'Faturado', icon: 'receipt_long' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, icon: 'label' }

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${statusBadgeClasse(status)}`}
    >
      <span className="material-symbols-outlined text-[12px]">{config.icon}</span>
      {config.label}
    </span>
  )
}
