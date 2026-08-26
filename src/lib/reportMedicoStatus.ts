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
  return normalizarStatusFinal(extra?.status_final ?? '')
}

// "AGENDAMENTO" e "AGENDADO" eram o mesmo estado com dois rótulos. "AGENDADO" é o valor único
// daqui em diante; a migração normaliza os dados históricos e esta função garante que qualquer
// linha ainda não migrada (ou vinda de outra origem) apareça no grupo certo.
export function normalizarStatusFinal(status: string | null | undefined): string {
  const bruto = (status ?? '').trim().toUpperCase()
  return bruto === 'AGENDAMENTO' ? 'AGENDADO' : bruto
}

export function dataProtocoloDe(extra: StatusExtra | null | undefined): string | null {
  return extra?.data_protocolo ?? null
}

export function observacoesDe(extra: StatusExtra | null | undefined): string {
  return extra?.observacoes ?? ''
}

export const STATUS_FINAL_OPCOES = [
  'AGENDADO',
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
  AGENDADO: 'event_available',
  'CIRURGIA REALIZADA': 'health_and_safety',
  NEGADO: 'cancel',
  DESISTÊNCIA: 'person_remove',
  CANCELADO: 'block',
  OUTROS: 'more_horiz',
}

export function statusFinalIcone(status: string): string {
  const normalizado = normalizarStatusFinal(status)
  if (!normalizado) return 'remove'
  return ICONE_POR_STATUS[normalizado as StatusFinal] ?? 'label'
}

// "PROTOCOLADO" sem data de protocolo não é um estado válido: a data é o que permite medir há
// quantos dias a solicitação está parada nesse status (ver `alertaProtocolo` em lib/alertas).
// O banco também barra isso (constraint report_medico_status_protocolado_exige_data); esta
// função existe para dar a mensagem amigável antes da ida ao servidor, e para desabilitar a
// opção na lista de status. Valida o patch inteiro (status e/ou data), cobrindo também o caso
// de limpar a data de uma solicitação que já está PROTOCOLADA.
export function motivoBloqueioPatch(
  patch: Partial<StatusExtra>,
  extra: StatusExtra | null | undefined,
): string | null {
  const statusResultante = 'status_final' in patch ? (patch.status_final ?? '') : statusFinalDe(extra)
  if (normalizarStatusFinal(statusResultante) !== 'PROTOCOLADO') return null
  const dataResultante = 'data_protocolo' in patch ? patch.data_protocolo : dataProtocoloDe(extra)
  if (dataResultante) return null
  return 'status_final' in patch
    ? 'Preencha a Data Protocolo antes de mudar o status para PROTOCOLADO.'
    : 'Esta solicitação está PROTOCOLADA — a Data Protocolo não pode ficar vazia.'
}
