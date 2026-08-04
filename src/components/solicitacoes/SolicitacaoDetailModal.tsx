import { Card } from '../ui/Card'
import { StatusBadge } from '../ui/StatusBadge'
import { SolicitacaoDetailContent } from './SolicitacaoDetailContent'
import { useSolicitacaoDetail } from '../../lib/useSolicitacaoDetail'

export function SolicitacaoDetailModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { solicitacao, loading, atualizarExtra } = useSolicitacaoDetail(id)

  if (!id) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-5xl my-8 sm:my-0 flex flex-col max-h-[calc(100vh-4rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10 shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Detalhes da Solicitação</p>
            <h2 className="font-headline font-bold text-xl text-secondary truncate">
              {loading ? 'Carregando…' : (solicitacao?.paciente_nome ?? 'Solicitação não encontrada')}
            </h2>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {solicitacao && <StatusBadge status={solicitacao.situacao ?? '—'} />}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-outline hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-6 min-w-0">
          {loading ? (
            <p className="text-sm text-on-surface-variant">Carregando…</p>
          ) : !solicitacao ? (
            <p className="text-sm text-on-surface-variant">Solicitação não encontrada.</p>
          ) : (
            <SolicitacaoDetailContent
              solicitacao={solicitacao}
              statusExtra={solicitacao.report_medico_status}
              onAtualizarExtra={atualizarExtra}
            />
          )}
        </div>
      </Card>
    </div>
  )
}
