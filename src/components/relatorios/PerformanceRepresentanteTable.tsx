import { Fragment, useMemo, useState } from 'react'
import { Card } from '../ui/Card'
import { UsuarioInativoBadge } from '../ui/UsuarioInativoBadge'
import { statusFinalDe } from '../../lib/reportMedicoStatus'
import { hojeIso } from '../../lib/dateUtils'
import type {
  MetaComercial,
  MetaRepresentante,
  ProfileCompleto,
  SolicitacaoImportadaComStatus,
} from '../../lib/types'

// "Cirurgias"/"Parcial"/"Agend."/"Fech. Parcial" replicam a planilha de referência (SAGA
// DIÁRIO.xlsx): data + situação da própria solicitação, não o rastreamento manual em
// report_medico_status — ver o comentário completo (e o porquê da mudança) em RelatoriosPage.tsx.
const SITUACAO_REPROVADA = 'Reprovado'

// "Cot. a Vencer" continua vindo de status_final (SOLICITADO+PROTOCOLADO): é "carteira em
// aberto", sem filtro de mês — não fazia parte da correção acima, que era só sobre os 4 KPIs
// financeiros do mês de referência.
const STATUS_EM_ABERTO = ['SOLICITADO', 'PROTOCOLADO']

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

// Uma cirurgia realizada pode ainda não ter o valor final faturado (`valor_realizado` vem 0
// explícito no banco, nunca null) — usa o valor orçado como estimativa até lá. `||`, não `??`.
function valorRealizadoOuOrcamento(s: SolicitacaoImportadaComStatus): number {
  return s.valor_realizado || s.valor_orcamento || 0
}

const currencyFull = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const currencyCompact = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

function mesKeyDe(dataIso: string): string {
  return dataIso.slice(0, 7)
}

type MedicoLinha = {
  nome: string
  parcial: number
  agendado: number
  fechParcial: number
}

type RepLinha = {
  nome: string
  metaSugerida: number | null
  parcial: number
  agendado: number
  fechParcial: number
  cirurgias: number
  positivados: number
  carteira: number
  cotAVencer: number
  medicos: MedicoLinha[]
}

type SortKey = 'metaSugerida' | 'parcial' | 'agendado' | 'fechParcial' | 'cirurgias' | 'positivados' | 'carteira' | 'cotAVencer'

const COLUNAS: { key: SortKey; label: string }[] = [
  { key: 'metaSugerida', label: 'Meta Sugerida' },
  { key: 'parcial', label: 'Parcial R$' },
  { key: 'agendado', label: 'Agend. R$' },
  { key: 'fechParcial', label: 'Fech. Parcial R$' },
  { key: 'cirurgias', label: 'Cirurgias' },
  { key: 'positivados', label: 'Positivados' },
  { key: 'carteira', label: 'Carteira' },
  { key: 'cotAVencer', label: 'Cot. a Vencer' },
]

function progressoClasse(pct: number | null): string {
  if (pct === null) return 'bg-outline-variant/40'
  if (pct >= 100) return 'bg-tertiary-container'
  if (pct >= 50) return 'bg-[#e8990c]'
  return 'bg-primary'
}

function ValorOuTraco({ valor }: { valor: number | null }) {
  if (valor === null) return <span className="text-on-surface-variant">—</span>
  return <>{currencyFull.format(valor)}</>
}

export function PerformanceRepresentanteTable({
  solicitacoes,
  meta,
  metasRep,
  mesReferencia,
  mesLabel,
  inativos,
}: {
  solicitacoes: SolicitacaoImportadaComStatus[]
  meta: MetaComercial | undefined
  metasRep: MetaRepresentante[]
  mesReferencia: string
  mesLabel: string
  /** Cadastro de perfis por nome (ver useProfilesDirectory), pra sinalizar representante inativo. */
  inativos?: Map<string, Pick<ProfileCompleto, 'ativo'>>
}) {
  const hoje = hojeIso()
  const [sortKey, setSortKey] = useState<SortKey>('fechParcial')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())

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

  const linhas = useMemo<RepLinha[]>(() => {
    const doMes = solicitacoes.filter((s) => s.data_cirurgia && mesKeyDe(s.data_cirurgia) === mesReferencia)

    const nomesRepresentantes = new Set<string>()
    for (const s of solicitacoes) if (s.representante_efetivo_nome) nomesRepresentantes.add(s.representante_efetivo_nome)

    return Array.from(nomesRepresentantes).map((nome) => {
      const doRepNoMes = doMes.filter((s) => s.representante_efetivo_nome === nome)
      const doRepTodoPeriodo = solicitacoes.filter((s) => s.representante_efetivo_nome === nome)

      const realizadasDoRep = doRepNoMes.filter((s) => cirurgiaRealizadaNoMes(s, mesReferencia, hoje))
      const parcial = realizadasDoRep.reduce((soma, s) => soma + valorRealizadoOuOrcamento(s), 0)
      const agendado = doRepNoMes
        .filter((s) => agendadaNoMes(s, mesReferencia, hoje))
        .reduce((soma, s) => soma + (s.valor_orcamento ?? 0), 0)

      const nomesMedicos = new Set(doRepNoMes.map((s) => s.medico_nome).filter((v): v is string => Boolean(v)))
      const medicos: MedicoLinha[] = Array.from(nomesMedicos)
        .map((medicoNome) => {
          const doMedico = doRepNoMes.filter((s) => s.medico_nome === medicoNome)
          const realizadasDoMedico = doMedico.filter((s) => cirurgiaRealizadaNoMes(s, mesReferencia, hoje))
          const parcialMedico = realizadasDoMedico.reduce((soma, s) => soma + valorRealizadoOuOrcamento(s), 0)
          const agendadoMedico = doMedico
            .filter((s) => agendadaNoMes(s, mesReferencia, hoje))
            .reduce((soma, s) => soma + (s.valor_orcamento ?? 0), 0)
          return {
            nome: medicoNome,
            parcial: parcialMedico,
            agendado: agendadoMedico,
            fechParcial: parcialMedico + agendadoMedico,
          }
        })
        .sort((a, b) => b.fechParcial - a.fechParcial)

      const metaDoRep = metasRep.find(
        (m) => m.representante_nome === nome && m.mes_referencia.slice(0, 7) === mesReferencia,
      )

      return {
        nome,
        metaSugerida: metaDoRep?.meta_valor ?? null,
        parcial,
        agendado,
        fechParcial: parcial + agendado,
        cirurgias: realizadasDoRep.length,
        positivados: new Set(realizadasDoRep.map((s) => s.medico_nome).filter(Boolean)).size,
        carteira: doRepTodoPeriodo.length,
        cotAVencer: doRepTodoPeriodo.filter((s) => STATUS_EM_ABERTO.includes(statusFinalDe(s.report_medico_status)))
          .length,
        medicos,
      }
    })
  }, [solicitacoes, metasRep, mesReferencia, hoje])

  const linhasOrdenadas = useMemo(() => {
    const copia = [...linhas]
    copia.sort((a, b) => {
      const va = a[sortKey] ?? -Infinity
      const vb = b[sortKey] ?? -Infinity
      return sortDir === 'desc' ? vb - va : va - vb
    })
    return copia
  }, [linhas, sortKey, sortDir])

  const totais = useMemo(() => {
    const doMes = solicitacoes.filter((s) => s.data_cirurgia && mesKeyDe(s.data_cirurgia) === mesReferencia)
    const realizadas = doMes.filter((s) => cirurgiaRealizadaNoMes(s, mesReferencia, hoje))
    const parcial = realizadas.reduce((soma, s) => soma + valorRealizadoOuOrcamento(s), 0)
    const agendado = doMes
      .filter((s) => agendadaNoMes(s, mesReferencia, hoje))
      .reduce((soma, s) => soma + (s.valor_orcamento ?? 0), 0)
    return {
      metaSugerida: meta?.meta_valor ?? null,
      parcial,
      agendado,
      fechParcial: parcial + agendado,
      cirurgias: realizadas.length,
      positivados: new Set(realizadas.map((s) => s.medico_nome).filter(Boolean)).size,
      carteira: solicitacoes.length,
      cotAVencer: solicitacoes.filter((s) => STATUS_EM_ABERTO.includes(statusFinalDe(s.report_medico_status))).length,
    }
  }, [solicitacoes, meta, mesReferencia, hoje])

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10">
        <div>
          <h2 className="font-headline font-bold text-lg text-secondary">Performance por Representante</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            mês {mesLabel} · clique nos títulos para ordenar
          </p>
        </div>
        <span className="bg-inverse-surface text-inverse-on-surface text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide shrink-0">
          Referência: {mesLabel}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low">
              <th className="px-6 py-3 font-headline font-bold text-[11px] text-on-surface-variant uppercase tracking-widest">
                Representante
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
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high">
            {linhasOrdenadas.length === 0 ? (
              <tr>
                <td colSpan={COLUNAS.length + 1} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                  Nenhum representante com solicitações importadas ainda.
                </td>
              </tr>
            ) : (
              linhasOrdenadas.map((rep) => {
                const expandido = expandidos.has(rep.nome)
                const pct = rep.metaSugerida ? Math.round((rep.fechParcial / rep.metaSugerida) * 100) : null
                return (
                  <Fragment key={rep.nome}>
                    <tr className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="px-6 py-3 align-top">
                        <button
                          type="button"
                          onClick={() => alternarExpandido(rep.nome)}
                          className="flex items-center gap-2 text-left w-full"
                          disabled={rep.medicos.length === 0}
                        >
                          <span className="material-symbols-outlined text-[18px] text-outline shrink-0">
                            {rep.medicos.length === 0 ? '' : expandido ? 'arrow_drop_down' : 'arrow_right'}
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-on-surface uppercase truncate">{rep.nome}</span>
                              {inativos?.get(rep.nome)?.ativo === false && <UsuarioInativoBadge />}
                            </span>
                            <span className="mt-1 block h-1 w-40 max-w-full rounded-full bg-surface-container-high overflow-hidden">
                              <span
                                className={`block h-full rounded-full ${progressoClasse(pct)}`}
                                style={{ width: `${Math.min(100, Math.max(pct ?? 0, 0))}%` }}
                              />
                            </span>
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface align-top">
                        <ValorOuTraco valor={rep.metaSugerida} />
                        {pct !== null && <p className="text-[11px] text-on-surface-variant">{pct}% da meta</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface align-top">{currencyCompact.format(rep.parcial)}</td>
                      <td className="px-4 py-3 text-sm text-on-surface align-top">{currencyCompact.format(rep.agendado)}</td>
                      <td className="px-4 py-3 text-sm font-bold text-on-surface align-top">
                        {currencyCompact.format(rep.fechParcial)}
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface align-top">{rep.cirurgias}</td>
                      <td className="px-4 py-3 align-top">
                        <span className="inline-flex items-center justify-center min-w-[1.75rem] px-1.5 py-0.5 rounded-full bg-tertiary-container/10 text-tertiary-container text-xs font-bold">
                          {rep.positivados}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface align-top">{rep.carteira}</td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant align-top">{rep.cotAVencer || '—'}</td>
                    </tr>
                    {expandido &&
                      rep.medicos.map((medico) => (
                        <tr key={`${rep.nome}-${medico.nome}`} className="bg-surface-container-low/40">
                          <td className="pl-12 pr-6 py-2.5">
                            <span className="flex items-center gap-2 text-xs text-secondary font-semibold">
                              <span className="material-symbols-outlined text-[16px] text-outline">subdirectory_arrow_right</span>
                              {medico.nome}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-on-surface-variant">—</td>
                          <td className="px-4 py-2.5 text-xs text-on-surface-variant">{currencyCompact.format(medico.parcial)}</td>
                          <td className="px-4 py-2.5 text-xs text-on-surface-variant">{currencyCompact.format(medico.agendado)}</td>
                          <td className="px-4 py-2.5 text-xs font-semibold text-on-surface">
                            {currencyCompact.format(medico.fechParcial)}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-on-surface-variant">—</td>
                          <td className="px-4 py-2.5 text-xs text-on-surface-variant">—</td>
                          <td className="px-4 py-2.5 text-xs text-on-surface-variant">—</td>
                          <td className="px-4 py-2.5 text-xs text-on-surface-variant">—</td>
                        </tr>
                      ))}
                  </Fragment>
                )
              })
            )}
          </tbody>
          {linhasOrdenadas.length > 0 && (
            <tfoot>
              <tr className="bg-surface-container-high/60 border-t-2 border-outline-variant/20">
                <td className="px-6 py-3 text-sm font-black text-secondary uppercase">Gynmed</td>
                <td className="px-4 py-3 text-sm font-bold text-on-surface">
                  <ValorOuTraco valor={totais.metaSugerida} />
                </td>
                <td className="px-4 py-3 text-sm font-bold text-on-surface">{currencyCompact.format(totais.parcial)}</td>
                <td className="px-4 py-3 text-sm font-bold text-on-surface">{currencyCompact.format(totais.agendado)}</td>
                <td className="px-4 py-3 text-sm font-black text-on-surface">
                  {currencyCompact.format(totais.fechParcial)}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-on-surface">{totais.cirurgias}</td>
                <td className="px-4 py-3 text-sm font-bold text-on-surface">{totais.positivados}</td>
                <td className="px-4 py-3 text-sm font-bold text-on-surface">{totais.carteira}</td>
                <td className="px-4 py-3 text-sm font-bold text-on-surface">{totais.cotAVencer || '—'}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Card>
  )
}
