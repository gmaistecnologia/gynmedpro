// Paleta única de cores por status, compartilhada entre a coluna "Situação" (StatusBadge) e a
// coluna "Status Final" (StatusFinalEditavel/ReportMedicoPage). A chave é sempre normalizada em
// maiúsculas, então rótulos iguais ou equivalentes das duas colunas (ex.: "Cirurgia realizada" e
// "CIRURGIA REALIZADA") caem no mesmo grupo e usam sempre a mesma cor.
export type GrupoStatus = 'inicial' | 'atencao' | 'positivo' | 'negativo' | 'neutro'

const GRUPO_POR_STATUS: Record<string, GrupoStatus> = {
  // Em aberto / início do processo
  SOLICITADO: 'inicial',
  PROTOCOLADO: 'inicial',
  ENVIADO: 'inicial',

  // Precisa de atenção
  DEFESA: 'atencao',
  REINICIADO: 'atencao',
  'PENDÊNCIA': 'atencao',
  'PENDÊNCIA AGENDAMENTO': 'atencao',
  'PENDÊNCIAS GERAIS': 'atencao',
  'A VENCER': 'atencao',

  // Resultado positivo
  AUTORIZADO: 'positivo',
  APROVADO: 'positivo',
  APROVADO_GERENTE: 'positivo',
  AGENDAMENTO: 'positivo',
  AGENDADO: 'positivo',
  'CIRURGIA REALIZADA': 'positivo',
  FATURADO: 'positivo',

  // Resultado negativo
  NEGADO: 'negativo',
  RECUSADO: 'negativo',
  REPROVADO: 'negativo',
  'DESISTÊNCIA': 'negativo',
  CANCELADO: 'negativo',
  VENCIDO: 'negativo',

  OUTROS: 'neutro',
  RASCUNHO: 'neutro',
}

export function grupoDeStatus(status: string): GrupoStatus {
  return GRUPO_POR_STATUS[status.trim().toUpperCase()] ?? 'neutro'
}

const CLASSES_POR_GRUPO: Record<GrupoStatus, { badge: string; icone: string; selecionado: string; borda: string }> = {
  inicial: {
    badge: 'bg-primary-container/10 text-primary-container border-primary-container/20',
    icone: 'text-primary-container',
    selecionado: 'bg-primary-container/10',
    borda: 'border-l-[3px] border-l-primary-container',
  },
  atencao: {
    badge: 'bg-[#e8990c]/10 text-[#c8770a] border-[#e8990c]/30',
    icone: 'text-[#c8770a]',
    selecionado: 'bg-[#e8990c]/10',
    borda: 'border-l-[3px] border-l-[#e8990c]',
  },
  positivo: {
    badge: 'bg-tertiary-container/10 text-tertiary-container border-tertiary-container/20',
    icone: 'text-tertiary-container',
    selecionado: 'bg-tertiary-container/10',
    borda: 'border-l-[3px] border-l-tertiary-container',
  },
  negativo: {
    badge: 'bg-error-container text-on-error-container border-error/20',
    icone: 'text-error',
    selecionado: 'bg-error/10',
    borda: 'border-l-[3px] border-l-error',
  },
  neutro: {
    badge: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30',
    icone: 'text-on-surface-variant',
    selecionado: 'bg-surface-container-high/70',
    borda: 'border-l-[3px] border-l-outline-variant',
  },
}

export function statusBadgeClasse(status: string): string {
  return CLASSES_POR_GRUPO[grupoDeStatus(status)].badge
}

export function statusIconeClasse(status: string): string {
  return CLASSES_POR_GRUPO[grupoDeStatus(status)].icone
}

export function statusSelecionadoClasse(status: string): string {
  return CLASSES_POR_GRUPO[grupoDeStatus(status)].selecionado
}

export function statusBordaClasse(status: string): string {
  return CLASSES_POR_GRUPO[grupoDeStatus(status)].borda
}
