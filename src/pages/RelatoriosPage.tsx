import { useEffect, useMemo, useState } from 'react'
import { format, startOfWeek } from 'date-fns'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import type { SolicitacaoComRelacoes } from '../lib/types'

const BRAND = '#1271d8'
const AXIS_TICK = { fontSize: 12, fill: '#727784', fontFamily: 'Inter' }
const GRID_COLOR = '#e1e3e4'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

function ChartTooltip({ active, payload, label, valueFormatter }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-container-lowest elevation-ambient rounded-lg px-4 py-3 text-sm">
      <p className="text-xs font-bold text-outline uppercase tracking-wide mb-1">{label}</p>
      <p className="font-bold text-on-surface">
        {valueFormatter ? valueFormatter(payload[0].value) : payload[0].value}
      </p>
    </div>
  )
}

function StatTile({ label, value, icon, iconClass }: { label: string; value: string; icon: string; iconClass: string }) {
  return (
    <Card className="p-6">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${iconClass}`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <p className="text-on-surface-variant text-xs font-medium mb-1 uppercase tracking-tighter">{label}</p>
      <h3 className="text-2xl font-headline font-bold text-on-surface">{value}</h3>
    </Card>
  )
}

export function RelatoriosPage() {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoComRelacoes[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('solicitacoes_cirurgicas')
      .select('*, hospitais(nome_fantasia), profiles(nome), itens_solicitados(quantidade_estimada, produtos(preco_tabela))')
      .then(({ data }) => {
        setSolicitacoes((data as SolicitacaoComRelacoes[]) ?? [])
        setLoading(false)
      })
  }, [])

  const aprovadas = useMemo(
    () => solicitacoes.filter((s) => s.status === 'aprovado_gerente' || s.status === 'faturado'),
    [solicitacoes],
  )
  const recusadas = useMemo(() => solicitacoes.filter((s) => s.status === 'recusado'), [solicitacoes])

  const taxaAprovacao =
    aprovadas.length + recusadas.length === 0 ? 0 : (aprovadas.length / (aprovadas.length + recusadas.length)) * 100

  const porHospital = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of solicitacoes) {
      const nome = s.hospitais?.nome_fantasia ?? 'Não informado'
      map.set(nome, (map.get(nome) ?? 0) + 1)
    }
    return Array.from(map, ([hospital, total]) => ({ hospital, total })).sort((a, b) => b.total - a.total)
  }, [solicitacoes])

  const porRepresentante = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of aprovadas) {
      const nome = s.profiles?.nome ?? 'Não informado'
      map.set(nome, (map.get(nome) ?? 0) + 1)
    }
    return Array.from(map, ([representante, total]) => ({ representante, total })).sort((a, b) => b.total - a.total)
  }, [aprovadas])

  const previsaoFaturamento = useMemo(() => {
    const now = new Date()
    const map = new Map<string, { weekStart: Date; valor: number }>()
    for (const s of aprovadas) {
      if (!s.data_cirurgia) continue
      const dataCirurgia = new Date(s.data_cirurgia)
      if (dataCirurgia < now) continue
      const weekStart = startOfWeek(dataCirurgia, { weekStartsOn: 1 })
      const key = weekStart.toISOString()
      const valor = s.itens_solicitados.reduce(
        (sum, item) => sum + (item.produtos?.preco_tabela ?? 0) * item.quantidade_estimada,
        0,
      )
      const current = map.get(key)
      map.set(key, { weekStart, valor: (current?.valor ?? 0) + valor })
    }
    return Array.from(map.values())
      .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
      .map((entry) => ({ semana: format(entry.weekStart, 'dd/MM'), valor: entry.valor }))
  }, [aprovadas])

  const faturamentoTotal = previsaoFaturamento.reduce((sum, item) => sum + item.valor, 0)

  if (loading) {
    return <p className="text-sm text-on-surface-variant">Carregando…</p>
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-headline font-bold text-3xl text-secondary tracking-tight">Relatórios Comerciais</h1>
        <p className="text-on-surface-variant mt-1 text-sm">Desempenho do time comercial e previsão de faturamento.</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatTile label="Total de Solicitações" value={String(solicitacoes.length)} icon="assignment" iconClass="bg-blue-50 text-blue-600" />
        <StatTile label="Aprovadas" value={String(aprovadas.length)} icon="check_circle" iconClass="bg-teal-50 text-teal-600" />
        <StatTile label="Taxa de Aprovação" value={`${taxaAprovacao.toFixed(0)}%`} icon="analytics" iconClass="bg-blue-50 text-blue-700" />
        <StatTile
          label="Faturamento Previsto"
          value={currency.format(faturamentoTotal)}
          icon="payments"
          iconClass="bg-orange-50 text-orange-600"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-8">
          <h2 className="font-headline font-bold text-lg text-secondary mb-6">Volume de Cirurgias por Hospital</h2>
          {porHospital.length === 0 ? (
            <p className="text-sm text-on-surface-variant py-12 text-center">Nenhuma solicitação registrada ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={porHospital} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="0" stroke={GRID_COLOR} vertical={false} />
                <XAxis dataKey="hospital" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_COLOR }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: BRAND, fillOpacity: 0.05 }} />
                <Bar dataKey="total" name="Solicitações" fill={BRAND} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-8">
          <h2 className="font-headline font-bold text-lg text-secondary mb-6">Ranking de Vendas por Representante</h2>
          {porRepresentante.length === 0 ? (
            <p className="text-sm text-on-surface-variant py-12 text-center">Nenhuma cirurgia aprovada ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={porRepresentante} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="0" stroke={GRID_COLOR} horizontal={false} />
                <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_COLOR }} allowDecimals={false} />
                <YAxis dataKey="representante" type="category" tick={AXIS_TICK} tickLine={false} axisLine={false} width={120} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: BRAND, fillOpacity: 0.05 }} />
                <Bar dataKey="total" name="Cirurgias aprovadas" fill={BRAND} radius={[0, 4, 4, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </section>

      <Card className="p-8">
        <h2 className="font-headline font-bold text-lg text-secondary mb-6">
          Previsão de Faturamento — Próximas Semanas
        </h2>
        {previsaoFaturamento.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-12 text-center">
            Nenhuma cirurgia aprovada com data futura no momento.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={previsaoFaturamento} margin={{ left: -10 }}>
              <defs>
                <linearGradient id="faturamentoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={BRAND} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="semana" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_COLOR }} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => currency.format(v)} width={90} />
              <Tooltip content={<ChartTooltip valueFormatter={currency.format} />} />
              <Area type="monotone" dataKey="valor" name="Faturamento previsto" stroke={BRAND} strokeWidth={2} fill="url(#faturamentoGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}
