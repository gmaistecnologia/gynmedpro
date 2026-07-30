import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import type { SolicitacaoComRelacoes } from '../lib/types'

export function AprovacoesPage() {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoComRelacoes[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [recusando, setRecusando] = useState<SolicitacaoComRelacoes | null>(null)
  const [motivo, setMotivo] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('solicitacoes_cirurgicas')
      .select('*, hospitais(id, nome_fantasia, cidade, uf), profiles(id, nome), itens_solicitados(*, produtos(*))')
      .eq('status', 'enviado')
      .order('data_cirurgia', { ascending: true })
    setSolicitacoes((data as SolicitacaoComRelacoes[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function aprovar(s: SolicitacaoComRelacoes) {
    setBusyId(s.id)
    const { error } = await supabase
      .from('solicitacoes_cirurgicas')
      .update({ status: 'aprovado_gerente' })
      .eq('id', s.id)
    setBusyId(null)
    if (error) {
      toast.error('Não foi possível aprovar a solicitação.')
      return
    }
    toast.success(`Solicitação de ${s.paciente_nome} aprovada.`)
    setSolicitacoes((prev) => prev.filter((item) => item.id !== s.id))
  }

  async function confirmarRecusa() {
    if (!recusando) return
    setBusyId(recusando.id)
    const { error } = await supabase
      .from('solicitacoes_cirurgicas')
      .update({ status: 'recusado', motivo_recusa: motivo.trim() || null })
      .eq('id', recusando.id)
    setBusyId(null)
    if (error) {
      toast.error('Não foi possível recusar a solicitação.')
      return
    }
    toast.success(`Solicitação de ${recusando.paciente_nome} recusada.`)
    setSolicitacoes((prev) => prev.filter((item) => item.id !== recusando.id))
    setRecusando(null)
    setMotivo('')
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline font-bold text-3xl text-secondary tracking-tight">Painel de Aprovações</h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          Solicitações aguardando sua decisão antes do faturamento.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-on-surface-variant">Carregando…</p>
      ) : solicitacoes.length === 0 ? (
        <Card className="p-10 text-center">
          <span className="material-symbols-outlined text-4xl text-tertiary-container mb-2">task_alt</span>
          <p className="text-sm text-on-surface-variant">Nenhuma solicitação pendente de aprovação.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {solicitacoes.map((s) => (
            <Card key={s.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="min-w-0 flex-1 flex flex-col gap-1">
                <Link to={`/solicitacoes/${s.id}`} className="font-headline font-bold text-base text-secondary hover:underline w-fit truncate max-w-full">
                  {s.paciente_nome}
                </Link>
                <p className="text-sm text-on-surface-variant truncate">
                  {s.medico_cirurgiao} · {s.hospitais?.nome_fantasia}
                </p>
                <p className="text-xs text-on-surface-variant truncate">
                  {s.data_cirurgia ? format(new Date(s.data_cirurgia), "dd/MM/yyyy 'às' HH:mm") : 'Data a definir'} ·
                  Representante: {s.profiles?.nome} · {s.itens_solicitados.length}{' '}
                  {s.itens_solicitados.length === 1 ? 'item' : 'itens'}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Button
                  variant="danger"
                  disabled={busyId === s.id}
                  onClick={() => {
                    setRecusando(s)
                    setMotivo('')
                  }}
                >
                  Recusar
                </Button>
                <Button isLoading={busyId === s.id} disabled={busyId !== null} onClick={() => aprovar(s)}>
                  Aprovar
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {recusando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-6">
          <Card className="w-full max-w-md p-6 flex flex-col gap-4">
            <h2 className="font-headline font-bold text-lg text-secondary">
              Recusar solicitação de {recusando.paciente_nome}
            </h2>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Motivo da recusa</label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                placeholder="Explique o motivo para o representante…"
                className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm p-4 focus:ring-2 focus:ring-primary/10 focus:border-primary"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setRecusando(null)} disabled={busyId !== null}>
                Cancelar
              </Button>
              <Button variant="danger" isLoading={busyId === recusando.id} onClick={confirmarRecusa}>
                Confirmar Recusa
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
