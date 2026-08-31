import { supabase } from './supabase'
import { statusBadgeClasse, statusBordaClasse, statusIconeClasse, statusSelecionadoClasse } from './statusVisual'

export { statusBadgeClasse, statusBordaClasse, statusIconeClasse, statusSelecionadoClasse }

export type StatusExtra = { status_final: string; data_protocolo: string | null; observacoes: string | null }

// Upsert único usado por toda tela que edita o acompanhamento do Report Médico
// (hoje: detalhe da solicitação, em página cheia ou modal) — a chave é sempre a
// própria solicitação, nunca o Report Médico, que passou a ser somente leitura.
//
// IMPORTANTE: recebe sempre o trio completo (status_final, data_protocolo, observacoes), nunca
// um patch parcial. Confirmado em produção em 26/08/2026: um upsert de coluna única (ex.: só
// `status_final`) faz o PostgREST gravar NULL nas colunas ausentes do corpo da requisição mesmo
// ao mesclar com uma linha já existente — ou seja, mudar só o Status Final apagava silenciosamente
// a Data Protocolo e as Observações da linha (e vice-versa). Isso só ficou visível quando a
// constraint `report_medico_status_protocolado_exige_data` passou a rejeitar o caso óbvio
// (status PROTOCOLADO + data apagada), mas o mesmo apagamento acontecia sem aviso pra qualquer
// combinação de campos antes disso. Use `mesclarStatusExtra` para montar o objeto completo antes
// de chamar esta função — nunca passe um patch parcial direto pra cá.
export function salvarReportMedicoStatus(solicitacaoId: string, valores: StatusExtra) {
  return supabase
    .from('report_medico_status')
    .upsert({ solicitacao_id: solicitacaoId, ...valores }, { onConflict: 'solicitacao_id' })
}

// Mescla o estado atual (o que já está salvo/otimisticamente em memória) com um patch parcial,
// produzindo o trio completo que `salvarReportMedicoStatus` exige. Centralizado aqui porque toda
// tela que edita o acompanhamento (detalhe da solicitação, lista de Solicitações) precisa do
// mesmo merge antes de salvar.
//
// IMPORTANTE: `status_final` nunca pode sair daqui como ''. `statusFinalDe` devolve '' pra uma
// solicitação nunca tocada — correto pra EXIBIÇÃO (não presumir "SOLICITADO" na tela), mas a
// coluna no banco é NOT NULL com CHECK numa lista fixa de valores (não inclui ''). Confirmado em
// 27/08/2026: salvar a Data Protocolo ou uma Observação como primeira edição de uma solicitação
// (comum em solicitações antigas nunca tocadas pelo acompanhamento, já que status_final ainda
// não foi definido) mandava status_final: '' pro banco e violava a constraint. Aqui cai pro
// mesmo default que a própria coluna já usa ('SOLICITADO'), nunca ''.
export function mesclarStatusExtra(atual: StatusExtra | null | undefined, patch: Partial<StatusExtra>): StatusExtra {
  return {
    status_final: statusFinalDe(atual) || 'SOLICITADO',
    data_protocolo: dataProtocoloDe(atual),
    observacoes: observacoesDe(atual),
    ...patch,
  }
}

// Sem registro em report_medico_status, a solicitação ainda não foi tocada pelo time de
// acompanhamento — o campo fica em branco, fiel ao que veio da planilha importada, em vez de
// presumir 'SOLICITADO'.
//
// Aceita só `Pick<StatusExtra, 'status_final'>` (não o StatusExtra inteiro) porque telas que só
// precisam do status — ex. o Painel Comercial, que classifica pipeline/realizada — não têm por
// que buscar `data_protocolo`/`observacoes` do banco à toa. Todo StatusExtra completo já
// satisfaz esse tipo, então nenhum chamador existente precisa mudar.
export function statusFinalDe(extra: Pick<StatusExtra, 'status_final'> | null | undefined): string {
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
