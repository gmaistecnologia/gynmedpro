import { useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { SolicitacaoCirurgica } from '../lib/types'

export function useSolicitacoesRealtime() {
  const { profile } = useAuth()

  useEffect(() => {
    if (!profile || profile.role !== 'representante') return

    const channel = supabase
      .channel('solicitacoes-status-' + profile.id)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'solicitacoes_cirurgicas',
          filter: `representante_id=eq.${profile.id}`,
        },
        (payload) => {
          const novo = payload.new as SolicitacaoCirurgica
          const antigo = payload.old as SolicitacaoCirurgica

          if (novo.status === antigo.status) return

          if (novo.status === 'aprovado_gerente') {
            toast.success(`Cirurgia de ${novo.paciente_nome} foi aprovada pelo comercial!`)
          } else if (novo.status === 'recusado') {
            toast.error(`Cirurgia de ${novo.paciente_nome} foi recusada.`, {
              description: novo.motivo_recusa ?? undefined,
            })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile])
}
