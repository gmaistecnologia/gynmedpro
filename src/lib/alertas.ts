/**
 * Regras de alerta sobre o acompanhamento das solicitações.
 *
 * Hoje há uma só: nenhuma solicitação pode passar de 10 dias no status "PROTOCOLADO". A
 * contagem parte da Data Protocolo (por isso ela é obrigatória para esse status — ver
 * `motivoBloqueioPatch` em `reportMedicoStatus.ts`); em linhas legadas que ainda estão
 * PROTOCOLADO sem data, cai para a data da última alteração do acompanhamento.
 */
import { componentesIso, hojeIso } from './dateUtils'
import { normalizarStatusFinal, type StatusExtra } from './reportMedicoStatus'

export const LIMITE_DIAS_PROTOCOLADO = 10

export type Alerta = {
  /** Dias corridos desde a data de referência. */
  dias: number
  motivo: string
}

/** Dias corridos entre duas datas ISO puras ('YYYY-MM-DD'), sem passar por fuso. */
export function diasEntreIso(deIso: string, ateIso: string): number {
  const de = componentesIso(deIso)
  const ate = componentesIso(ateIso)
  const msPorDia = 24 * 60 * 60 * 1000
  const inicio = new Date(de.ano, de.mes0, de.dia).getTime()
  const fim = new Date(ate.ano, ate.mes0, ate.dia).getTime()
  return Math.round((fim - inicio) / msPorDia)
}

/**
 * Alerta da linha, ou `null` quando está tudo em dia.
 *
 * @param atualizadoEm timestamptz de `report_medico_status.atualizado_em`, usado só como
 * fallback quando a linha é PROTOCOLADO mas não tem Data Protocolo (dado legado).
 */
export function alertaProtocolo(
  extra: Pick<StatusExtra, 'status_final' | 'data_protocolo'> | null | undefined,
  atualizadoEm?: string | null,
  hoje: string = hojeIso(),
): Alerta | null {
  if (!extra || normalizarStatusFinal(extra.status_final) !== 'PROTOCOLADO') return null

  const referencia = extra.data_protocolo ?? (atualizadoEm ? atualizadoEm.slice(0, 10) : null)
  if (!referencia || referencia.length < 10) return null

  const dias = diasEntreIso(referencia, hoje)
  if (dias < LIMITE_DIAS_PROTOCOLADO) return null

  return {
    dias,
    motivo: `Protocolado há ${dias} dias — o limite é ${LIMITE_DIAS_PROTOCOLADO}. Cobre o convênio e atualize o status.`,
  }
}

// Vermelho de erro, forte o bastante para saltar na varredura da tabela sem depender de borda
// 1px (ver design_system.md): fundo tonal + barra lateral.
export const CLASSE_LINHA_ALERTA =
  'bg-error-container/40 hover:bg-error-container/60 border-l-[3px] border-l-error'
