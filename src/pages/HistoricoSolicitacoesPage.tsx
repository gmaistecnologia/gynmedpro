import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/StatusBadge'
import { UsuarioInativoBadge } from '../components/ui/UsuarioInativoBadge'
import { MultiSelectField } from '../components/ui/MultiSelectField'
import { useProfilesDirectory } from '../hooks/useProfilesDirectory'
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

// A tabela tem mais de 10 mil solicitações — buscar/renderizar tudo de uma vez deixava a tela
// lenta e travava a navegação. A partir daqui, busca, filtro de status e paginação acontecem no
// próprio Supabase: cada página busca só os 100 registros que vai exibir.
const TAMANHO_PAGINA = 100

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
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [buscaInput, setBuscaInput] = useState('')
  const [busca, setBusca] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [pagina, setPagina] = useState(1)
  const [paginaInput, setPaginaInput] = useState('1')
  const [refreshTick, setRefreshTick] = useState(0)
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null)

  const isGestor = profile?.role === 'gerente_comercial' || profile?.role === 'admin'
  const { porNome: perfisPorNome } = useProfilesDirectory()

  // Debounce da busca por texto — evita 1 request por tecla digitada.
  useEffect(() => {
    const timeout = setTimeout(() => setBusca(buscaInput.trim()), 300)
    return () => clearTimeout(timeout)
  }, [buscaInput])

  // Sempre que a busca ou o filtro de status mudam, volta pra primeira página. Comparação em
  // tempo de render (em vez de um efeito reagindo a [busca, statusFilter]) segue o padrão do
  // próprio React para "resetar estado quando outro estado muda", sem o re-render em cascata de
  // um setState síncrono dentro de efeito.
  const [filtrosAnteriores, setFiltrosAnteriores] = useState({ busca, statusFilter })
  if (filtrosAnteriores.busca !== busca || filtrosAnteriores.statusFilter !== statusFilter) {
    setFiltrosAnteriores({ busca, statusFilter })
    setPagina(1)
  }

  // Mantém o campo "Ir para página" sincronizado quando a página muda por outro caminho
  // (botões anterior/próxima), sem sobrescrever o que o usuário estiver digitando nele.
  const [paginaSincronizada, setPaginaSincronizada] = useState(pagina)
  if (paginaSincronizada !== pagina) {
    setPaginaSincronizada(pagina)
    setPaginaInput(String(pagina))
  }

  useEffect(() => {
    let cancelado = false
    setLoading(true)

    // Filtros primeiro, paginação/ordenação por último — depois de `.order()`/`.range()` o
    // builder do supabase-js não aceita mais `.or()`/`.in()`.
    let query = supabase
      .from('solicitacoes_importadas')
      .select('*, report_medico_status(status_final, data_protocolo, observacoes)', { count: 'exact' })

    if (busca) query = query.or(`paciente_nome.ilike.%${busca}%,medico_nome.ilike.%${busca}%`)
    if (statusFilter.length > 0) query = query.in('situacao', statusFilter)

    // data_cirurgia se repete (ou é nula) em muitas linhas; sem um desempate único (`id`), a
    // paginação por `.range()` pode pular ou duplicar registros entre páginas.
    query
      .order('data_cirurgia', { ascending: false })
      .order('id', { ascending: true })
      .range((pagina - 1) * TAMANHO_PAGINA, pagina * TAMANHO_PAGINA - 1)
      .then(({ data, error, count }) => {
        if (cancelado) return
        if (error) {
          toast.error('Não foi possível carregar as solicitações.')
        } else {
          setSolicitacoes((data as unknown as Linha[]) ?? [])
          setTotalCount(count ?? 0)
        }
        setLoading(false)
      })

    return () => {
      cancelado = true
    }
  }, [pagina, busca, statusFilter, refreshTick])

  function fecharModal() {
    setSelecionadaId(null)
    // Reflete inline na tabela qualquer alteração feita no modal (Status Final, Protocolo, Observações).
    setRefreshTick((t) => t + 1)
  }

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

  const totalPaginas = Math.max(1, Math.ceil(totalCount / TAMANHO_PAGINA))

  function irParaPagina() {
    const alvo = Math.min(Math.max(1, Math.trunc(Number(paginaInput)) || 1), totalPaginas)
    setPagina(alvo)
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
              value={buscaInput}
              onChange={(e) => setBuscaInput(e.target.value)}
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
              ) : solicitacoes.length === 0 ? (
                <tr>
                  <td colSpan={colunas} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                    Nenhuma solicitação encontrada.
                  </td>
                </tr>
              ) : (
                solicitacoes.map((s) => (
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
                      <td className="px-4 py-2.5 text-xs text-on-surface-variant max-w-[160px]">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate">{s.representante_nome ?? '—'}</span>
                          {s.representante_nome && perfisPorNome.get(s.representante_nome)?.ativo === false && (
                            <UsuarioInativoBadge />
                          )}
                        </span>
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

        {!loading && totalCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-outline-variant/10">
            <p className="text-xs text-on-surface-variant">
              Mostrando {(pagina - 1) * TAMANHO_PAGINA + 1}–{Math.min(pagina * TAMANHO_PAGINA, totalCount)} de{' '}
              {totalCount}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={pagina === 1}
                onClick={() => setPagina((p) => p - 1)}
                className="p-1.5 rounded-md text-outline hover:text-primary hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-outline transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <span className="text-xs font-semibold text-on-surface whitespace-nowrap">
                {pagina} / {totalPaginas}
              </span>
              <button
                type="button"
                disabled={pagina === totalPaginas}
                onClick={() => setPagina((p) => p + 1)}
                className="p-1.5 rounded-md text-outline hover:text-primary hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-outline transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
              <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-outline-variant/20">
                <label htmlFor="ir-para-pagina" className="text-xs text-on-surface-variant whitespace-nowrap">
                  Ir para
                </label>
                <input
                  id="ir-para-pagina"
                  type="number"
                  min={1}
                  max={totalPaginas}
                  value={paginaInput}
                  onChange={(e) => setPaginaInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && irParaPagina()}
                  onBlur={irParaPagina}
                  className="w-14 h-7 text-center text-xs bg-surface-container-lowest border border-outline-variant/20 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      <SolicitacaoDetailModal id={selecionadaId} onClose={fecharModal} />
    </div>
  )
}
