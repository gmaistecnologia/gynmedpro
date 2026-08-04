/**
 * Utilidades de data para os date pickers do sistema.
 *
 * Os campos `date` do banco trafegam como string pura 'YYYY-MM-DD'. Fazer
 * `new Date(iso)` sobre essa string faz o motor interpretá-la como UTC
 * meia-noite, o que desloca o dia em fusos negativos (vira o dia anterior em
 * UTC-3) — o mesmo problema já documentado em outros pontos do código
 * (HistoricoSolicitacoesPage, SolicitacaoDetailContent, SolicitacaoTimeline).
 * Por isso toda a matemática de calendário aqui usa `new Date(ano, mes0, dia)`
 * (construtor local, sem parsing de string) e nunca `new Date(isoString)`.
 */

export const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Monta 'YYYY-MM-DD' a partir de componentes locais. */
export function paraIso(ano: number, mes0: number, dia: number): string {
  return `${ano}-${pad2(mes0 + 1)}-${pad2(dia)}`
}

/** Componentes {ano, mes0, dia} de uma data ISO pura — nunca passa por Date/UTC. */
export function componentesIso(iso: string): { ano: number; mes0: number; dia: number } {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return { ano, mes0: mes - 1, dia }
}

export function hojeIso(): string {
  const agora = new Date()
  return paraIso(agora.getFullYear(), agora.getMonth(), agora.getDate())
}

export function formatarDataBR(iso: string | null | undefined): string {
  if (!iso || iso.length < 10) return ''
  const { ano, mes0, dia } = componentesIso(iso)
  return `${pad2(dia)}/${pad2(mes0 + 1)}/${ano}`
}

export function adicionarDiasIso(iso: string, dias: number): string {
  const { ano, mes0, dia } = componentesIso(iso)
  const d = new Date(ano, mes0, dia + dias)
  return paraIso(d.getFullYear(), d.getMonth(), d.getDate())
}

export type DiaGrade = {
  iso: string
  dia: number
  /** true quando o dia pertence ao mês exibido (não é preenchimento do mês vizinho). */
  noMes: boolean
}

/** Grade de 42 dias (6 semanas), começando na segunda-feira, para `mes0` (0-indexado) de `ano`. */
export function gradeDoMes(ano: number, mes0: number): DiaGrade[] {
  const primeiroDiaSemana = (new Date(ano, mes0, 1).getDay() + 6) % 7 // 0 = segunda
  const diasNoMes = new Date(ano, mes0 + 1, 0).getDate()
  const diasMesAnterior = new Date(ano, mes0, 0).getDate()

  const grade: DiaGrade[] = []

  for (let i = primeiroDiaSemana; i > 0; i--) {
    const dia = diasMesAnterior - i + 1
    const d = new Date(ano, mes0 - 1, dia)
    grade.push({ iso: paraIso(d.getFullYear(), d.getMonth(), d.getDate()), dia, noMes: false })
  }
  for (let dia = 1; dia <= diasNoMes; dia++) {
    grade.push({ iso: paraIso(ano, mes0, dia), dia, noMes: true })
  }
  let diaProximo = 1
  while (grade.length < 42) {
    const d = new Date(ano, mes0 + 1, diaProximo)
    grade.push({ iso: paraIso(d.getFullYear(), d.getMonth(), d.getDate()), dia: diaProximo, noMes: false })
    diaProximo++
  }

  return grade
}

/** Soma (ou subtrai) meses a um par {ano, mes0}, normalizando o ano. */
export function deslocarMes(ano: number, mes0: number, delta: number): { ano: number; mes0: number } {
  const total = ano * 12 + mes0 + delta
  return { ano: Math.floor(total / 12), mes0: ((total % 12) + 12) % 12 }
}
