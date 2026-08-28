// Catálogo de colunas da tabela do Report Médico, usado tanto pela renderização (ReportMedicoPage)
// quanto pelo modal de personalização (PersonalizarColunasModal) — uma única fonte de verdade
// pros rótulos e pras regras de quem pode ver/ocultar cada coluna.
export type ColunaReportMedicoKey =
  | 'representante'
  | 'medico'
  | 'paciente'
  | 'procedimento'
  | 'convenio'
  | 'hospital'
  | 'solicitacao'
  | 'protocolo'
  | 'cirurgia'
  | 'status'
  | 'observacoes'

export type ColunaReportMedicoDef = {
  key: ColunaReportMedicoKey
  label: string
  /** Não pode ser ocultada (mas pode ser reordenada) — é a única coluna que identifica a linha
   * sem precisar abrir o detalhe. */
  fixa?: boolean
  /** Só é oferecida a gerente_comercial e admin — representante não vê a própria coluna. */
  somenteGestor?: boolean
}

// Ordem = a ordem padrão da tabela antes de qualquer personalização.
export const COLUNAS_REPORT_MEDICO: ColunaReportMedicoDef[] = [
  { key: 'representante', label: 'Representante', somenteGestor: true },
  { key: 'medico', label: 'Médico' },
  { key: 'paciente', label: 'Paciente', fixa: true },
  { key: 'procedimento', label: 'Procedimento' },
  { key: 'convenio', label: 'Convênio' },
  { key: 'hospital', label: 'Hospital' },
  { key: 'solicitacao', label: 'Solicitação' },
  { key: 'protocolo', label: 'Protocolo' },
  { key: 'cirurgia', label: 'Cirurgia' },
  { key: 'status', label: 'Status Final' },
  { key: 'observacoes', label: 'Observações' },
]
