/**
 * Exportação do Report Médico em .xlsx, no mesmo modelo de colunas do "RELATORIO TOTAL
 * REPS.xlsx" importado (ver `CAMPOS_DESTINO` em importPlanilha.ts), acrescido dos três campos
 * que os representantes atualizam pelo sistema (Status Final, Data Protocolo, Observações).
 *
 * Sempre busca a tabela inteira direto do banco, ignorando filtros/paginação da tela — é um
 * requisito do próprio botão ("Exportar tudo").
 */
import * as XLSX from 'xlsx'
import { supabase } from './supabase'
import { CAMPOS_DESTINO, type CampoKey } from './importPlanilha'
import { componentesIso, formatarDataBR, hojeIso } from './dateUtils'
import { statusFinalDe, dataProtocoloDe, observacoesDe, type StatusExtra } from './reportMedicoStatus'

const SELECT_EXPORT =
  CAMPOS_DESTINO.map((c) => c.key).join(', ') + ', report_medico_status(status_final, data_protocolo, observacoes)'

type LinhaExport = Record<CampoKey, string | number | null> & { report_medico_status: StatusExtra | null }

async function buscarTudoParaExportar(): Promise<LinhaExport[]> {
  const tamanhoLote = 1000
  let offset = 0
  const todas: LinhaExport[] = []
  for (;;) {
    const { data, error } = await supabase
      .from('solicitacoes_importadas')
      .select(SELECT_EXPORT)
      .order('data_solicitacao', { ascending: false })
      .range(offset, offset + tamanhoLote - 1)
    if (error) throw error
    todas.push(...((data as unknown as LinhaExport[]) ?? []))
    if (!data || data.length < tamanhoLote) break
    offset += tamanhoLote
  }
  return todas
}

// 'YYYY-MM-DD' → Date local à meia-noite. É o único jeito seguro de virar uma célula de data do
// Excel sem deslocar o dia por fuso — mesma regra de dateUtils.ts usada no resto do app.
// Confirmado que o SheetJS lê essa combinação (Date local + `dateNF`) corretamente na escrita:
// `new Date(2026, 7, 26)` grava o serial 46260, o mesmo valor de 26/08/2026 no Excel.
function dataCelula(iso: string | null): Date | null {
  if (!iso) return null
  const { ano, mes0, dia } = componentesIso(iso)
  return new Date(ano, mes0, dia)
}

const COLUNAS_STATUS = ['Status Final', 'Data Protocolo', 'Observações'] as const
const CABECALHO = [...CAMPOS_DESTINO.map((c) => c.label), ...COLUNAS_STATUS]

export async function exportarReportMedicoExcel(): Promise<{ registros: number }> {
  const linhas = await buscarTudoParaExportar()

  const linhasPlanilha = linhas.map((r) => {
    const linha: Record<string, unknown> = {}
    for (const campo of CAMPOS_DESTINO) {
      const valor = r[campo.key]
      linha[campo.label] = campo.tipo === 'data' ? dataCelula((valor as string | null) ?? null) : valor
    }
    // Sem registro em report_medico_status, a solicitação ainda não foi tocada pelo time de
    // acompanhamento — os três campos saem em branco, fiéis ao que está no banco, em vez de
    // presumir "SOLICITADO" (a heurística de exibição da tela).
    linha['Status Final'] = statusFinalDe(r.report_medico_status) || null
    linha['Data Protocolo'] = dataCelula(dataProtocoloDe(r.report_medico_status))
    linha['Observações'] = observacoesDe(r.report_medico_status) || null
    return linha
  })

  const worksheet = XLSX.utils.json_to_sheet(linhasPlanilha, { header: CABECALHO, dateNF: 'dd/mm/yyyy' })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Médico')

  const carimbo = formatarDataBR(hojeIso()).replace(/\//g, '-')
  XLSX.writeFile(workbook, `Report Medico - ${carimbo}.xlsx`)

  return { registros: linhas.length }
}
