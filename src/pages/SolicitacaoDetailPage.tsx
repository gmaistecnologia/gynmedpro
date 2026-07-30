import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/StatusBadge'
import type { SolicitacaoComRelacoes } from '../lib/types'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold text-outline uppercase tracking-wide">{label}</label>
      <span className="text-sm font-semibold text-on-surface">{value}</span>
    </div>
  )
}

async function abrirAnexo(storagePath: string, nomeArquivo: string) {
  const { data, error } = await supabase.storage.from('anexos-solicitacoes').createSignedUrl(storagePath, 60)
  if (error || !data) {
    toast.error(`Não foi possível abrir "${nomeArquivo}".`)
    return
  }
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
}

export function SolicitacaoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [solicitacao, setSolicitacao] = useState<SolicitacaoComRelacoes | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase
      .from('solicitacoes_cirurgicas')
      .select(
        '*, hospitais(id, nome_fantasia, cidade, uf), profiles(id, nome), planos_saude(id, nome), tipos_cirurgia(id, nome), itens_solicitados(*, produtos(*)), anexos_solicitacoes(*)',
      )
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setSolicitacao(data as SolicitacaoComRelacoes)
        setLoading(false)
      })
  }, [id])

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
            {solicitacao.paciente_nome}
          </h1>
        </div>
        <StatusBadge status={solicitacao.status} />
      </div>

      {solicitacao.status === 'recusado' && solicitacao.motivo_recusa && (
        <Card className="p-5 bg-error-container/60 border-none">
          <p className="text-xs font-bold text-on-error-container uppercase tracking-wide mb-1">Motivo da recusa</p>
          <p className="text-sm text-on-error-container">{solicitacao.motivo_recusa}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">info</span>
            </div>
            <h2 className="font-headline font-bold text-secondary text-base">Informações Gerais</h2>
          </div>
          <div className="space-y-4">
            <Field label="Hospital" value={solicitacao.hospitais?.nome_fantasia ?? '—'} />
            <Field
              label="Data da cirurgia"
              value={
                solicitacao.data_cirurgia
                  ? format(new Date(solicitacao.data_cirurgia), "dd/MM/yyyy 'às' HH:mm")
                  : 'A definir'
              }
            />
            <Field label="Tipo de cirurgia" value={solicitacao.tipos_cirurgia?.nome ?? '—'} />
            <Field label="Representante" value={solicitacao.profiles?.nome ?? '—'} />
            <Field label="Criado em" value={format(new Date(solicitacao.criado_em), 'dd/MM/yyyy HH:mm')} />
          </div>
        </Card>

        <Card className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">patient_list</span>
            </div>
            <h2 className="font-headline font-bold text-secondary text-base">Paciente & Médico</h2>
          </div>
          <div className="space-y-4">
            <Field label="Paciente" value={solicitacao.paciente_nome} />
            <Field label="Médico cirurgião" value={solicitacao.medico_cirurgiao} />
            <Field label="Plano de saúde" value={solicitacao.planos_saude?.nome ?? '—'} />
          </div>
        </Card>

        <Card className="p-6 flex flex-col gap-4 md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary-container/30 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            </div>
            <h2 className="font-headline font-bold text-secondary text-base">Materiais Estimados</h2>
          </div>
          {solicitacao.itens_solicitados.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Nenhum item adicionado.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {solicitacao.itens_solicitados.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 bg-surface-container-low rounded-lg px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-on-surface truncate">{item.produtos?.nome}</p>
                    <p className="text-xs text-on-surface-variant truncate">TUSS {item.produtos?.codigo_tuss ?? '—'}</p>
                  </div>
                  <span className="text-sm font-bold text-secondary shrink-0">x{item.quantidade_estimada}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {(solicitacao.observacoes || solicitacao.anexos_solicitacoes.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {solicitacao.observacoes && (
            <Card className="p-6 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">notes</span>
                </div>
                <h2 className="font-headline font-bold text-secondary text-base">Observações</h2>
              </div>
              <p className="text-sm text-on-surface whitespace-pre-wrap">{solicitacao.observacoes}</p>
            </Card>
          )}

          {solicitacao.anexos_solicitacoes.length > 0 && (
            <Card className="p-6 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">attach_file</span>
                </div>
                <h2 className="font-headline font-bold text-secondary text-base">Documentos Anexados</h2>
              </div>
              <ul className="flex flex-col gap-2">
                {solicitacao.anexos_solicitacoes.map((anexo) => (
                  <li key={anexo.id}>
                    <button
                      type="button"
                      onClick={() => abrirAnexo(anexo.storage_path, anexo.nome_arquivo)}
                      className="w-full flex items-center gap-3 bg-surface-container-low rounded-lg px-4 py-2.5 hover:bg-surface-container-high/60 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-outline text-lg shrink-0">description</span>
                      <span className="text-sm text-on-surface truncate min-w-0 flex-1">{anexo.nome_arquivo}</span>
                      <span className="material-symbols-outlined text-primary text-lg shrink-0">download</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
