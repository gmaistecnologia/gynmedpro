import type { Tables } from './database.types'

export type Role = 'gerente_comercial' | 'representante' | 'admin'

export type StatusSolicitacao =
  | 'rascunho'
  | 'enviado'
  | 'aprovado_gerente'
  | 'recusado'
  | 'faturado'

export type Profile = Tables<'profiles'>

// Alias mantido pelos módulos que já foram escritos contra ele (email/avatar_url/ativo agora
// vêm nativamente de Tables<'profiles'>, então isto é só um sinônimo de Profile).
export type ProfileCompleto = Profile

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
export type CarteiraMedico = Tables<'carteira_medicos'>

// `representante_efetivo_id`/`representante_efetivo_nome` são colunas computadas do Postgres
// (funções que recebem a linha inteira — ver migração create_carteira_medicos): o representante
// da carteira do médico, com fallback pro representante_id/nome do próprio orçamento importado
// quando o médico não está em nenhuma carteira. Não aparecem em `Tables<'solicitacoes_importadas'>`
// (não são colunas físicas), por isso ficam adicionadas aqui — precisam ser pedidas explicitamente
// no `.select()` (ver CAMPOS_SOLICITACOES em RelatoriosPage.tsx e SELECT_COM_STATUS em
// ReportMedicoPage.tsx) pra virem preenchidas.
export type ComRepresentanteEfetivo = {
  representante_efetivo_id: string | null
  representante_efetivo_nome: string | null
}

// Usado pelo Painel Comercial (RelatoriosPage e as tabelas que ele alimenta): o pipeline
// financeiro (cotação/autorização/cirurgia realizada) precisa do rastreamento operacional em
// `report_medico_status.status_final`, não da coluna `situacao` (snapshot estático da planilha
// importada, que não reflete o progresso feito depois pelo time — ver correção de 2026-08-31).
export type SolicitacaoImportadaComStatus = SolicitacaoImportada &
  ComRepresentanteEfetivo & {
    report_medico_status: Pick<ReportMedicoStatus, 'status_final'> | null
  }

export type SolicitacaoComRelacoes = SolicitacaoCirurgica & {
  hospitais: Pick<Hospital, 'id' | 'nome_fantasia' | 'cidade' | 'uf'> | null
  profiles: Pick<ProfileCompleto, 'id' | 'nome' | 'ativo'> | null
  planos_saude: Pick<PlanoSaude, 'id' | 'nome'> | null
  tipos_cirurgia: Pick<TipoCirurgia, 'id' | 'nome'> | null
  itens_solicitados: (ItemSolicitado & { produtos: Produto | null })[]
  anexos_solicitacoes: AnexoSolicitacao[]
}
