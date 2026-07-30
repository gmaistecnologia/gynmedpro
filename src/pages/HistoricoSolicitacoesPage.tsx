import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/StatusBadge'
import type { SolicitacaoComRelacoes, StatusSolicitacao } from '../lib/types'

const STATUS_FILTERS: { value: StatusSolicitacao | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'aprovado_gerente', label: 'Aprovado' },
  { value: 'recusado', label: 'Recusado' },
  { value: 'faturado', label: 'Faturado' },
]

export function HistoricoSolicitacoesPage() {
  const { profile } = useAuth()
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoComRelacoes[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusSolicitacao | 'todos'>('todos')

  const isGestor = profile?.role === 'gerente_comercial' || profile?.role === 'admin'

  useEffect(() => {
    supabase
      .from('solicitacoes_cirurgicas')
      .select('*, hospitais(id, nome_fantasia, cidade, uf), profiles(id, nome), itens_solicitados(*, produtos(*))')
      .order('data_cirurgia', { ascending: false })
      .then(({ data }) => {
        setSolicitacoes((data as SolicitacaoComRelacoes[]) ?? [])
        setLoading(false)
      })
  }, [])

  const filtradas = useMemo(() => {
    return solicitacoes.filter((s) => {
      if (statusFilter !== 'todos' && s.status !== statusFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return s.paciente_nome.toLowerCase().includes(q) || s.medico_cirurgiao.toLowerCase().includes(q)
      }
      return true
    })
  }, [solicitacoes, search, statusFilter])

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline font-bold text-3xl text-secondary tracking-tight">
          {isGestor ? 'Solicitações' : 'Meu Histórico'}
        </h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          {isGestor
            ? 'Todas as solicitações cirúrgicas do time comercial.'
            : 'Acompanhe o status de tudo o que você já solicitou.'}
        </p>
      </header>

      <Card className="p-5 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar paciente ou médico…"
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-transparent rounded-lg text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusSolicitacao | 'todos')}
          className="bg-surface-container-low border-transparent rounded-lg text-sm font-medium py-2.5 px-4 focus:ring-2 focus:ring-primary/10"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest">
                  Paciente
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest">
                  Status
                </th>
                {isGestor && (
                  <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest">
                    Representante
                  </th>
                )}
                <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest">
                  Médico
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest">
                  Hospital
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest">
                  Data da Cirurgia
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                    Carregando…
                  </td>
                </tr>
              ) : filtradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                    Nenhuma solicitação encontrada.
                  </td>
                </tr>
              ) : (
                filtradas.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-container-high/40 transition-colors group">
                    <td className="px-6 py-4">
                      <Link to={`/solicitacoes/${s.id}`} className="font-semibold text-sm text-secondary group-hover:underline">
                        {s.paciente_nome}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={s.status} />
                    </td>
                    {isGestor && (
                      <td className="px-6 py-4 text-sm text-on-surface-variant">{s.profiles?.nome ?? '—'}</td>
                    )}
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{s.medico_cirurgiao}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{s.hospitais?.nome_fantasia ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {s.data_cirurgia ? format(new Date(s.data_cirurgia), "dd/MM/yyyy 'às' HH:mm") : 'A definir'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
