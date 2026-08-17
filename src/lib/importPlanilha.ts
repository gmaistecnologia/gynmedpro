import * as XLSX from 'xlsx'
import type { TablesInsert } from './database.types'

export type CampoTipo = 'texto' | 'numero' | 'data' | 'hora'

export type CampoKey = Exclude<
  keyof TablesInsert<'solicitacoes_importadas'>,
  'id' | 'criado_em' | 'atualizado_em' | 'importado_por' | 'representante_id'
>

export type CampoDestino = {
  key: CampoKey
  label: string
  tipo: CampoTipo
  obrigatorio?: boolean
}

// Espelha, na mesma ordem, as 20 colunas do padrão "RELATORIO TOTAL REPS.xlsx".
export const CAMPOS_DESTINO: CampoDestino[] = [
  { key: 'nro_agendamento', label: 'Nro.Agendamento', tipo: 'texto', obrigatorio: true },
  { key: 'nro_orcamento', label: 'Nro.orcamento', tipo: 'texto', obrigatorio: true },
  { key: 'data_solicitacao', label: 'Data solicitacao', tipo: 'data' },
  { key: 'data_orcamento', label: 'Data orcamento', tipo: 'data' },
  { key: 'data_cirurgia', label: 'Data cirurgia', tipo: 'data' },
  { key: 'hora_cirurgia', label: 'Hora cirurgia', tipo: 'hora' },
  { key: 'data_validade', label: 'Data validade', tipo: 'data' },
  { key: 'data_aprovacao', label: 'Data aprovacao', tipo: 'data' },
  { key: 'data_reprovacao', label: 'Data reprovacao', tipo: 'data' },
  { key: 'hospital_nome', label: 'Nome do hospital', tipo: 'texto' },
  { key: 'hospital_uf', label: 'UF do hospital', tipo: 'texto' },
  { key: 'descricao_grupo', label: 'Descricao do grupo', tipo: 'texto' },
  { key: 'descricao_tipo', label: 'Descricao do tipo', tipo: 'texto' },
  { key: 'representante_nome', label: 'Nome do representante', tipo: 'texto' },
  { key: 'medico_nome', label: 'Nome do medico', tipo: 'texto' },
  { key: 'plano_saude_nome', label: 'Nome do plano de saude', tipo: 'texto' },
  { key: 'paciente_nome', label: 'Paciente', tipo: 'texto' },
  { key: 'valor_orcamento', label: 'Valor do orçamento', tipo: 'numero' },
  { key: 'situacao', label: 'Situacao', tipo: 'texto' },
  { key: 'valor_realizado', label: 'Valor realizado', tipo: 'numero' },
]

// Linhas sem Nro.orcamento vêm da planilha com um valor de exportação malformado nesta
// coluna (ex.: "60-Real.Com C- V=     17.736 e") em vez de um status real. Qualquer valor
// fora deste conjunto conhecido é normalizado para "Cirurgia realizada".
const SITUACOES_CONHECIDAS = new Set(['Faturado', 'Aprovado', 'Vencido', 'A vencer', 'Reprovado'])
const SITUACAO_PADRAO_DESCONHECIDA = 'Cirurgia realizada'

export type MapeamentoColunas = Partial<Record<CampoKey, number>>

export type PlanilhaParseResult = {
  headers: string[]
  rows: unknown[][]
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export async function parseArquivoPlanilha(file: File): Promise<PlanilhaParseResult> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const linhas = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: null })
  const [linhaCabecalho, ...linhasDados] = linhas
  const headers = (linhaCabecalho ?? []).map((h) => (h == null ? '' : String(h).trim()))
  const rows = linhasDados.filter((row) => row.some((cell) => cell !== null && cell !== ''))
  return { headers, rows }
}

export function autoMapearColunas(headers: string[]): MapeamentoColunas {
  const normalizados = headers.map(normalizar)
  const mapeamento: MapeamentoColunas = {}
  for (const campo of CAMPOS_DESTINO) {
    const alvo = normalizar(campo.label)
    const idx = normalizados.findIndex((h) => h === alvo)
    if (idx !== -1) mapeamento[campo.key] = idx
  }
  return mapeamento
}

const EXCEL_EPOCH_OFFSET_DAYS = 25569

function excelSerialParaData(serial: number): Date {
  const utcDays = Math.floor(serial - EXCEL_EPOCH_OFFSET_DAYS)
  return new Date(utcDays * 86400 * 1000)
}

function formatarDataISO(data: Date): string {
  const ano = data.getUTCFullYear()
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0')
  const dia = String(data.getUTCDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function formatarHoraISO(data: Date): string {
  const h = String(data.getUTCHours()).padStart(2, '0')
  const m = String(data.getUTCMinutes()).padStart(2, '0')
  const s = String(data.getUTCSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export function converterValor(raw: unknown, tipo: CampoTipo): string | number | null {
  if (raw === null || raw === undefined || raw === '') return null

  switch (tipo) {
    case 'texto':
      return String(raw).trim() || null

    case 'numero': {
      if (typeof raw === 'number') return raw
      const num = Number(String(raw).trim().replace(/\./g, '').replace(',', '.'))
      return Number.isFinite(num) ? num : null
    }

    case 'data': {
      if (raw instanceof Date) return formatarDataISO(raw)
      if (typeof raw === 'number') return formatarDataISO(excelSerialParaData(raw))
      const parsed = new Date(String(raw))
      return Number.isNaN(parsed.getTime()) ? null : formatarDataISO(parsed)
    }

    case 'hora': {
      if (raw instanceof Date) return formatarHoraISO(raw)
      if (typeof raw === 'number') {
        const totalSegundos = Math.round(raw * 86400)
        const h = String(Math.floor(totalSegundos / 3600) % 24).padStart(2, '0')
        const m = String(Math.floor(totalSegundos / 60) % 60).padStart(2, '0')
        const s = String(totalSegundos % 60).padStart(2, '0')
        return `${h}:${m}:${s}`
      }
      const texto = String(raw).trim()
      return /^\d{1,2}:\d{2}(:\d{2})?$/.test(texto) ? texto : null
    }
  }
}

export type RegistroImportado = Partial<Record<CampoKey, string | number | null>>

export function construirRegistro(row: unknown[], mapeamento: MapeamentoColunas): RegistroImportado | null {
  const valores: Record<string, string | number | null> = {}
  for (const campo of CAMPOS_DESTINO) {
    const idx = mapeamento[campo.key]
    const raw = idx === undefined ? undefined : row[idx]
    valores[campo.key] = converterValor(raw, campo.tipo)
  }

  // Sem nenhuma das duas chaves possíveis, a linha não pode ser identificada nem
  // sobrescrita depois — é descartada (nem inserida). Ao importar: se Nro.orcamento
  // estiver vazio mas Nro.Agendamento existir, essa é usada como chave de atualização.
  if (!valores.nro_agendamento && !valores.nro_orcamento) return null

  if (typeof valores.situacao === 'string' && !SITUACOES_CONHECIDAS.has(valores.situacao)) {
    valores.situacao = SITUACAO_PADRAO_DESCONHECIDA
  }

  return valores as RegistroImportado
}
