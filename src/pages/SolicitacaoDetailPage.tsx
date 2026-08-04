import { Link, useParams } from 'react-router-dom'
import { StatusBadge } from '../components/ui/StatusBadge'
import { SolicitacaoDetailContent } from '../components/solicitacoes/SolicitacaoDetailContent'
import { useSolicitacaoDetail } from '../lib/useSolicitacaoDetail'

export function SolicitacaoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { solicitacao, loading, atualizarExtra } = useSolicitacaoDetail(id)

  if (loading) {
    return <p className="text-sm text-on-surface-variant">Carregando…</p>
  }

  if (!solicitacao) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-on-surface-variant">Solicitação não encontrada.</p>
        <Link to="/solicitacoes" className="text-sm font-semibold text-primary-container hover:underline w-fit">
          Voltar ao histórico
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-xs text-outline mb-2 font-medium uppercase tracking-wider">
            <Link to="/solicitacoes" className="hover:text-primary transition-colors">
              Solicitações
            </Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span>Detalhes</span>
          </nav>
          <h1 className="font-headline font-bold text-3xl text-secondary tracking-tight">
            {solicitacao.paciente_nome ?? '—'}
          </h1>
        </div>
        <StatusBadge status={solicitacao.situacao ?? '—'} />
      </div>

      <SolicitacaoDetailContent
        solicitacao={solicitacao}
        statusExtra={solicitacao.report_medico_status}
        onAtualizarExtra={atualizarExtra}
      />
    </div>
  )
}
