import { Fragment, useMemo, useState } from 'react'
import { Card } from '../ui/Card'
import { StatusBadge } from '../ui/StatusBadge'
import { statusFinalDe } from '../../lib/reportMedicoStatus'
import { hojeIso } from '../../lib/dateUtils'
import type { SolicitacaoImportadaComStatus } from '../../lib/types'

// "Cotações"/"Autorizações" (carteira em aberto, sem filtro de mês) continuam vindo de
// status_final — o rastreamento manual em report_medico_status ainda é a fonte certa pra "onde
// está" cada cotação no funil. Nota: SEM "AGENDADO" em autorizações — reflete literalmente o
// critério validado com o sistema de referência (ver comentário completo em RelatoriosPage.tsx).
const STATUS_EM_ABERTO = ['SOLICITADO', 'PROTOCOLADO']
const STATUS_AUTORIZADAS = ['AUTORIZADO', 'PENDÊNCIA AGENDAMENTO']

// "Agendamentos"/"Cirurgias Realizadas" (mês de referência) replicam a planilha de referência:
// data + situação da própria solicitação, não o rastreamento manual — ver RelatoriosPage.tsx.
const SITUACAO_REPROVADA = 'Reprovado'

function cirurgiaRealizadaNoMes(s: SolicitacaoImportadaComStatus, mesReferencia: string, hoje: string): boolean {
  return (
    !!s.data_cirurgia &&
    mesKeyDe(s.data_cirurgia) === mesReferencia &&
    s.data_cirurgia < hoje &&
    s.situacao !== SITUACAO_REPROVADA
  )
}

function agendadaNoMes(s: SolicitacaoImportadaComStatus, mesReferencia: string, hoje: string): boolean {
  return (
    !!s.data_cirurgia &&
    mesKeyDe(s.data_cirurgia) === mesReferencia &&
    !cirurgiaRealizadaNoMes(s, mesReferencia, hoje)
  )
}

const SEM_MEDICO = 'Sem médico informado'
const SEM_PACIENTE = 'Sem paciente informado'

const currencyCompact = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

function mesKeyDe(dataIso: string): string {
  return dataIso.slice(0, 7)
}

// Datas do banco são `date` puro ('YYYY-MM-DD'); formatar via `new Date(...)` sofre deslocamento
// de fuso (vira o dia anterior em UTC-3). Formatação direta na string evita isso.
function formatarDataBR(dataIso: string | null): string | null {
  if (!dataIso) return null
  const [ano, mes, dia] = dataIso.split('-')
  return `${dia}/${mes}/${ano}`
}

// Melhor data disponível para representar o item na linha do tempo do paciente: a da cirurgia
// quando já aconteceu/está marcada, senão a última etapa do fluxo já preenchida.
function melhorDataDe(item: SolicitacaoImportadaComStatus): string | null {
  return item.data_cirurgia ?? item.data_aprovacao ?? item.data_orcamento ?? item.data_solicitacao ?? null
}

// `||`, não `??`: quando uma cirurgia já é CIRURGIA REALIZADA mas o valor final ainda não foi
// faturado, `valor_realizado` vem 0 explícito no banco (nunca null) — `??` não cairia pro
// orçamento nesse caso e mostraria R$0,00 pra uma cirurgia que já aconteceu.
function valorDoItem(item: SolicitacaoImportadaComStatus): number {
  return item.valor_realizado || item.valor_orcamento || 0
}

type Metrics = {
  cotacoesQtde: number
  cotacoesValor: number
  autorizacoesQtde: number
  autorizacoesValor: number
  agendamentosQtde: number
  agendamentosValor: number
  cirurgiasQtde: number
  cirurgiasValor: number
}

type StatusFluxo = 'saudavel' | 'sem_cadencia' | 'sem_frequencia' | 'sem_movimento'

type PacienteNode = { nome: string; metrics: Metrics; status: StatusFluxo; itens: SolicitacaoImportadaComStatus[] }
type MedicoNode = { nome: string; metrics: Metrics; status: StatusFluxo; pacientes: PacienteNode[] }
type RepNode = { nome: string; metrics: Metrics; medicos: MedicoNode[] }

type SortKey = 'cotacoesValor' | 'autorizacoesValor' | 'agendamentosValor' | 'cirurgiasValor'

const COLUNAS: { key: SortKey; label: string; sub: string }[] = [
  { key: 'cotacoesValor', label: 'Cotações', sub: 'em aberto · qtde · R$' },
  { key: 'autorizacoesValor', label: 'Autorizações', sub: 'em aberto · qtde · R$' },
  { key: 'agendamentosValor', label: 'Agendamentos', sub: 'mês ref · qtde · R$' },
  { key: 'cirurgiasValor', label: 'Cirurgias Realizadas', sub: 'mês ref · qtde · R$' },
]

function calcularMetrics(itens: SolicitacaoImportadaComStatus[], mesReferencia: string, hoje: string): Metrics {
  // Cotações/Autorizações: carteira em aberto, sem filtro de mês — status_final é a fonte.
  const cotacoes = itens.filter((s) => STATUS_EM_ABERTO.includes(statusFinalDe(s.report_medico_status)))
  const autorizacoes = itens.filter((s) => STATUS_AUTORIZADAS.includes(statusFinalDe(s.report_medico_status)))
  // Agendamentos/Cirurgias: mês de referência — data + situação, não status_final.
  const agendamentos = itens.filter((s) => agendadaNoMes(s, mesReferencia, hoje))
  const cirurgias = itens.filter((s) => cirurgiaRealizadaNoMes(s, mesReferencia, hoje))
  return {
    cotacoesQtde: cotacoes.length,
    cotacoesValor: cotacoes.reduce((soma, s) => soma + (s.valor_orcamento ?? 0), 0),
    autorizacoesQtde: autorizacoes.length,
    autorizacoesValor: autorizacoes.reduce((soma, s) => soma + (s.valor_orcamento ?? 0), 0),
    agendamentosQtde: agendamentos.length,
    agendamentosValor: agendamentos.reduce((soma, s) => soma + (s.valor_orcamento ?? 0), 0),
    cirurgiasQtde: cirurgias.length,
    cirurgiasValor: cirurgias.reduce((soma, s) => soma + valorDoItem(s), 0),
  }
}

// Classificação de carteira por médico, replicando a planilha de referência: cotQ/autQ vêm da
// carteira aberta (status_final, sem filtro de mês); agQ/cirQ vêm do movimento do mês de
// referência (data + situação). Ordem importa — "sem movimento" tem prioridade sobre as demais.
function statusDe(metrics: Metrics): StatusFluxo {
  const semNadaEmAberto = metrics.cotacoesQtde <= 0 && metrics.autorizacoesQtde <= 0
  const semMovimentoNoMes = metrics.agendamentosQtde <= 0 && metrics.cirurgiasQtde <= 0
  if (semNadaEmAberto && semMovimentoNoMes) return 'sem_movimento'
  if (metrics.cotacoesQtde <= 0) return 'sem_frequencia'
  if (!semMovimentoNoMes) return 'saudavel'
  return 'sem_cadencia'
}

function linhaClasse(status: StatusFluxo): string {
  if (status === 'sem_cadencia') return 'bg-[#e8990c]/10 border-l-[3px] border-l-[#e8990c]'
  if (status === 'sem_frequencia') return 'bg-error/10 border-l-[3px] border-l-error'
  if (status === 'sem_movimento') return 'bg-outline-variant/10 border-l-[3px] border-l-outline-variant'
  return ''
}

function valorTotal(metrics: Metrics): number {
  return metrics.cotacoesValor + metrics.autorizacoesValor
}

function ValorQtde({ valor, qtde }: { valor: number; qtde: number }) {
  if (qtde === 0) return <span className="text-on-surface-variant">—</span>
  return (
    <>
      <span className="block text-sm font-bold text-on-surface">{currencyCompact.format(valor)}</span>
      <span className="block text-[11px] text-on-surface-variant">{qtde}</span>
    </>
  )
}

function PainelPacientes({
  repNome,
  medico,
  mesLabel,
  onClose,
}: {
  repNome: string
  medico: MedicoNode
  mesLabel: string
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-inverse-surface/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-surface-container-lowest elevation-ambient flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10 shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest truncate">{repNome}</p>
            <h3 className="font-headline font-bold text-lg text-secondary truncate">{medico.nome}</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {medico.pacientes.length} paciente{medico.pacientes.length === 1 ? '' : 's'} · Agend./Cirurgias mês{' '}
              {mesLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-outline hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors shrink-0"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-surface-container-high">
          {medico.pacientes.map((p) => (
            <div key={p.nome} className={`px-6 py-4 ${linhaClasse(p.status)}`}>
              <p className="text-sm font-bold text-on-surface uppercase mb-2 truncate">{p.nome}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-outline uppercase tracking-wide mb-0.5">Cotações</p>
                  <ValorQtde valor={p.metrics.cotacoesValor} qtde={p.metrics.cotacoesQtde} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-outline uppercase tracking-wide mb-0.5">Autorizações</p>
                  <ValorQtde valor={p.metrics.autorizacoesValor} qtde={p.metrics.autorizacoesQtde} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-outline uppercase tracking-wide mb-0.5">Agendamentos</p>
                  <ValorQtde valor={p.metrics.agendamentosValor} qtde={p.metrics.agendamentosQtde} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-outline uppercase tracking-wide mb-0.5">
                    Cirurgias realizadas
                  </p>
                  <ValorQtde valor={p.metrics.cirurgiasValor} qtde={p.metrics.cirurgiasQtde} />
                </div>
              </div>

              <p className="text-[10px] font-bold text-outline uppercase tracking-wide mt-4 mb-2">
                Registros ({p.itens.length})
              </p>
              <div className="space-y-2">
                {p.itens.map((item) => {
                  const data = formatarDataBR(melhorDataDe(item))
                  const referencia =
                    item.nro_agendamento && item.nro_agendamento !== 'S/A'
                      ? `Agend. ${item.nro_agendamento}`
                      : item.nro_orcamento
                        ? `Orç. ${item.nro_orcamento}`
                        : null
                  return (
                    <div key={item.id} className="rounded-lg bg-surface-container-low/70 px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-on-surface truncate">
                          {item.descricao_tipo ?? 'Procedimento não informado'}
                        </span>
                        {item.situacao && <StatusBadge status={item.situacao} />}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-on-surface-variant mt-1.5">
                        <span className="truncate">{item.hospital_nome ?? 'Hospital não informado'}</span>
                        {data && <span className="shrink-0">· {data}</span>}
                        {referencia && <span className="shrink-0">· {referencia}</span>}
                        <span className="ml-auto shrink-0 font-semibold text-on-surface">
                          {currencyCompact.format(valorDoItem(item))}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PipelineComercialTable({
  solicitacoes,
  mesReferencia,
  mesLabel,
}: {
  solicitacoes: SolicitacaoImportadaComStatus[]
  mesReferencia: string
  mesLabel: string
}) {
  const hoje = hojeIso()
  const [sortKey, setSortKey] = useState<SortKey>('cotacoesValor')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [painel, setPainel] = useState<{ repNome: string; medico: MedicoNode } | null>(null)

  function alternarOrdenacao(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function alternarExpandido(nome: string) {
    setExpandidos((prev) => {
      const next = new Set(prev)
      if (next.has(nome)) next.delete(nome)
      else next.add(nome)
      return next
    })
  }

  const arvore = useMemo<RepNode[]>(() => {
    const porRep = new Map<string, SolicitacaoImportadaComStatus[]>()
    for (const s of solicitacoes) {
      if (!s.representante_nome) continue
      if (!porRep.has(s.representante_nome)) porRep.set(s.representante_nome, [])
      porRep.get(s.representante_nome)!.push(s)
    }

    return Array.from(porRep.entries()).map(([nomeRep, itensRep]) => {
      const porMedico = new Map<string, SolicitacaoImportadaComStatus[]>()
      for (const s of itensRep) {
        const nomeMedico = s.medico_nome ?? SEM_MEDICO
        if (!porMedico.has(nomeMedico)) porMedico.set(nomeMedico, [])
        porMedico.get(nomeMedico)!.push(s)
      }

      const medicos: MedicoNode[] = Array.from(porMedico.entries())
        .map(([nomeMedico, itensMedico]) => {
          const porPaciente = new Map<string, SolicitacaoImportadaComStatus[]>()
          for (const s of itensMedico) {
            const nomePaciente = s.paciente_nome ?? SEM_PACIENTE
            if (!porPaciente.has(nomePaciente)) porPaciente.set(nomePaciente, [])
            porPaciente.get(nomePaciente)!.push(s)
          }

          const pacientes: PacienteNode[] = Array.from(porPaciente.entries())
            .map(([nomePaciente, itensPaciente]) => {
              const metrics = calcularMetrics(itensPaciente, mesReferencia, hoje)
              const itens = [...itensPaciente].sort((a, b) => {
                const dataA = melhorDataDe(a) ?? ''
                const dataB = melhorDataDe(b) ?? ''
                return dataB.localeCompare(dataA)
              })
              return { nome: nomePaciente, metrics, status: statusDe(metrics), itens }
            })
            .sort((a, b) => valorTotal(b.metrics) - valorTotal(a.metrics))

          const metrics = calcularMetrics(itensMedico, mesReferencia, hoje)
          return { nome: nomeMedico, metrics, status: statusDe(metrics), pacientes }
        })
        .sort((a, b) => valorTotal(b.metrics) - valorTotal(a.metrics))

      const metrics = calcularMetrics(itensRep, mesReferencia, hoje)
      return { nome: nomeRep, metrics, medicos }
    })
  }, [solicitacoes, mesReferencia, hoje])

  const arvoreOrdenada = useMemo(() => {
    const copia = [...arvore]
    copia.sort((a, b) => {
      const va = a.metrics[sortKey]
      const vb = b.metrics[sortKey]
      return sortDir === 'desc' ? vb - va : va - vb
    })
    return copia
  }, [arvore, sortKey, sortDir])

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10">
        <div>
          <h2 className="font-headline font-bold text-lg text-secondary">Pipeline Comercial por Representante</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Cotações/Autorizações = snapshot atual · Agend./Cirurgias = mês {mesLabel} · carteira completa de médicos ·
            clique nos títulos para ordenar
          </p>
        </div>
        <span className="bg-inverse-surface text-inverse-on-surface text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide shrink-0">
          Ag./Cir.: {mesLabel}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-6 py-3 border-b border-outline-variant/10 bg-surface-container-low/40 text-[11px] font-semibold text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-tertiary-container inline-block shrink-0" /> Dentro do fluxo
          (cotação em aberto + agend./cirurgia no mês)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#e8990c] inline-block shrink-0" /> Sem cadência (cotação em
          aberto, sem agend./cirurgia no mês)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-error inline-block shrink-0" /> Sem frequência (sem cotação em
          aberto)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-outline-variant inline-block shrink-0" /> Sem movimento (nada em
          aberto nem no mês)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low">
              <th className="px-6 py-3 font-headline font-bold text-[11px] text-on-surface-variant uppercase tracking-widest">
                Representante / Médico / Paciente
              </th>
              {COLUNAS.map((coluna) => (
                <th
                  key={coluna.key}
                  className={`px-4 py-3 font-headline font-bold text-[11px] uppercase tracking-widest cursor-pointer select-none whitespace-nowrap transition-colors ${
                    sortKey === coluna.key
                      ? 'text-primary-container bg-primary-container/10'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                  onClick={() => alternarOrdenacao(coluna.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {coluna.label}
                    {sortKey === coluna.key && (
                      <span className="material-symbols-outlined text-[14px]">
                        {sortDir === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                      </span>
                    )}
                  </span>
                  <span className="block text-[10px] font-normal normal-case tracking-normal text-on-surface-variant/70 mt-0.5">
                    {coluna.sub}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high">
            {arvoreOrdenada.length === 0 ? (
              <tr>
                <td colSpan={COLUNAS.length + 1} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                  Nenhum representante com solicitações importadas ainda.
                </td>
              </tr>
            ) : (
              arvoreOrdenada.map((rep) => {
                const expandido = expandidos.has(rep.nome)
                return (
                  <Fragment key={rep.nome}>
                    <tr className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="px-6 py-3 align-top">
                        <button
                          type="button"
                          onClick={() => alternarExpandido(rep.nome)}
                          className="flex items-center gap-2 text-left w-full"
                        >
                          <span className="material-symbols-outlined text-[18px] text-outline shrink-0">
                            {expandido ? 'arrow_drop_down' : 'arrow_right'}
                          </span>
                          <span className="text-sm font-bold text-on-surface uppercase truncate">{rep.nome}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <ValorQtde valor={rep.metrics.cotacoesValor} qtde={rep.metrics.cotacoesQtde} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <ValorQtde valor={rep.metrics.autorizacoesValor} qtde={rep.metrics.autorizacoesQtde} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <ValorQtde valor={rep.metrics.agendamentosValor} qtde={rep.metrics.agendamentosQtde} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <ValorQtde valor={rep.metrics.cirurgiasValor} qtde={rep.metrics.cirurgiasQtde} />
                      </td>
                    </tr>
                    {expandido &&
                      rep.medicos.map((medico) => (
                        <tr
                          key={`${rep.nome}-${medico.nome}`}
                          onClick={() => setPainel({ repNome: rep.nome, medico })}
                          className={`cursor-pointer hover:bg-surface-container-high/60 transition-colors ${linhaClasse(medico.status)}`}
                        >
                          <td className="pl-12 pr-6 py-2.5 align-top">
                            <span className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-2 min-w-0">
                                <span className="material-symbols-outlined text-[16px] text-outline shrink-0">
                                  subdirectory_arrow_right
                                </span>
                                <span className="text-xs text-secondary font-semibold truncate">{medico.nome}</span>
                              </span>
                              <span className="flex items-center gap-0.5 text-[11px] text-outline shrink-0">
                                {medico.pacientes.length} pac.
                                <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-2.5 align-top">
                            <ValorQtde valor={medico.metrics.cotacoesValor} qtde={medico.metrics.cotacoesQtde} />
                          </td>
                          <td className="px-4 py-2.5 align-top">
                            <ValorQtde
                              valor={medico.metrics.autorizacoesValor}
                              qtde={medico.metrics.autorizacoesQtde}
                            />
                          </td>
                          <td className="px-4 py-2.5 align-top">
                            <ValorQtde
                              valor={medico.metrics.agendamentosValor}
                              qtde={medico.metrics.agendamentosQtde}
                            />
                          </td>
                          <td className="px-4 py-2.5 align-top">
                            <ValorQtde valor={medico.metrics.cirurgiasValor} qtde={medico.metrics.cirurgiasQtde} />
                          </td>
                        </tr>
                      ))}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {painel && (
        <PainelPacientes
          repNome={painel.repNome}
          medico={painel.medico}
          mesLabel={mesLabel}
          onClose={() => setPainel(null)}
        />
      )}
    </Card>
  )
}
