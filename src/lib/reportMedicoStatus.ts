import { supabase } from './supabase'
import { statusBadgeClasse, statusBordaClasse, statusIconeClasse, statusSelecionadoClasse } from './statusVisual'

export { statusBadgeClasse, statusBordaClasse, statusIconeClasse, statusSelecionadoClasse }

export type StatusExtra = { status_final: string; data_protocolo: string | null; observacoes: string | null }

// Upsert único usado por toda tela que edita o acompanhamento do Report Médico
// (hoje: detalhe da solicitação, em página cheia ou modal) — a chave é sempre a
// própria solicitação, nunca o Report Médico, que passou a ser somente leitura.
export function salvarReportMedicoStatus(solicitacaoId: string, patch: Partial<StatusExtra>) {
  return supabase
    .from('report_medico_status')
    .upsert({ solicitacao_id: solicitacaoId, ...patch }, { onConflict: 'solicitacao_id' })
}

// Sem registro em report_medico_status, a solicitação ainda não foi tocada pelo time de
// acompanhamento — o campo fica em branco, fiel ao que veio da planilha importada, em vez de
// presumir 'SOLICITADO'.
export function statusFinalDe(extra: StatusExtra | null | undefined): string {
  return extra?.status_final ?? ''
}

export function dataProtocoloDe(extra: StatusExtra | null | undefined): string | null {
  return extra?.data_protocolo ?? null
}

export function observacoesDe(extra: StatusExtra | null | undefined): string {
  return extra?.observacoes ?? ''
}

export const STATUS_FINAL_OPCOES = [
  'AGENDADO',
  'AGENDAMENTO',
  'AUTORIZADO',
  'CANCELADO',
  'CIRURGIA REALIZADA',
  'DEFESA',
  'DESISTÊNCIA',
  'NEGADO',
  'OUTROS',
  'PENDÊNCIA',
  'PENDÊNCIA AGENDAMENTO',
  'PENDÊNCIAS GERAIS',
  'PROTOCOLADO',
  'REINICIADO',
  'SOLICITADO',
] as const

export type StatusFinal = (typeof STATUS_FINAL_OPCOES)[number]

// Ícone por status — usado nas listas de seleção e no badge compacto. As cores em si vêm de
// `statusVisual.ts`, compartilhado com a coluna "Situação" para manter as duas colunas padronizadas.
const ICONE_POR_STATUS: Record<StatusFinal, string> = {
  SOLICITADO: 'send',
  PROTOCOLADO: 'assignment_turned_in',
  DEFESA: 'gavel',
  REINICIADO: 'restart_alt',
  PENDÊNCIA: 'hourglass_top',
  'PENDÊNCIA AGENDAMENTO': 'event_busy',
  'PENDÊNCIAS GERAIS': 'pending_actions',
  AUTORIZADO: 'verified',
  AGENDAMENTO: 'event_note',
  AGENDADO: 'event_available',
  'CIRURGIA REALIZADA': 'health_and_safety',
  NEGADO: 'cancel',
  DESISTÊNCIA: 'person_remove',
  CANCELADO: 'block',
  OUTROS: 'more_horiz',
}

export function statusFinalIcone(status: string): string {
  if (!status) return 'remove'
  return ICONE_POR_STATUS[status as StatusFinal] ?? 'label'
}
