import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { endOfMonth, format, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/StatusBadge'
import type { SolicitacaoComRelacoes } from '../lib/types'

type StatTile = {
  label: string
  value: number
  icon: string
  iconClass: string
}

export function RepresentanteDashboardPage() {
  const { profile } = useAuth()
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoComRelacoes[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    const from = startOfMonth(new Date()).toISOString()
    const to = endOfMonth(new Date()).toISOString()

    supabase
      .from('solicitacoes_cirurgicas')
      .select('*, hospitais(id, nome_fantasia, cidade, uf), profiles(id, nome), itens_solicitados(*, produtos(*))')
      .eq('representante_id', profile.id)
      .gte('criado_em', from)
      .lte('criado_em', to)
      .order('criado_em', { ascending: false })
      .then(({ data }) => {
        setSolicitacoes((data as SolicitacaoComRelacoes[]) ?? [])
        setLoading(false)
      })
  }, [profile])

  const tiles: StatTile[] = [
    {
      label: 'Total no mês',
      value: solicitacoes.length,
      icon: 'assignment',
      iconClass: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Aguardando aprovação',
      value: solicitacoes.filter((s) => s.status === 'enviado').length,
      icon: 'pending_actions',
      iconClass: 'bg-orange-50 text-orange-600',
    },
    {
      label: 'Aprovadas',
      value: solicitacoes.filter((s) => s.status === 'aprovado_gerente' || s.status === 'faturado').length,
      icon: 'check_circle',
      iconClass: 'bg-teal-50 text-teal-600',
    },
    {
      label: 'Recusadas',
      value: solicitacoes.filter((s) => s.status === 'recusado').length,
      icon: 'cancel',
      iconClass: 'bg-red-50 text-error',
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-headline font-bold text-3xl text-secondary tracking-tight">
          Olá, {profile?.nome?.split(' ')[0]}
        </h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          Resumo de {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
        </p>
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
          <h2 className="font-headline font-bold text-lg text-secondary">Solicitações do mês</h2>
          <Link to="/solicitacoes" className="text-sm font-semibold text-primary-container hover:underline">
            Ver histórico completo
          </Link>
        </div>

        <Card className="overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-on-surface-variant">Carregando…</p>
          ) : solicitacoes.length === 0 ? (
            <p className="p-6 text-sm text-on-surface-variant">Nenhuma solicitação criada neste mês ainda.</p>
          ) : (
            <ul className="divide-y divide-surface-container-high">
              {solicitacoes.map((s) => (
                <li key={s.id}>
                  <Link
                    to={`/solicitacoes/${s.id}`}
                    className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-surface-container-high/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-on-surface truncate">{s.paciente_nome}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                        {s.hospitais?.nome_fantasia} ·{' '}
                        {s.data_cirurgia ? format(new Date(s.data_cirurgia), "dd/MM/yyyy 'às' HH:mm") : 'Data a definir'}
                      </p>
                    </div>
                    <StatusBadge status={s.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  )
}
