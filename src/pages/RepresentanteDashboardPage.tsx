import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card } from '../components/ui/Card'
import { statusBadgeClasse, statusFinalIcone } from '../lib/reportMedicoStatus'
import { MESES, componentesIso, deslocarMes, formatarDataBR, hojeIso, paraIso } from '../lib/dateUtils'
import type { SolicitacaoImportada } from '../lib/types'

// Mesmo agrupamento usado no Report Médico (src/pages/ReportMedicoPage.tsx), para que os
// totais deste painel batam com o que o representante vê lá.
const STATUS_EM_ABERTO = ['SOLICITADO', 'PROTOCOLADO']
const STATUS_APROVADAS = ['AUTORIZADO', 'AGENDAMENTO', 'PENDÊNCIA AGENDAMENTO', 'CIRURGIA REALIZADA']
const STATUS_RECUSADAS = ['NEGADO', 'CANCELADO', 'DESISTÊNCIA']

type Linha = Pick<
  SolicitacaoImportada,
  'id' | 'paciente_nome' | 'hospital_nome' | 'data_solicitacao' | 'data_cirurgia' | 'hora_cirurgia' | 'descricao_tipo'
> & { report_medico_status: { status_final: string } | null }

type PeriodoKey = 'mes_atual' | 'ultimo_mes' | '2_meses' | '3_meses' | '4_meses'

const PERIODOS: { key: PeriodoKey; label: string }[] = [
  { key: 'mes_atual', label: 'Mês atual' },
  { key: 'ultimo_mes', label: 'Último mês' },
  { key: '2_meses', label: 'Últimos 2 meses' },
  { key: '3_meses', label: 'Últimos 3 meses' },
  { key: '4_meses', label: 'Últimos 4 meses' },
]

const OFFSET_MESES: Record<Exclude<PeriodoKey, 'ultimo_mes'>, number> = {
  mes_atual: 0,
  '2_meses': 1,
  '3_meses': 2,
  '4_meses': 3,
}

function ultimoDiaDoMes(ano: number, mes0: number): number {
  return new Date(ano, mes0 + 1, 0).getDate()
}

/** Intervalo [de, até] (datas ISO puras) e rótulo em PT-BR para cada opção de período. */
function limitesPeriodo(periodo: PeriodoKey): { de: string; ate: string; rotulo: string } {
  const hoje = componentesIso(hojeIso())

  if (periodo === 'ultimo_mes') {
    const m = deslocarMes(hoje.ano, hoje.mes0, -1)
    return {
      de: paraIso(m.ano, m.mes0, 1),
      ate: paraIso(m.ano, m.mes0, ultimoDiaDoMes(m.ano, m.mes0)),
      rotulo: `${MESES[m.mes0]} ${m.ano}`,
    }
  }

  const offset = OFFSET_MESES[periodo]
  const inicio = deslocarMes(hoje.ano, hoje.mes0, -offset)
  const rotulo =
    offset === 0
      ? `${MESES[hoje.mes0]} ${hoje.ano}`
      : `${MESES[inicio.mes0]} ${inicio.ano} – ${MESES[hoje.mes0]} ${hoje.ano}`

  return { de: paraIso(inicio.ano, inicio.mes0, 1), ate: hojeIso(), rotulo }
}

function statusFinalDe(r: Linha): string {
  return r.report_medico_status?.status_final ?? 'SOLICITADO'
}

export function RepresentanteDashboardPage() {
  const { profile } = useAuth()
  const [periodo, setPeriodo] = useState<PeriodoKey>('mes_atual')
  const [linhas, setLinhas] = useState<Linha[]>([])
  const [loading, setLoading] = useState(true)

  const { de, ate, rotulo } = useMemo(() => limitesPeriodo(periodo), [periodo])

  useEffect(() => {
    if (!profile) return
    setLoading(true)
    supabase
      .from('solicitacoes_importadas')
      .select('id, paciente_nome, hospital_nome, data_solicitacao, data_cirurgia, hora_cirurgia, descricao_tipo, report_medico_status(status_final)')
      .eq('representante_id', profile.id)
      .gte('data_solicitacao', de)
      .lte('data_solicitacao', ate)
      .order('data_solicitacao', { ascending: false })
      .then(({ data }) => {
        setLinhas((data as unknown as Linha[]) ?? [])
        setLoading(false)
      })
  }, [profile, de, ate])

  const tiles = [
    {
      label: 'Total no período',
      value: linhas.length,
      icon: 'assignment',
      iconClass: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Aguardando aprovação',
      value: linhas.filter((r) => STATUS_EM_ABERTO.includes(statusFinalDe(r))).length,
      icon: 'pending_actions',
      iconClass: 'bg-orange-50 text-orange-600',
    },
    {
      label: 'Aprovadas',
      value: linhas.filter((r) => STATUS_APROVADAS.includes(statusFinalDe(r))).length,
      icon: 'check_circle',
      iconClass: 'bg-teal-50 text-teal-600',
    },
    {
      label: 'Recusadas',
      value: linhas.filter((r) => STATUS_RECUSADAS.includes(statusFinalDe(r))).length,
      icon: 'cancel',
      iconClass: 'bg-red-50 text-error',
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-headline font-bold text-3xl text-secondary tracking-tight">
            Olá, {profile?.nome?.split(' ')[0]}
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">Resumo de {rotulo}</p>
        </div>

        <div className="flex flex-wrap gap-1 bg-surface-container-low rounded-lg p-1 shrink-0">
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriodo(p.key)}
              className={`px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                periodo === p.key
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiles.map((tile) => (
          <Card key={tile.label} className="p-6">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${tile.iconClass}`}>
              <span className="material-symbols-outlined text-[20px]">{tile.icon}</span>
            </div>
            <p className="text-on-surface-variant text-xs font-medium mb-1 uppercase tracking-tighter">
              {tile.label}
            </p>
            <h3 className="text-2xl font-headline font-bold text-on-surface">{tile.value}</h3>
          </Card>
        ))}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline font-bold text-lg text-secondary">Solicitações do período</h2>
          <Link to="/solicitacoes" className="text-sm font-semibold text-primary-container hover:underline">
            Ver histórico completo
          </Link>
        </div>

        <Card className="overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-on-surface-variant">Carregando…</p>
          ) : linhas.length === 0 ? (
            <p className="p-6 text-sm text-on-surface-variant">Nenhuma solicitação neste período ainda.</p>
          ) : (
            <ul className="divide-y divide-surface-container-high">
              {linhas.map((r) => {
                const status = statusFinalDe(r)
                const dataCirurgia = r.data_cirurgia
                  ? `${formatarDataBR(r.data_cirurgia)}${r.hora_cirurgia ? ` às ${r.hora_cirurgia.slice(0, 5)}` : ''}`
                  : 'Cirurgia a definir'

                return (
                  <li key={r.id}>
                    <Link
                      to={`/solicitacoes/${r.id}`}
                      className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-surface-container-high/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-on-surface truncate">{r.paciente_nome ?? '—'}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                          {r.hospital_nome ?? r.descricao_tipo ?? '—'} · {dataCirurgia}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 shrink-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${statusBadgeClasse(status)}`}
                      >
                        <span className="material-symbols-outlined text-[12px]">{statusFinalIcone(status)}</span>
                        {status}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </section>
    </div>
  )
}
