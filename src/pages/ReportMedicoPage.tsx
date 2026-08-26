import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import { StatTile } from '../components/ui/StatTile'
import { MultiSelectField } from '../components/ui/MultiSelectField'
import { DateRangeField } from '../components/ui/DateRangeField'
import { SolicitacaoDetailModal } from '../components/solicitacoes/SolicitacaoDetailModal'
import {
  STATUS_FINAL_OPCOES,
  normalizarStatusFinal,
  statusBadgeClasse,
  statusBordaClasse,
  statusIconeClasse,
  statusFinalIcone,
} from '../lib/reportMedicoStatus'
import { alertaProtocolo, CLASSE_LINHA_ALERTA, LIMITE_DIAS_PROTOCOLADO, type Alerta } from '../lib/alertas'
import { exportarReportMedicoExcel } from '../lib/exportReportMedico'
import { useReportMedicoStatusRealtime } from '../hooks/useReportMedicoStatusRealtime'
import { componentesIso, deslocarMes, hojeIso, paraIso } from '../lib/dateUtils'
import type { SolicitacaoImportada } from '../lib/types'

const SELECT_COM_STATUS =
  '*, report_medico_status(status_final, data_protocolo, observacoes, atualizado_em)'

// Situação (vinda da planilha) que fica escondida por padrão: reprovadas poluem a operação do
// dia a dia, mas continuam a um clique de distância pelo botão "Reprovadas".
const SITUACAO_OCULTA = 'Reprovado'

const TAMANHO_PAGINA = 50

// Altura da TopNavBar fixa (h-16). É a partir dela que o cabeçalho da tabela gruda.
const ALTURA_TOPNAV = 64

const STATUS_EM_ABERTO = ['SOLICITADO', 'PROTOCOLADO']
const STATUS_AUTORIZADAS = ['AUTORIZADO', 'AGENDADO', 'PENDÊNCIA AGENDAMENTO']
const STATUS_NEGATIVAS = ['NEGADO', 'CANCELADO', 'DESISTÊNCIA']

type StatusExtra = {
  status_final: string
  data_protocolo: string | null
  observacoes: string | null
  atualizado_em: string | null
}

type Linha = SolicitacaoImportada & { report_medico_status: StatusExtra | null }

type SortKey = 'data_solicitacao' | 'data_protocolo' | 'data_cirurgia'

type Filtros = {
  representantes: string[]
  procedimentos: string[]
  convenios: string[]
  hospitais: string[]
  pacientes: string[]
  medicos: string[]
  statusFinal: string[]
  dataSolicitacaoDe: string
  dataSolicitacaoAte: string
  dataProtocoloDe: string
  dataProtocoloAte: string
  dataAutorizacaoDe: string
  dataAutorizacaoAte: string
  observacoes: string
  somenteAlertas: boolean
  mostrarReprovadas: boolean
}

// Padrão da tela: "Data Solicitação" já vem preenchida com o mês atual + 4 meses anteriores
// (5 meses no total), em vez de carregar o histórico inteiro em aberto.
function periodoSolicitacaoPadrao(): { de: string; ate: string } {
  const hoje = componentesIso(hojeIso())
  const inicio = deslocarMes(hoje.ano, hoje.mes0, -4)
  return { de: paraIso(inicio.ano, inicio.mes0, 1), ate: hojeIso() }
}

function filtrosVazios(): Filtros {
  const { de, ate } = periodoSolicitacaoPadrao()
  return {
    representantes: [],
    procedimentos: [],
    convenios: [],
    hospitais: [],
    pacientes: [],
    medicos: [],
    statusFinal: [],
    dataSolicitacaoDe: de,
    dataSolicitacaoAte: ate,
    dataProtocoloDe: '',
    dataProtocoloAte: '',
    dataAutorizacaoDe: '',
    dataAutorizacaoAte: '',
    observacoes: '',
    somenteAlertas: false,
    mostrarReprovadas: false,
  }
}

function statusFinalDe(r: Linha): string {
  return normalizarStatusFinal(r.report_medico_status?.status_final) || 'SOLICITADO'
}
function alertaDe(r: Linha): Alerta | null {
  return alertaProtocolo(r.report_medico_status, r.report_medico_status?.atualizado_em)
}
function dataProtocoloDe(r: Linha): string | null {
  return r.report_medico_status?.data_protocolo ?? null
}
function observacoesDe(r: Linha): string {
  return r.report_medico_status?.observacoes ?? ''
}

function formatDataBR(iso: string | null): string {
  if (!iso) return '—'
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

// Página é carregada em duas etapas — ver o efeito de montagem mais abaixo. Primeiro só a janela
// padrão (mesmos ~5 meses do filtro "Data Solicitação" que já vem preenchido), pra tela aparecer
// rápido; o restante do histórico (10 mil+ linhas) entra depois, em segundo plano, sem bloquear
// a primeira renderização. As duas funções abaixo pedem no servidor exatamente esse recorte —
// nada de trazer a tabela inteira pra filtrar no cliente.

async function fetchJanelaPadrao(de: string, ate: string): Promise<Linha[]> {
  const tamanhoLote = 1000
  let offset = 0
  const todas: Linha[] = []
  for (;;) {
    const { data, error } = await supabase
      .from('solicitacoes_importadas')
      .select(SELECT_COM_STATUS)
      .gte('data_solicitacao', de)
      .lte('data_solicitacao', ate)
      .order('data_solicitacao', { ascending: false })
      .range(offset, offset + tamanhoLote - 1)
    if (error) throw error
    todas.push(...((data as unknown as Linha[]) ?? []))
    if (!data || data.length < tamanhoLote) break
    offset += tamanhoLote
  }
  return todas
}

async function fetchForaDaJanelaPadrao(de: string, ate: string): Promise<Linha[]> {
  const tamanhoLote = 1000
  let offset = 0
  const todas: Linha[] = []
  for (;;) {
    const { data, error } = await supabase
      .from('solicitacoes_importadas')
      .select(SELECT_COM_STATUS)
      .or(`data_solicitacao.lt.${de},data_solicitacao.gt.${ate},data_solicitacao.is.null`)
      .order('data_solicitacao', { ascending: false })
      .range(offset, offset + tamanhoLote - 1)
    if (error) throw error
    todas.push(...((data as unknown as Linha[]) ?? []))
    if (!data || data.length < tamanhoLote) break
    offset += tamanhoLote
  }
  return todas
}

const observacoesInputClass =
  'w-full h-[46px] bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm px-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors'

function CampoIntervaloData({
  label,
  de,
  ate,
  onChange,
}: {
  label: string
  de: string
  ate: string
  onChange: (de: string, ate: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-[230px]">
      <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">{label}</label>
      <DateRangeField de={de} ate={ate} onChange={onChange} />
    </div>
  )
}

export function ReportMedicoPage() {
  const [linhas, setLinhas] = useState<Linha[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState<Filtros>(filtrosVazios)
  const [sortKey, setSortKey] = useState<SortKey>('data_solicitacao')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [pagina, setPagina] = useState(1)
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null)
  // true enquanto o restante do histórico (fora da janela padrão) ainda carrega em segundo
  // plano. Filtros mais amplos que a janela padrão (ex.: limpar "Data Solicitação") podem
  // mostrar resultado incompleto até essa flag virar false — daí o aviso na UI.
  const [carregandoRestante, setCarregandoRestante] = useState(false)
  const [exportando, setExportando] = useState(false)

  // "Exportar Tudo" busca a tabela inteira direto do banco, sem respeitar filtro/paginação da
  // tela — é a proposta do botão. Por isso não reaproveita `linhas` (que pode estar filtrada
  // pela janela padrão de carregamento, ver efeito de montagem mais abaixo).
  async function exportarTudo() {
    if (exportando) return
    setExportando(true)
    const toastId = toast.loading('Exportando Report Médico completo…')
    try {
      const { registros } = await exportarReportMedicoExcel()
      toast.success(`Exportação concluída — ${registros} registros.`, { id: toastId })
    } catch {
      toast.error('Não foi possível exportar o Report Médico. Tente novamente.', { id: toastId })
    } finally {
      setExportando(false)
    }
  }

  // O cabeçalho da Card (título + contador) e a linha de títulos da tabela grudam juntos no topo
  // da janela. Como os dois são sticky, o segundo precisa saber a altura exata do primeiro —
  // medida em tempo real, porque o bloco cresce quando o texto quebra em telas mais estreitas.
  const cabecalhoRef = useRef<HTMLDivElement>(null)
  const [alturaCabecalho, setAlturaCabecalho] = useState(0)

  useEffect(() => {
    const elemento = cabecalhoRef.current
    if (!elemento) return
    const observador = new ResizeObserver(() => setAlturaCabecalho(elemento.offsetHeight))
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [loading])

  useEffect(() => {
    let cancelado = false
    const { de, ate } = periodoSolicitacaoPadrao()

    async function carregar() {
      try {
        const primeiraLeva = await fetchJanelaPadrao(de, ate)
        if (cancelado) return
        setLinhas(primeiraLeva)
      } catch {
        if (!cancelado) toast.error('Não foi possível carregar o Report Médico.')
      } finally {
        if (!cancelado) setLoading(false)
      }

      // Histórico fora da janela padrão, em segundo plano — a tela já está utilizável com a
      // primeira leva. Sem isso, limpar/ampliar o filtro de Data Solicitação ficaria incompleto.
      try {
        setCarregandoRestante(true)
        const resto = await fetchForaDaJanelaPadrao(de, ate)
        if (cancelado) return
        setLinhas((atual) => {
          const idsExistentes = new Set(atual.map((l) => l.id))
          return [...atual, ...resto.filter((l) => !idsExistentes.has(l.id))]
        })
      } catch {
        // Silencioso: a janela padrão já carregou com sucesso; só filtros mais amplos ficam
        // incompletos, não vale interromper o usuário com outro toast por isso.
      } finally {
        if (!cancelado) setCarregandoRestante(false)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [])

  // Mescla no lugar a linha que mudou, sem refazer a consulta inteira: a tela do gestor reflete
  // a edição de qualquer representante sem piscar, sem perder filtro/página e sem refresh.
  const mesclarStatus = useCallback((solicitacaoId: string, extra: StatusExtra | null) => {
    setLinhas((prev) =>
      prev.map((l) => (l.id === solicitacaoId ? { ...l, report_medico_status: extra } : l)),
    )
  }, [])

  useReportMedicoStatusRealtime(({ solicitacaoId, extra, atualizadoEm }) => {
    mesclarStatus(solicitacaoId, extra ? { ...extra, atualizado_em: atualizadoEm } : null)
  })

  async function fecharModal() {
    const id = selecionadaId
    setSelecionadaId(null)
    if (!id) return
    // Rede de segurança para o caso de o realtime não estar ativo no projeto: relê só a linha
    // editada (uma consulta de um registro), em vez de recarregar a tabela toda.
    const { data } = await supabase.from('solicitacoes_importadas').select(SELECT_COM_STATUS).eq('id', id).single()
    const linha = data as unknown as Linha | null
    if (linha) mesclarStatus(id, linha.report_medico_status)
  }

  useEffect(() => {
    setPagina(1)
  }, [filtros])

  function atualizarFiltro<K extends keyof Filtros>(chave: K, valor: Filtros[K]) {
    setFiltros((prev) => ({ ...prev, [chave]: valor }))
  }

  function limparFiltros() {
    setFiltros(filtrosVazios())
  }

  const opcoes = useMemo(() => {
    const conjuntos = {
      representantes: new Set<string>(),
      procedimentos: new Set<string>(),
      convenios: new Set<string>(),
      hospitais: new Set<string>(),
      pacientes: new Set<string>(),
      medicos: new Set<string>(),
    }
    for (const r of linhas) {
      if (r.representante_nome) conjuntos.representantes.add(r.representante_nome)
      if (r.descricao_tipo) conjuntos.procedimentos.add(r.descricao_tipo)
      if (r.plano_saude_nome) conjuntos.convenios.add(r.plano_saude_nome)
      if (r.hospital_nome) conjuntos.hospitais.add(r.hospital_nome)
      if (r.paciente_nome) conjuntos.pacientes.add(r.paciente_nome)
      if (r.medico_nome) conjuntos.medicos.add(r.medico_nome)
    }
    const paraOpcoes = (valores: Set<string>) =>
      Array.from(valores)
        .sort()
        .map((v) => ({ value: v, label: v }))
    return {
      representantes: paraOpcoes(conjuntos.representantes),
      procedimentos: paraOpcoes(conjuntos.procedimentos),
      convenios: paraOpcoes(conjuntos.convenios),
      hospitais: paraOpcoes(conjuntos.hospitais),
      pacientes: paraOpcoes(conjuntos.pacientes),
      medicos: paraOpcoes(conjuntos.medicos),
      statusFinal: STATUS_FINAL_OPCOES.map((s) => ({
        value: s,
        label: s,
        icon: statusFinalIcone(s),
        iconClassName: statusIconeClasse(s),
      })),
    }
  }, [linhas])

  const filtradas = useMemo(() => {
    return linhas.filter((r) => {
      if (!filtros.mostrarReprovadas && r.situacao === SITUACAO_OCULTA) return false
      if (filtros.somenteAlertas && !alertaDe(r)) return false
      if (filtros.representantes.length && !filtros.representantes.includes(r.representante_nome ?? '')) return false
      if (filtros.procedimentos.length && !filtros.procedimentos.includes(r.descricao_tipo ?? '')) return false
      if (filtros.convenios.length && !filtros.convenios.includes(r.plano_saude_nome ?? '')) return false
      if (filtros.hospitais.length && !filtros.hospitais.includes(r.hospital_nome ?? '')) return false
      if (filtros.pacientes.length && !filtros.pacientes.includes(r.paciente_nome ?? '')) return false
      if (filtros.medicos.length && !filtros.medicos.includes(r.medico_nome ?? '')) return false
      if (filtros.statusFinal.length && !filtros.statusFinal.includes(statusFinalDe(r))) return false
      if (filtros.dataSolicitacaoDe && (!r.data_solicitacao || r.data_solicitacao < filtros.dataSolicitacaoDe))
        return false
      if (filtros.dataSolicitacaoAte && (!r.data_solicitacao || r.data_solicitacao > filtros.dataSolicitacaoAte))
        return false
      const protocolo = dataProtocoloDe(r)
      if (filtros.dataProtocoloDe && (!protocolo || protocolo < filtros.dataProtocoloDe)) return false
      if (filtros.dataProtocoloAte && (!protocolo || protocolo > filtros.dataProtocoloAte)) return false
      if (filtros.dataAutorizacaoDe && (!r.data_aprovacao || r.data_aprovacao < filtros.dataAutorizacaoDe))
        return false
      if (filtros.dataAutorizacaoAte && (!r.data_aprovacao || r.data_aprovacao > filtros.dataAutorizacaoAte))
        return false
      if (filtros.observacoes.trim()) {
        const q = filtros.observacoes.trim().toLowerCase()
        if (!observacoesDe(r).toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [linhas, filtros])

  const ordenadas = useMemo(() => {
    const copia = [...filtradas]
    const valorOrdenacao = (r: Linha): string =>
      (sortKey === 'data_solicitacao'
        ? r.data_solicitacao
        : sortKey === 'data_protocolo'
          ? dataProtocoloDe(r)
          : r.data_cirurgia) ?? ''
    copia.sort((a, b) => {
      const va = valorOrdenacao(a)
      const vb = valorOrdenacao(b)
      if (va === vb) return 0
      const menor = va < vb
      return sortDir === 'desc' ? (menor ? 1 : -1) : menor ? -1 : 1
    })
    return copia
  }, [filtradas, sortKey, sortDir])

  const totalPaginas = Math.max(1, Math.ceil(ordenadas.length / TAMANHO_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = ordenadas.slice((paginaAtual - 1) * TAMANHO_PAGINA, paginaAtual * TAMANHO_PAGINA)

  const stats = useMemo(() => {
    const emAberto = filtradas.filter((r) => STATUS_EM_ABERTO.includes(statusFinalDe(r))).length
    const autorizadas = filtradas.filter((r) => STATUS_AUTORIZADAS.includes(statusFinalDe(r))).length
    const cirurgias = filtradas.filter((r) => statusFinalDe(r) === 'CIRURGIA REALIZADA').length
    const negativas = filtradas.filter((r) => STATUS_NEGATIVAS.includes(statusFinalDe(r))).length
    const alertas = filtradas.filter((r) => alertaDe(r)).length
    const pctCirurgias = filtradas.length > 0 ? Math.round((cirurgias / filtradas.length) * 100) : 0
    return { emAberto, autorizadas, cirurgias, negativas, alertas, pctCirurgias }
  }, [filtradas])

  // Compartilhado pelas 9 colunas: `top` do sticky = barra fixa do topo + cabeçalho da Card.
  const estiloTituloFixo = { top: ALTURA_TOPNAV + alturaCabecalho }

  function alternarOrdenacao(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  if (loading) {
    return <p className="text-sm text-on-surface-variant">Carregando…</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-headline font-bold text-3xl text-secondary tracking-tight">Report Médico</h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            Acompanhamento das solicitações por status, do pedido inicial à cirurgia realizada.
          </p>
        </div>
        <button
          type="button"
          onClick={exportarTudo}
          disabled={exportando}
          title="Exporta todos os registros do Report Médico em .xlsx, ignorando os filtros da tela"
          className="inline-flex items-center gap-2 bg-surface-container-high text-secondary hover:bg-surface-container-highest disabled:opacity-60 disabled:cursor-not-allowed rounded-lg text-sm font-semibold py-2.5 px-5 h-[46px] transition-colors shrink-0"
        >
          <span className={`material-symbols-outlined text-[18px] ${exportando ? 'animate-spin' : ''}`}>
            {exportando ? 'progress_activity' : 'download'}
          </span>
          {exportando ? 'Exportando…' : 'Exportar Tudo'}
        </button>
      </header>

      <Card className="p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5 min-w-[160px] flex-1">
            <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Representante</label>
            <MultiSelectField
              options={opcoes.representantes}
              selected={filtros.representantes}
              onChange={(v) => atualizarFiltro('representantes', v)}
              searchPlaceholder="Buscar representante…"
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[160px] flex-1">
            <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Procedimento</label>
            <MultiSelectField
              options={opcoes.procedimentos}
              selected={filtros.procedimentos}
              onChange={(v) => atualizarFiltro('procedimentos', v)}
              searchPlaceholder="Buscar procedimento…"
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[160px] flex-1">
            <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Convênio</label>
            <MultiSelectField
              options={opcoes.convenios}
              selected={filtros.convenios}
              onChange={(v) => atualizarFiltro('convenios', v)}
              searchPlaceholder="Buscar convênio…"
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[140px] flex-1">
            <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Hosp</label>
            <MultiSelectField
              options={opcoes.hospitais}
              selected={filtros.hospitais}
              onChange={(v) => atualizarFiltro('hospitais', v)}
              searchPlaceholder="Buscar hospital…"
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[160px] flex-1">
            <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Paciente</label>
            <MultiSelectField
              options={opcoes.pacientes}
              selected={filtros.pacientes}
              onChange={(v) => atualizarFiltro('pacientes', v)}
              searchPlaceholder="Buscar paciente…"
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[160px] flex-1">
            <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Médico</label>
            <MultiSelectField
              options={opcoes.medicos}
              selected={filtros.medicos}
              onChange={(v) => atualizarFiltro('medicos', v)}
              searchPlaceholder="Buscar médico…"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Status Final</label>
            <MultiSelectField
              options={opcoes.statusFinal}
              selected={filtros.statusFinal}
              onChange={(v) => atualizarFiltro('statusFinal', v)}
              searchPlaceholder="Buscar status…"
            />
          </div>

          <CampoIntervaloData
            label="Data Solicitação"
            de={filtros.dataSolicitacaoDe}
            ate={filtros.dataSolicitacaoAte}
            onChange={(de, ate) =>
              setFiltros((prev) => ({ ...prev, dataSolicitacaoDe: de, dataSolicitacaoAte: ate }))
            }
          />
          <CampoIntervaloData
            label="Data Protocolo"
            de={filtros.dataProtocoloDe}
            ate={filtros.dataProtocoloAte}
            onChange={(de, ate) => setFiltros((prev) => ({ ...prev, dataProtocoloDe: de, dataProtocoloAte: ate }))}
          />
          <CampoIntervaloData
            label="Data Autorização"
            de={filtros.dataAutorizacaoDe}
            ate={filtros.dataAutorizacaoAte}
            onChange={(de, ate) =>
              setFiltros((prev) => ({ ...prev, dataAutorizacaoDe: de, dataAutorizacaoAte: ate }))
            }
          />

          <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
            <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Observações</label>
            <input
              type="text"
              value={filtros.observacoes}
              onChange={(e) => atualizarFiltro('observacoes', e.target.value)}
              placeholder="buscar texto…"
              className={observacoesInputClass}
            />
          </div>

          <button
            type="button"
            onClick={() => atualizarFiltro('somenteAlertas', !filtros.somenteAlertas)}
            aria-pressed={filtros.somenteAlertas}
            title={`Solicitações há ${LIMITE_DIAS_PROTOCOLADO} dias ou mais em PROTOCOLADO`}
            className={`inline-flex items-center gap-2 rounded-lg text-sm font-semibold py-2.5 px-4 h-[46px] transition-colors shrink-0 ${
              filtros.somenteAlertas
                ? 'bg-error text-on-error'
                : 'bg-surface-container-high text-secondary hover:bg-surface-container-highest'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">warning</span>
            Só alertas
          </button>

          <button
            type="button"
            onClick={() => atualizarFiltro('mostrarReprovadas', !filtros.mostrarReprovadas)}
            aria-pressed={filtros.mostrarReprovadas}
            title="Solicitações com situação Reprovado ficam ocultas por padrão"
            className={`inline-flex items-center gap-2 rounded-lg text-sm font-semibold py-2.5 px-4 h-[46px] transition-colors shrink-0 ${
              filtros.mostrarReprovadas
                ? 'bg-secondary-container text-secondary'
                : 'bg-surface-container-high text-secondary hover:bg-surface-container-highest'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {filtros.mostrarReprovadas ? 'visibility' : 'visibility_off'}
            </span>
            Reprovadas
          </button>

          <button
            type="button"
            onClick={limparFiltros}
            className="bg-surface-container-high text-secondary hover:bg-surface-container-highest rounded-lg text-sm font-semibold py-2.5 px-5 h-[46px] transition-colors shrink-0"
          >
            Limpar
          </button>
        </div>
      </Card>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatTile
          label="Em Aberto"
          value={String(stats.emAberto)}
          sublabel="Solicitado + protocolado"
          dotClass="bg-primary"
        />
        <StatTile
          label="Autorizadas"
          value={String(stats.autorizadas)}
          sublabel="Autorizado + pend. agend."
          dotClass="bg-tertiary-container"
        />
        <StatTile
          label="Cirurgias Realizadas"
          value={String(stats.cirurgias)}
          sublabel={`${stats.pctCirurgias}% dos registros`}
          dotClass="bg-on-surface"
        />
        <StatTile
          label="Negativas"
          value={String(stats.negativas)}
          sublabel="Negado + cancelado + desist."
          dotClass="bg-error"
        />
        <StatTile
          label="Alertas"
          value={String(stats.alertas)}
          sublabel={`+${LIMITE_DIAS_PROTOCOLADO} dias protocolado`}
          dotClass="bg-error"
        />
      </section>

      {/* `overflow-visible` a partir de lg: um contêiner com overflow no eixo X passa a ser o
          scrollport dos filhos sticky, e aí o cabeçalho grudaria nele (que não rola) em vez da
          janela. Abaixo de lg a tabela não cabe na largura, então lá vale mais a rolagem
          horizontal do que o cabeçalho fixo. */}
      <Card className="overflow-hidden lg:overflow-visible">
        <div
          ref={cabecalhoRef}
          className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10 bg-surface-container-lowest rounded-t-xl lg:sticky lg:top-16 lg:z-30"
        >
          <div>
            <h2 className="font-headline font-bold text-lg text-secondary">Registros · Report Médico</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Somente leitura — clique num paciente para editar Status Final, Protocolo e Observações
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {carregandoRestante && (
              <span
                className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant"
                title="Os últimos ~5 meses já estão completos. Histórico mais antigo continua carregando — filtros de data mais amplos podem ficar incompletos até terminar."
              >
                <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                Carregando histórico completo…
              </span>
            )}
            <span className="bg-inverse-surface text-inverse-on-surface text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
              {ordenadas.length} de {linhas.length} registros
            </span>
          </div>
        </div>

        <div className="overflow-x-auto lg:overflow-x-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th
                  style={estiloTituloFixo}
                  className="lg:sticky z-20 bg-surface-container-low px-6 py-3 font-headline font-bold text-[11px] text-on-surface-variant uppercase tracking-widest">
                  Paciente
                </th>
                <th
                  style={estiloTituloFixo}
                  className="lg:sticky z-20 bg-surface-container-low px-4 py-3 font-headline font-bold text-[11px] text-on-surface-variant uppercase tracking-widest">
                  Procedimento
                </th>
                <th
                  style={estiloTituloFixo}
                  className="lg:sticky z-20 bg-surface-container-low px-4 py-3 font-headline font-bold text-[11px] text-on-surface-variant uppercase tracking-widest">
                  Convênio
                </th>
                <th
                  style={estiloTituloFixo}
                  className="lg:sticky z-20 bg-surface-container-low px-4 py-3 font-headline font-bold text-[11px] text-on-surface-variant uppercase tracking-widest">
                  Hospital
                </th>
                <th
                  style={estiloTituloFixo}
                  className={`lg:sticky z-20 bg-surface-container-low px-4 py-3 font-headline font-bold text-[11px] uppercase tracking-widest cursor-pointer select-none whitespace-nowrap transition-colors ${
                    sortKey === 'data_solicitacao' ? 'text-primary-container' : 'text-on-surface-variant hover:text-primary'
                  }`}
                  onClick={() => alternarOrdenacao('data_solicitacao')}
                >
                  <span className="inline-flex items-center gap-1">
                    Solicitação
                    {sortKey === 'data_solicitacao' && (
                      <span className="material-symbols-outlined text-[14px]">
                        {sortDir === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                      </span>
                    )}
                  </span>
                </th>
                <th
                  style={estiloTituloFixo}
                  className={`lg:sticky z-20 bg-surface-container-low px-4 py-3 font-headline font-bold text-[11px] uppercase tracking-widest cursor-pointer select-none whitespace-nowrap transition-colors ${
                    sortKey === 'data_protocolo' ? 'text-primary-container' : 'text-on-surface-variant hover:text-primary'
                  }`}
                  onClick={() => alternarOrdenacao('data_protocolo')}
                >
                  <span className="inline-flex items-center gap-1">
                    Protocolo
                    {sortKey === 'data_protocolo' && (
                      <span className="material-symbols-outlined text-[14px]">
                        {sortDir === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                      </span>
                    )}
                  </span>
                </th>
                <th
                  style={estiloTituloFixo}
                  className={`lg:sticky z-20 bg-surface-container-low px-4 py-3 font-headline font-bold text-[11px] uppercase tracking-widest cursor-pointer select-none whitespace-nowrap transition-colors ${
                    sortKey === 'data_cirurgia' ? 'text-primary-container' : 'text-on-surface-variant hover:text-primary'
                  }`}
                  onClick={() => alternarOrdenacao('data_cirurgia')}
                >
                  <span className="inline-flex items-center gap-1">
                    Cirurgia
                    {sortKey === 'data_cirurgia' && (
                      <span className="material-symbols-outlined text-[14px]">
                        {sortDir === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                      </span>
                    )}
                  </span>
                </th>
                <th
                  style={estiloTituloFixo}
                  className="lg:sticky z-20 bg-surface-container-low px-4 py-3 font-headline font-bold text-[11px] text-on-surface-variant uppercase tracking-widest">
                  Status Final
                </th>
                <th
                  style={estiloTituloFixo}
                  className="lg:sticky z-20 bg-surface-container-low px-4 py-3 font-headline font-bold text-[11px] text-on-surface-variant uppercase tracking-widest">
                  Observações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {visiveis.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                    {linhas.length === 0
                      ? 'Nenhuma solicitação importada ainda.'
                      : 'Nenhum registro encontrado para os filtros selecionados.'}
                  </td>
                </tr>
              ) : (
                visiveis.map((r) => {
                  const alerta = alertaDe(r)
                  return (
                  <tr
                    key={r.id}
                    onClick={() => setSelecionadaId(r.id)}
                    title={alerta?.motivo}
                    className={`cursor-pointer transition-colors ${
                      alerta
                        ? CLASSE_LINHA_ALERTA
                        : `hover:bg-surface-container-high/40 ${statusBordaClasse(statusFinalDe(r))}`
                    }`}
                  >
                    <td className="px-6 py-3 text-sm font-bold text-secondary uppercase truncate max-w-[220px] hover:underline">
                      <span className="inline-flex items-center gap-1.5">
                        {alerta && (
                          <span
                            className="material-symbols-outlined text-[16px] text-error shrink-0"
                            aria-label={alerta.motivo}
                          >
                            warning
                          </span>
                        )}
                        {r.paciente_nome ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-on-surface truncate max-w-[180px]">
                      {r.descricao_tipo ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-primary font-semibold truncate max-w-[160px]">
                      {r.plano_saude_nome ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {r.hospital_nome ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-container-high text-[11px] font-semibold text-on-surface-variant truncate max-w-[160px]">
                          {r.hospital_nome}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-on-surface whitespace-nowrap">
                      {formatDataBR(r.data_solicitacao)}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <span className={alerta ? 'font-bold text-error' : 'text-on-surface-variant'}>
                        {formatDataBR(dataProtocoloDe(r))}
                      </span>
                      {alerta && (
                        <span className="block text-[10px] font-semibold text-error uppercase tracking-wide">
                          {alerta.dias} dias parado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-on-surface-variant whitespace-nowrap">
                      {formatDataBR(r.data_cirurgia)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                          alerta ? 'bg-error text-on-error border-error' : statusBadgeClasse(statusFinalDe(r))
                        }`}
                      >
                        {statusFinalDe(r)}
                      </span>
                      {alerta && (
                        <span className="block mt-1 text-[10px] font-semibold text-error leading-tight max-w-[200px]">
                          {alerta.motivo}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-on-surface-variant truncate max-w-[220px]">
                      {observacoesDe(r) || '—'}
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {ordenadas.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/10">
            <p className="text-xs text-on-surface-variant">
              Mostrando {(paginaAtual - 1) * TAMANHO_PAGINA + 1}–
              {Math.min(paginaAtual * TAMANHO_PAGINA, ordenadas.length)} de {ordenadas.length}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={paginaAtual === 1}
                onClick={() => setPagina((p) => p - 1)}
                className="p-1.5 rounded-md text-outline hover:text-primary hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-outline transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <span className="text-xs font-semibold text-on-surface">
                {paginaAtual} / {totalPaginas}
              </span>
              <button
                type="button"
                disabled={paginaAtual === totalPaginas}
                onClick={() => setPagina((p) => p + 1)}
                className="p-1.5 rounded-md text-outline hover:text-primary hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-outline transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </Card>

      <SolicitacaoDetailModal id={selecionadaId} onClose={fecharModal} />
    </div>
  )
}
