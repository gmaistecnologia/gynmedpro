import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from './supabase'
import {
  salvarReportMedicoStatus,
  statusFinalDe,
  dataProtocoloDe,
  observacoesDe,
  motivoBloqueioPatch,
  type StatusExtra,
} from './reportMedicoStatus'
import { useReportMedicoStatusRealtime } from '../hooks/useReportMedicoStatusRealtime'
import type { SolicitacaoImportada } from './types'

type StatusExtraComData = StatusExtra & { atualizado_em: string | null }

type SolicitacaoComExtra = SolicitacaoImportada & { report_medico_status: StatusExtraComData | null }

const SELECT_COM_STATUS = '*, report_medico_status(status_final, data_protocolo, observacoes, atualizado_em)'

export function useSolicitacaoDetail(id: string | null | undefined) {
  const [solicitacao, setSolicitacao] = useState<SolicitacaoComExtra | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setSolicitacao(null)
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('solicitacoes_importadas')
      .select(SELECT_COM_STATUS)
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setSolicitacao((data as unknown as SolicitacaoComExtra) ?? null)
        setLoading(false)
      })
  }, [id])

  // Se outra pessoa mexer nesta mesma solicitação enquanto ela está aberta, os campos se
  // atualizam sozinhos em vez de a tela ficar mostrando um estado que já não é o do banco.
  useReportMedicoStatusRealtime(({ solicitacaoId, extra, atualizadoEm }) => {
    if (!id || solicitacaoId !== id) return
    setSolicitacao((atual) =>
      atual ? { ...atual, report_medico_status: extra ? { ...extra, atualizado_em: atualizadoEm } : null } : atual,
    )
  })

  async function atualizarExtra(patch: Partial<StatusExtra>) {
    if (!id || !solicitacao) return

    const bloqueio = motivoBloqueioPatch(patch, solicitacao.report_medico_status)
    if (bloqueio) {
      toast.warning(bloqueio)
      return
    }

    const anterior = solicitacao
    setSolicitacao({
      ...solicitacao,
      report_medico_status: {
        status_final: statusFinalDe(solicitacao.report_medico_status),
        data_protocolo: dataProtocoloDe(solicitacao.report_medico_status),
        observacoes: observacoesDe(solicitacao.report_medico_status),
        atualizado_em: null,
        ...solicitacao.report_medico_status,
        ...patch,
      },
    })
    const { error } = await salvarReportMedicoStatus(id, patch)
    if (error) {
      setSolicitacao(anterior)
      toast.error('Não foi possível salvar a alteração. Tente novamente.')
    } else {
      toast.success('Registro atualizado.')
    }
  }

  return { solicitacao, loading, atualizarExtra }
}
