import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from './supabase'
import { salvarReportMedicoStatus, type StatusExtra } from './reportMedicoStatus'
import type { SolicitacaoImportada } from './types'

type SolicitacaoComExtra = SolicitacaoImportada & { report_medico_status: StatusExtra | null }

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
      .select('*, report_medico_status(status_final, data_protocolo, observacoes)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setSolicitacao((data as unknown as SolicitacaoComExtra) ?? null)
        setLoading(false)
      })
  }, [id])

  async function atualizarExtra(patch: Partial<StatusExtra>) {
    if (!id || !solicitacao) return
    const anterior = solicitacao
    setSolicitacao({
      ...solicitacao,
      report_medico_status: {
        status_final: solicitacao.report_medico_status?.status_final ?? 'SOLICITADO',
        data_protocolo: solicitacao.report_medico_status?.data_protocolo ?? null,
        observacoes: solicitacao.report_medico_status?.observacoes ?? null,
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
