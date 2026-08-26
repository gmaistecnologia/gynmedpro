import { supabase } from './supabase'
import { formatarDataBR } from './dateUtils'
import type { Tables } from './database.types'

export type AtividadeLog = Tables<'atividades_log'>

export type TipoAtividade = 'status_final' | 'data_protocolo' | 'observacoes' | 'login'

export const TIPOS_ATIVIDADE: { value: TipoAtividade; label: string; icon: string }[] = [
  { value: 'status_final', label: 'Mudança de status', icon: 'flag' },
  { value: 'data_protocolo', label: 'Data de protocolo', icon: 'event' },
  { value: 'observacoes', label: 'Observação', icon: 'sticky_note_2' },
  { value: 'login', label: 'Login', icon: 'login' },
]

const META_POR_TIPO: Record<string, { label: string; icon: string }> = Object.fromEntries(
  TIPOS_ATIVIDADE.map((t) => [t.value, { label: t.label, icon: t.icon }]),
)

export function metaDoTipo(tipo: string): { label: string; icon: string } {
  return META_POR_TIPO[tipo] ?? { label: tipo, icon: 'history' }
}

/**
 * Registra o login do usuário atual (carimba `profiles.ultimo_login` e grava uma linha no log).
 * A função no banco ignora logins repetidos dentro de 5 minutos, então pode ser chamada sempre
 * que uma sessão é (re)estabelecida sem inflar a auditoria.
 */
export async function registrarLogin(): Promise<void> {
  const { error } = await supabase.rpc('registrar_login')
  // Falha aqui não pode atrapalhar o login em si — só o registro de auditoria fica sem a linha.
  if (error) console.warn('Não foi possível registrar o login:', error.message)
}

/** Texto legível para os valores antes/depois, que no banco são todos `text`. */
export function formatarValorAtividade(tipo: string, valor: string | null): string {
  if (valor == null || valor === '') return '—'
  if (tipo === 'data_protocolo') return formatarDataBR(valor.slice(0, 10)) || valor
  if (tipo === 'login') return formatarDataHoraBR(valor)
  return valor
}

/** timestamptz → 'DD/MM/AAAA às HH:MM' no fuso do navegador. */
export function formatarDataHoraBR(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "há 3 min" / "há 2 h" / "há 5 d" — resumo curto usado nas listas. */
export function tempoRelativo(iso: string | null | undefined): string {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(ms)) return ''
  const minutos = Math.floor(ms / 60000)
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.floor(horas / 24)
  return `há ${dias} d`
}
