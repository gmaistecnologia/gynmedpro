import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Cell,
  Line,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card } from '../components/ui/Card'
import { StatTile } from '../components/ui/StatTile'
import { MonthReferenceSelect } from '../components/ui/MonthReferenceSelect'
import { MultiSelectField } from '../components/ui/MultiSelectField'
import { PerformanceRepresentanteTable } from '../components/relatorios/PerformanceRepresentanteTable'
import { PipelineComercialTable } from '../components/relatorios/PipelineComercialTable'
import type { SolicitacaoImportada, MetaComercial, MetaRepresentante } from '../lib/types'

const BRAND = '#1271d8'
const AXIS_TICK = { fontSize: 12, fill: '#727784', fontFamily: 'Inter' }
const GRID_COLOR = '#e1e3e4'

// Situações que representam cirurgias efetivamente realizadas (faturadas ou sem número de
// orçamento formal, mas já concluídas). "Aprovado" ainda não é uma cirurgia realizada — é
// pipeline (agendado/aprovado, aguardando faturamento). "Vencido"/"A vencer" nunca aconteceram.
const SITUACOES_REALIZADAS = ['Faturado', 'Cirurgia realizada']

const MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']

function mesRefAtual(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function mesKeyDe(dataIso: string): string {
  return dataIso.slice(0, 7)
}

function mesLabel(mesKey: string): string {
  const [ano, mes] = mesKey.split('-')
  return `${MESES_ABREV[Number(mes) - 1]} ${ano.slice(2)}`
}

function primeiroDiaDoMes(mesKey: string): string {
  return `${mesKey}-01`
}

function formatCompactBRL(valor: number): string {
  if (Math.abs(valor) >= 1_000_000) {
    return `R$ ${(valor / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mi`
  }
  if (Math.abs(valor) >= 1_000) {
    return `R$ ${Math.round(valor / 1000).toLocaleString('pt-BR')} mil`
  }
  return `R$ ${valor.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
}

const currencyFull = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

type ChartTooltipProps = {
  active?: boolean
  label?: string
  payload?: Array<{ dataKey?: string; value?: number }>
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const valor = payload.find((p) => p.dataKey === 'valor')?.value ?? 0
  const qtde = payload.find((p) => p.dataKey === 'qtde')?.value ?? 0
  return (
    <div className="bg-surface-container-lowest elevation-ambient rounded-lg px-4 py-3 text-sm">
      <p className="text-xs font-bold text-outline uppercase tracking-wide mb-1">{label}</p>
      <p className="font-bold text-on-surface">{currencyFull.format(valor)}</p>
      <p className="text-xs text-on-surface-variant">{qtde} cirurgias</p>
    </div>
  )
}

export function RelatoriosPage() {
  const { profile } = useAuth()
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoImportada[]>([])
  const [metas, setMetas] = useState<MetaComercial[]>([])
  const [metasRep, setMetasRep] = useState<MetaRepresentante[]>([])
  const [loading, setLoading] = useState(true)

  const [mesReferenciaSelecionada, setMesReferenciaSelecionada] = useState('')
  const [representantes, setRepresentantes] = useState<string[]>([])
  const [procedimentos, setProcedimentos] = useState<string[]>([])
  const [medicos, setMedicos] = useState<string[]>([])
  const [convenios, setConvenios] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const [{ data: solicitacoesData }, { data: metasData }, { data: metasRepData }] = await Promise.all([
        supabase
          .from('solicitacoes_importadas')
          .select(
            'data_cirurgia, situacao, valor_realizado, valor_orcamento, representante_nome, descricao_tipo, medico_nome, plano_saude_nome',
          ),
        supabase.from('metas_comerciais').select('*'),
        supabase.from('metas_representantes').select('*'),
      ])
      setSolicitacoes((solicitacoesData as SolicitacaoImportada[]) ?? [])
      setMetas((metasData as MetaComercial[]) ?? [])
      setMetasRep((metasRepData as MetaRepresentante[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const mesesDisponiveis = useMemo(() => {
    const chaves = new Set<string>()
    for (const s of solicitacoes) {
      if (s.data_cirurgia) chaves.add(mesKeyDe(s.data_cirurgia))
    }
    return Array.from(chaves).sort()
  }, [solicitacoes])

  const mesReferencia = useMemo(() => {
    if (mesReferenciaSelecionada) return mesReferenciaSelecionada
    if (mesesDisponiveis.length === 0) return ''
    const atual = mesRefAtual()
    return mesesDisponiveis.includes(atual) ? atual : mesesDisponiveis[mesesDisponiveis.length - 1]
  }, [mesesDisponiveis, mesReferenciaSelecionada])

  const opcoes = useMemo(() => {
    const representantesSet = new Set<string>()
    const procedimentosSet = new Set<string>()
    const medicosSet = new Set<string>()
    const conveniosSet = new Set<string>()
    for (const s of solicitacoes) {
      if (s.representante_nome) representantesSet.add(s.representante_nome)
      if (s.descricao_tipo) procedimentosSet.add(s.descricao_tipo)
      if (s.medico_nome) medicosSet.add(s.medico_nome)
      if (s.plano_saude_nome) conveniosSet.add(s.plano_saude_nome)
    }
    const paraOpcoes = (valores: Set<string>) =>
      Array.from(valores)
        .sort()
        .map((v) => ({ value: v, label: v }))
    return {
      representantes: paraOpcoes(representantesSet),
      procedimentos: paraOpcoes(procedimentosSet),
      medicos: paraOpcoes(medicosSet),
      convenios: paraOpcoes(conveniosSet),
    }
  }, [solicitacoes])

  const filtradas = useMemo(() => {
    return solicitacoes.filter((s) => {
      if (representantes.length > 0 && !representantes.includes(s.representante_nome ?? '')) return false
      if (procedimentos.length > 0 && !procedimentos.includes(s.descricao_tipo ?? '')) return false
      if (medicos.length > 0 && !medicos.includes(s.medico_nome ?? '')) return false
      if (convenios.length > 0 && !convenios.includes(s.plano_saude_nome ?? '')) return false
      return true
    })
  }, [solicitacoes, representantes, procedimentos, medicos, convenios])

  const dadosGrafico = useMemo(() => {
    if (mesesDisponiveis.length === 0) return []
    const [anoIni, mesIni] = mesesDisponiveis[0].split('-').map(Number)
    const [anoFim, mesFim] = mesesDisponiveis[mesesDisponiveis.length - 1].split('-').map(Number)

    const chaves: string[] = []
    let ano = anoIni
    let mes = mesIni
    while (ano < anoFim || (ano === anoFim && mes <= mesFim)) {
      chaves.push(`${ano}-${String(mes).padStart(2, '0')}`)
      mes += 1
      if (mes > 12) {
        mes = 1
        ano += 1
      }
    }

    const porMes = new Map<string, { valor: number; qtde: number }>()
    for (const chave of chaves) porMes.set(chave, { valor: 0, qtde: 0 })

    for (const s of filtradas) {
      if (!s.data_cirurgia || !s.situacao || !SITUACOES_REALIZADAS.includes(s.situacao)) continue
      const chave = mesKeyDe(s.data_cirurgia)
      const bucket = porMes.get(chave)
      if (!bucket) continue
      bucket.valor += s.valor_realizado ?? 0
      bucket.qtde += 1
    }

    return chaves.map((chave) => ({
      mes: mesLabel(chave),
      chave,
      valor: porMes.get(chave)!.valor,
      qtde: porMes.get(chave)!.qtde,
    }))
  }, [filtradas, mesesDisponiveis])

  const doMes = useMemo(() => {
    return filtradas.filter((s) => s.data_cirurgia && mesKeyDe(s.data_cirurgia) === mesReferencia)
  }, [filtradas, mesReferencia])

  const realizadasDoMes = useMemo(
    () => doMes.filter((s) => s.situacao && SITUACOES_REALIZADAS.includes(s.situacao)),
    [doMes],
  )

  const parcialValor = useMemo(
    () => realizadasDoMes.reduce((soma, s) => soma + (s.valor_realizado ?? 0), 0),
    [realizadasDoMes],
  )

  const fechParcialValor = useMemo(() => {
    const aprovadoPipeline = doMes
      .filter((s) => s.situacao === 'Aprovado')
      .reduce((soma, s) => soma + (s.valor_orcamento ?? 0), 0)
    return parcialValor + aprovadoPipeline
  }, [doMes, parcialValor])

  const cirurgiasCount = realizadasDoMes.length

  const medicosPositivados = useMemo(
    () => new Set(realizadasDoMes.map((s) => s.medico_nome).filter(Boolean)).size,
    [realizadasDoMes],
  )

  const representantesDoMes = useMemo(
    () => new Set(doMes.map((s) => s.representante_nome).filter(Boolean)).size,
    [doMes],
  )

  const meta = useMemo(
    () => metas.find((m) => m.mes_referencia === primeiroDiaDoMes(mesReferencia)),
    [metas, mesReferencia],
  )

  const parcialPct = meta && meta.meta_valor > 0 ? Math.round((parcialValor / meta.meta_valor) * 100) : null
  const fechParcialPct = meta && meta.meta_valor > 0 ? Math.round((fechParcialValor / meta.meta_valor) * 100) : null

  function limparFiltros() {
    setRepresentantes([])
    setProcedimentos([])
    setMedicos([])
    setConvenios([])
  }

  if (loading) {
    return <p className="text-sm text-on-surface-variant">Carregando…</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline font-bold text-3xl text-secondary tracking-tight">Painel Comercial</h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          Desempenho comercial com base nas solicitações importadas.
        </p>
      </header>

      <Card className="p-5 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5 min-w-[190px]">
          <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Mês Referência</label>
          <MonthReferenceSelect
            options={mesesDisponiveis}
            value={mesReferencia}
            onChange={setMesReferenciaSelecionada}
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-[160px] flex-1">
          <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Representante</label>
          <MultiSelectField
            options={opcoes.representantes}
            selected={representantes}
            onChange={setRepresentantes}
            searchPlaceholder="Buscar representante…"
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-[160px] flex-1">
          <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Procedimento</label>
          <MultiSelectField
            options={opcoes.procedimentos}
            selected={procedimentos}
            onChange={setProcedimentos}
            searchPlaceholder="Buscar procedimento…"
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-[160px] flex-1">
          <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Médico</label>
          <MultiSelectField
            options={opcoes.medicos}
            selected={medicos}
            onChange={setMedicos}
            searchPlaceholder="Buscar médico…"
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-[160px] flex-1">
          <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Convênio</label>
          <MultiSelectField
            options={opcoes.convenios}
            selected={convenios}
            onChange={setConvenios}
            searchPlaceholder="Buscar convênio…"
          />
        </div>

        <button
          type="button"
          onClick={limparFiltros}
          className="bg-surface-container-high text-secondary hover:bg-surface-container-highest rounded-lg text-sm font-semibold py-2.5 px-5 h-[46px] transition-colors shrink-0"
        >
          Limpar
        </button>
      </Card>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatTile
          label="Meta Sugerida"
          value={meta ? formatCompactBRL(meta.meta_valor) : '—'}
          sublabel={
            meta ? `${representantesDoMes} representantes` : 'Defina em Configurações'
          }
          dotClass="bg-primary"
        />
        <StatTile
          label={`Parcial · ${mesLabel(mesReferencia || mesRefAtual())}`}
          value={formatCompactBRL(parcialValor)}
          sublabel={parcialPct !== null ? `${parcialPct}% da meta` : 'Meta não definida'}
          dotClass="bg-tertiary"
        />
        <StatTile
          label="Fech. Parcial"
          value={formatCompactBRL(fechParcialValor)}
          sublabel={
            fechParcialPct !== null ? `${fechParcialPct}% da meta · Cir.totais + Agend.` : 'Cir.totais + Agend.'
          }
          dotClass="bg-on-surface"
        />
        <StatTile
          label={`Cirurgias · ${mesLabel(mesReferencia || mesRefAtual())}`}
          value={String(cirurgiasCount)}
          sublabel={`${medicosPositivados} médicos positivados`}
          dotClass="bg-tertiary-container"
        />
      </section>

      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-headline font-bold text-lg text-secondary">
              Evolução mês a mês · Cirurgias realizadas
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Valor de cirurgias totais (barras) e quantidade de cirurgias (linha)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-on-surface-variant shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-secondary inline-block" /> Valor R$
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e8990c] inline-block" /> Qtde cirurgias
            </span>
          </div>
        </div>

        {dadosGrafico.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-12 text-center">
            Nenhuma cirurgia realizada registrada ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <ResponsiveContainer width="100%" height={360} minWidth={Math.max(dadosGrafico.length * 55, 600)}>
              <ComposedChart data={dadosGrafico} margin={{ left: -10, top: 20 }}>
                <CartesianGrid strokeDasharray="0" stroke={GRID_COLOR} vertical={false} />
                <XAxis dataKey="mes" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_COLOR }} />
                <YAxis
                  yAxisId="valor"
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                  tickFormatter={(v) => formatCompactBRL(v)}
                />
                <YAxis yAxisId="qtde" orientation="right" hide domain={[0, 'dataMax + 40']} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: BRAND, fillOpacity: 0.05 }} />
                <Bar yAxisId="valor" dataKey="valor" name="Valor R$" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {dadosGrafico.map((entry) => (
                    <Cell key={entry.chave} fill={entry.chave === mesReferencia ? BRAND : '#1c2340'} />
                  ))}
                </Bar>
                <Line
                  yAxisId="qtde"
                  dataKey="qtde"
                  name="Qtde cirurgias"
                  stroke="#e8990c"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#e8990c', strokeWidth: 0 }}
                  isAnimationActive={false}
                >
                  <LabelList dataKey="qtde" position="top" fontSize={11} fontWeight={700} fill="#c8770a" />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {profile?.role === 'admin' && (
        <PerformanceRepresentanteTable
          solicitacoes={solicitacoes}
          meta={meta}
          metasRep={metasRep}
          mesReferencia={mesReferencia}
          mesLabel={mesLabel(mesReferencia || mesRefAtual())}
        />
      )}

      {profile?.role === 'admin' && (
        <PipelineComercialTable
          solicitacoes={solicitacoes}
          mesReferencia={mesReferencia}
          mesLabel={mesLabel(mesReferencia || mesRefAtual())}
        />
      )}
    </div>
  )
}
