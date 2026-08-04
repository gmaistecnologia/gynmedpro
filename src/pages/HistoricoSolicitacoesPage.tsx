import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/StatusBadge'
import { MultiSelectField } from '../components/ui/MultiSelectField'
import { SolicitacaoDetailModal } from '../components/solicitacoes/SolicitacaoDetailModal'
import { StatusFinalEditavel } from '../components/relatorios/StatusFinalEditavel'
import { ProtocoloDateInput, ObservacaoInputCompacto } from '../components/relatorios/CamposAcompanhamentoEditaveis'
import {
  salvarReportMedicoStatus,
  statusFinalDe,
  dataProtocoloDe,
  observacoesDe,
  statusIconeClasse,
  type StatusExtra,
} from '../lib/reportMedicoStatus'
import type { SolicitacaoImportada } from '../lib/types'

// Mesma paleta da coluna "Status Final" (statusIconeClasse), para que valores iguais ou
// equivalentes das duas colunas (ex.: "Cirurgia realizada") fiquem sempre com a mesma cor.
const STATUS_OPCOES = [
  { value: 'Faturado', label: 'Faturado', icon: 'receipt_long', iconClassName: statusIconeClasse('Faturado') },
  { value: 'Aprovado', label: 'Aprovado', icon: 'verified', iconClassName: statusIconeClasse('Aprovado') },
  {
    value: 'Cirurgia realizada',
    label: 'Cirurgia realizada',
    icon: 'health_and_safety',
    iconClassName: statusIconeClasse('Cirurgia realizada'),
  },
  { value: 'A vencer', label: 'A vencer', icon: 'schedule', iconClassName: statusIconeClasse('A vencer') },
  { value: 'Vencido', label: 'Vencido', icon: 'event_busy', iconClassName: statusIconeClasse('Vencido') },
]

type Linha = SolicitacaoImportada & { report_medico_status: StatusExtra | null }

// data_cirurgia é um `date` puro ('YYYY-MM-DD'); formatar via new Date(...) sofre
// deslocamento de fuso (vira o dia anterior em UTC-3). Formatação direta na string evita isso.
function formatarDataBR(dataIso: string | null): string {
  if (!dataIso) return '—'
  const [ano, mes, dia] = dataIso.split('-')
  return `${dia}/${mes}/${ano}`
}

export function HistoricoSolicitacoesPage() {
  const { profile } = useAuth()
  const [solicitacoes, setSolicitacoes] = useState<Linha[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null)

  const isGestor = profile?.role === 'gerente_comercial' || profile?.role === 'admin'

  function carregar() {
    return supabase
      .from('solicitacoes_importadas')
      .select('*, report_medico_status(status_final, data_protocolo, observacoes)')
      .order('data_cirurgia', { ascending: false })
      .then(({ data }) => {
        setSolicitacoes((data as unknown as Linha[]) ?? [])
        setLoading(false)
      })
  }

  useEffect(() => {
    carregar()
  }, [])

  function fecharModal() {
    setSelecionadaId(null)
    // Reflete inline na tabela qualquer alteração feita no modal (Status Final, Protocolo, Observações).
    carregar()
  }

  const filtradas = useMemo(() => {
    return solicitacoes.filter((s) => {
      if (statusFilter.length > 0 && !statusFilter.includes(s.situacao ?? '')) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          (s.paciente_nome ?? '').toLowerCase().includes(q) || (s.medico_nome ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [solicitacoes, search, statusFilter])

  async function atualizarExtra(solicitacaoId: string, patch: Partial<StatusExtra>) {
    const anterior = solicitacoes
    setSolicitacoes((prev) =>
      prev.map((s) =>
        s.id === solicitacaoId
          ? {
              ...s,
              report_medico_status: {
                status_final: statusFinalDe(s.report_medico_status),
                data_protocolo: dataProtocoloDe(s.report_medico_status),
                observacoes: observacoesDe(s.report_medico_status),
                ...s.report_medico_status,
                ...patch,
              },
            }
          : s,
      ),
    )
    const { error } = await salvarReportMedicoStatus(solicitacaoId, patch)
    if (error) {
      setSolicitacoes(anterior)
      toast.error('Não foi possível salvar a alteração. Tente novamente.')
    } else {
      toast.success('Registro atualizado.')
    }
  }

  const colunas = isGestor ? 9 : 8

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <header className="lg:shrink-0">
          <h1 className="font-headline font-bold text-3xl text-secondary tracking-tight">
            {isGestor ? 'Solicitações' : 'Meu Histórico'}
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            {isGestor
              ? 'Todas as solicitações importadas do time comercial.'
              : 'Acompanhe o status de tudo o que já foi importado em seu nome.'}
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3 lg:shrink-0">
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar paciente ou médico…"
              className="w-full h-[46px] pl-10 pr-4 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary"
            />
          </div>
          <div className="w-full sm:w-56">
            <MultiSelectField
              options={STATUS_OPCOES}
              selected={statusFilter}
              onChange={setStatusFilter}
              placeholder="Todos os status"
              searchPlaceholder="Buscar status…"
            />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="sticky top-0 z-10 bg-surface-container-low px-4 py-3 font-headline font-bold text-[11px] text-on-surface-variant uppercase tracking-widest">
                  Paciente
                </th>
                <th className="sticky top-0 z-10 bg-surface-container-low px-4 py-3 font-headline font-bold text-[11px] text-on-surface-variant uppercase tracking-widest">
                  Situação
                </th>
                {isGestor && (
                  <th className="sticky top-0 z-10 bg-surface-container-low px-4 py-3 font-headline font-bold text-[11px] text-on-surface-variant uppercase tracking-widest">
                    Representante
                  </th>
                )}
                <th className="sticky top-0 z-10 bg-surface-container-low px-4 py-3 font-headline font-bold text-[11px] text-on-surface-variant uppercase tracking-widest">
                  Médico
                </th>
                <th className="sticky top-0 z-10 bg-surface-container-low px-4 py-3 font-headline font-bold text-[11px] text-on-surface-variant uppercase tracking-widest">
                  Hospital
                </th>
                <th className="sticky top-0 z-10 bg-surface-container-low px-4 py-3 font-headline font-bold text-[11px] text-on-surface-variant uppercase tracking-widest">
                  Data Cirurgia
                </th>
                <th className="sticky top-0 z-10 bg-surface-container-low px-4 py-3 font-headline font-bold text-[11px] text-on-surface-variant uppercase tracking-widest">
                  Status Final
                </th>
                <th className="sticky top-0 z-10 bg-surface-container-low px-4 py-3 font-headline font-bold text-[11px] text-on-surface-variant uppercase tracking-widest">
                  Protocolo
                </th>
                <th className="sticky top-0 z-10 bg-surface-container-low px-4 py-3 font-headline font-bold text-[11px] text-on-surface-variant uppercase tracking-widest">
                  Observações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {loading ? (
                <tr>
                  <td colSpan={colunas} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                    Carregando…
                  </td>
                </tr>
              ) : filtradas.length === 0 ? (
                <tr>
                  <td colSpan={colunas} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                    Nenhuma solicitação encontrada.
                  </td>
                </tr>
              ) : (
                filtradas.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-container-high/40 transition-colors group">
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => setSelecionadaId(s.id)}
                        className="font-semibold text-xs text-secondary group-hover:underline text-left truncate max-w-[180px]"
                      >
                        {s.paciente_nome ?? '—'}
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={s.situacao ?? '—'} />
                    </td>
                    {isGestor && (
                      <td className="px-4 py-2.5 text-xs text-on-surface-variant truncate max-w-[160px]">
                        {s.representante_nome ?? '—'}
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-xs text-on-surface-variant truncate max-w-[160px]">
                      {s.medico_nome ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-on-surface-variant truncate max-w-[140px]">
                      {s.hospital_nome ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-on-surface-variant whitespace-nowrap">
                      {s.data_cirurgia ? formatarDataBR(s.data_cirurgia) : 'A definir'}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusFinalEditavel
                        status={statusFinalDe(s.report_medico_status)}
                        onChange={(novoStatus) => atualizarExtra(s.id, { status_final: novoStatus })}
                      />
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <ProtocoloDateInput
                        compact
                        valor={dataProtocoloDe(s.report_medico_status)}
                        onCommit={(novoValor) => atualizarExtra(s.id, { data_protocolo: novoValor || null })}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <ObservacaoInputCompacto
                        valor={observacoesDe(s.report_medico_status)}
                        onCommit={(novoValor) => atualizarExtra(s.id, { observacoes: novoValor || null })}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <SolicitacaoDetailModal id={selecionadaId} onClose={fecharModal} />
    </div>
  )
}
