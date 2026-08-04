import type { Tables } from './database.types'

export type Role = 'gerente_comercial' | 'representante' | 'admin'

export type StatusSolicitacao =
  | 'rascunho'
  | 'enviado'
  | 'aprovado_gerente'
  | 'recusado'
  | 'faturado'

export type Profile = Tables<'profiles'>
export type Hospital = Tables<'hospitais'>
export type Produto = Tables<'produtos'>
export type PlanoSaude = Tables<'planos_saude'>
export type TipoCirurgia = Tables<'tipos_cirurgia'>
export type SolicitacaoCirurgica = Tables<'solicitacoes_cirurgicas'>
export type ItemSolicitado = Tables<'itens_solicitados'>
export type AnexoSolicitacao = Tables<'anexos_solicitacoes'>
export type SolicitacaoImportada = Tables<'solicitacoes_importadas'>
export type MetaComercial = Tables<'metas_comerciais'>
export type MetaRepresentante = Tables<'metas_representantes'>
export type ReportMedicoStatus = Tables<'report_medico_status'>

export type SolicitacaoComRelacoes = SolicitacaoCirurgica & {
  hospitais: Pick<Hospital, 'id' | 'nome_fantasia' | 'cidade' | 'uf'> | null
  profiles: Pick<Profile, 'id' | 'nome'> | null
  planos_saude: Pick<PlanoSaude, 'id' | 'nome'> | null
  tipos_cirurgia: Pick<TipoCirurgia, 'id' | 'nome'> | null
  itens_solicitados: (ItemSolicitado & { produtos: Produto | null })[]
  anexos_solicitacoes: AnexoSolicitacao[]
}
