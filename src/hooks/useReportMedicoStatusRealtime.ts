import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'

type LinhaStatus = Tables<'report_medico_status'>

export type MudancaAcompanhamento = {
  solicitacaoId: string
  /** `null` quando o registro de acompanhamento foi apagado (volta ao estado "não tocado"). */
  extra: Pick<LinhaStatus, 'status_final' | 'data_protocolo' | 'observacoes'> | null
  atualizadoEm: string | null
}

/**
 * Espelha em tempo real as alterações de acompanhamento (Status Final, Data Protocolo,
 * Observações) feitas por qualquer usuário.
 *
 * O callback recebe só a linha que mudou — quem consome mescla essa linha no próprio estado, em
 * vez de refazer a consulta inteira. É isso que faz a tela do admin refletir a edição do
 * representante sem "piscar", sem perder filtros/paginação e sem refresh.
 *
 * Depende da migração `20260825120000_...` (tabela na publicação `supabase_realtime` e
 * REPLICA IDENTITY FULL). Sem ela o canal simplesmente não recebe eventos — a tela continua
 * funcionando, só deixa de atualizar sozinha.
 */
export function useReportMedicoStatusRealtime(aoMudar: (mudanca: MudancaAcompanhamento) => void) {
  // O callback muda a cada render (fecha sobre o estado da página); guardá-lo num ref evita
  // derrubar e reabrir a subscription do websocket a cada render.
  const aoMudarRef = useRef(aoMudar)
  useEffect(() => {
    aoMudarRef.current = aoMudar
  })

  useEffect(() => {
    const canal = supabase
      .channel('report-medico-status-' + Math.random().toString(36).slice(2))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'report_medico_status' },
        (payload) => {
          const novo = payload.new as Partial<LinhaStatus> | null
          const antigo = payload.old as Partial<LinhaStatus> | null

          if (payload.eventType === 'DELETE') {
            if (!antigo?.solicitacao_id) return
            aoMudarRef.current({ solicitacaoId: antigo.solicitacao_id, extra: null, atualizadoEm: null })
            return
          }

          if (!novo?.solicitacao_id) return
          aoMudarRef.current({
            solicitacaoId: novo.solicitacao_id,
            extra: {
              status_final: novo.status_final ?? '',
              data_protocolo: novo.data_protocolo ?? null,
              observacoes: novo.observacoes ?? null,
            },
            atualizadoEm: novo.atualizado_em ?? null,
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [])
}
