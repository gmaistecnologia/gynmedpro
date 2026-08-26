import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import { StatTile } from '../components/ui/StatTile'
import { MultiSelectField } from '../components/ui/MultiSelectField'
import { DateRangeField } from '../components/ui/DateRangeField'
import { Avatar } from '../components/ui/Avatar'
import { UsuarioInativoBadge } from '../components/ui/UsuarioInativoBadge'
import { statusBadgeClasse, statusFinalIcone } from '../lib/reportMedicoStatus'
import {
  TIPOS_ATIVIDADE,
  formatarDataHoraBR,
  formatarValorAtividade,
  metaDoTipo,
  tempoRelativo,
  type AtividadeLog,
} from '../lib/atividades'
import { adicionarDiasIso, hojeIso } from '../lib/dateUtils'
import type { ProfileCompleto } from '../lib/types'

const TAMANHO_PAGINA = 50

type Filtros = {
  usuarios: string[]
  tipos: string[]
  de: string
  ate: string
  busca: string
}

// Espelha os mesmos critérios da consulta ao servidor (efeito acima), pra decidir se um evento
// que chega ao vivo pertence à visão filtrada atual antes de injetá-lo na lista — sem isso, o
// realtime mostrava a atividade de QUALQUER usuário mesmo com o filtro de Usuário/Tipo/Período/
// Paciente restringindo a tela a outra pessoa.
function logCombinaComFiltros(log: AtividadeLog, filtros: Filtros): boolean {
  if (filtros.usuarios.length && !(log.usuario_id && filtros.usuarios.includes(log.usuario_id))) return false
  if (filtros.tipos.length && !filtros.tipos.includes(log.tipo)) return false
  const criadoEm = new Date(log.criado_em).getTime()
  if (filtros.de && criadoEm < new Date(`${filtros.de}T00:00:00`).getTime()) return false
  if (filtros.ate && criadoEm > new Date(`${filtros.ate}T23:59:59.999`).getTime()) return false
  if (filtros.busca && !(log.paciente_nome ?? '').toLowerCase().includes(filtros.busca.toLowerCase())) return false
  return true
}

function filtrosPadrao(): Filtros {
  // Últimos 30 dias: janela suficiente para auditar a operação do mês sem puxar o log inteiro.
  return { usuarios: [], tipos: [], de: adicionarDiasIso(hojeIso(), -29), ate: hojeIso(), busca: '' }
}

// Valor "antes" → "depois" de uma linha do log. Status ganha o mesmo badge colorido do resto do
// sistema; os demais tipos ficam em texto simples.
function ValorAtividade({ tipo, valor, esmaecido }: { tipo: string; valor: string | null; esmaecido?: boolean }) {
  const texto = formatarValorAtividade(tipo, valor)

  if (tipo === 'status_final' && valor) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${statusBadgeClasse(valor)} ${esmaecido ? 'opacity-60' : ''}`}
      >
        <span className="material-symbols-outlined text-[12px]">{statusFinalIcone(valor)}</span>
        {valor}
      </span>
    )
  }

  return (
    <span className={`text-xs ${esmaecido ? 'text-outline line-through' : 'text-on-surface'} break-words`}>
      {texto}
    </span>
  )
}

export function AtividadesPage() {
  const [logs, setLogs] = useState<AtividadeLog[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [usuarios, setUsuarios] = useState<ProfileCompleto[]>([])
  const [filtros, setFiltros] = useState<Filtros>(filtrosPadrao)
  const [buscaInput, setBuscaInput] = useState('')
  const [pagina, setPagina] = useState(1)
  const [novasAoVivo, setNovasAoVivo] = useState(0)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('nome')
      .then(({ data }) => setUsuarios((data as ProfileCompleto[] | null) ?? []))
  }, [])

  // Debounce da busca por paciente — evita um request por tecla.
  useEffect(() => {
    const t = setTimeout(() => setFiltros((prev) => ({ ...prev, busca: buscaInput.trim() })), 300)
    return () => clearTimeout(t)
  }, [buscaInput])

  // Mudar filtro volta pra primeira página e reacende o "Carregando…". Comparação em tempo de
  // render (e não um efeito reagindo a [filtros]) é o padrão já usado em Solicitações — evita o
  // re-render em cascata de um setState síncrono dentro de efeito.
  const [consultaAnterior, setConsultaAnterior] = useState({ filtros, pagina })
  if (consultaAnterior.filtros !== filtros) {
    setConsultaAnterior({ filtros, pagina: 1 })
    setPagina(1)
    setLoading(true)
  } else if (consultaAnterior.pagina !== pagina) {
    setConsultaAnterior({ filtros, pagina })
    setLoading(true)
  }

  useEffect(() => {
    let cancelado = false

    // Filtros primeiro, ordenação/paginação por último — depois de `.order()`/`.range()` o
    // builder do supabase-js não aceita mais `.in()`/`.ilike()`.
    let query = supabase.from('atividades_log').select('*', { count: 'exact' })

    if (filtros.usuarios.length) query = query.in('usuario_id', filtros.usuarios)
    if (filtros.tipos.length) query = query.in('tipo', filtros.tipos)
    if (filtros.de) query = query.gte('criado_em', `${filtros.de}T00:00:00`)
    if (filtros.ate) query = query.lte('criado_em', `${filtros.ate}T23:59:59.999`)
    if (filtros.busca) query = query.ilike('paciente_nome', `%${filtros.busca}%`)

    query
      .order('criado_em', { ascending: false })
      .range((pagina - 1) * TAMANHO_PAGINA, pagina * TAMANHO_PAGINA - 1)
      .then(({ data, error, count }) => {
        if (cancelado) return
        if (error) {
          toast.error('Não foi possível carregar o registro de atividades.')
        } else {
          setLogs((data as AtividadeLog[] | null) ?? [])
          setTotalCount(count ?? 0)
          setNovasAoVivo(0)
        }
        setLoading(false)
      })

    return () => {
      cancelado = true
    }
  }, [filtros, pagina])

  // Novas atividades chegam por realtime. Na primeira página elas entram direto no topo (o admin
  // vê o representante trabalhando ao vivo); nas demais, só contamos para não embaralhar a
  // paginação embaixo do cursor de quem está lendo.
  useEffect(() => {
    const canal = supabase
      .channel('atividades-log-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'atividades_log' }, (payload) => {
        const nova = payload.new as AtividadeLog
        if (!logCombinaComFiltros(nova, filtros)) return
        if (pagina !== 1) {
          setNovasAoVivo((n) => n + 1)
          return
        }
        setLogs((prev) => {
          if (prev.some((l) => l.id === nova.id)) return prev
          return [nova, ...prev].slice(0, TAMANHO_PAGINA)
        })
        setTotalCount((c) => c + 1)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [pagina, filtros])

  const opcoesUsuarios = useMemo(
    () => usuarios.map((u) => ({ value: u.id, label: u.nome })),
    [usuarios],
  )
  const opcoesTipos = useMemo(
    () => TIPOS_ATIVIDADE.map((t) => ({ value: t.value, label: t.label, icon: t.icon })),
    [],
  )

  const acessos = useMemo(
    () =>
      [...usuarios]
        .filter((u) => u.role !== 'admin' || u.ultimo_login)
        .sort((a, b) => (b.ultimo_login ?? '').localeCompare(a.ultimo_login ?? '')),
    [usuarios],
  )

  const stats = useMemo(() => {
    const alteracoes = logs.filter((l) => l.tipo !== 'login').length
    const logins = logs.filter((l) => l.tipo === 'login').length
    const pessoas = new Set(logs.map((l) => l.usuario_id).filter(Boolean)).size
    return { alteracoes, logins, pessoas }
  }, [logs])

  const totalPaginas = Math.max(1, Math.ceil(totalCount / TAMANHO_PAGINA))

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline font-bold text-3xl text-secondary tracking-tight">Registro de Atividades</h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          Tudo o que os representantes alteram no acompanhamento — status, datas de protocolo,
          observações — e quando cada um acessou o sistema.
        </p>
      </header>

      <Card className="p-5 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5 min-w-[180px] flex-1">
          <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Usuário</label>
          <MultiSelectField
            options={opcoesUsuarios}
            selected={filtros.usuarios}
            onChange={(v) => setFiltros((p) => ({ ...p, usuarios: v }))}
            searchPlaceholder="Buscar usuário…"
          />
        </div>
        <div className="flex flex-col gap-1.5 min-w-[180px] flex-1">
          <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Tipo</label>
          <MultiSelectField
            options={opcoesTipos}
            selected={filtros.tipos}
            onChange={(v) => setFiltros((p) => ({ ...p, tipos: v }))}
            searchPlaceholder="Buscar tipo…"
          />
        </div>
        <div className="flex flex-col gap-1.5 min-w-[230px]">
          <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Período</label>
          <DateRangeField
            de={filtros.de}
            ate={filtros.ate}
            onChange={(de, ate) => setFiltros((p) => ({ ...p, de, ate }))}
          />
        </div>
        <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
          <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Paciente</label>
          <input
            type="text"
            value={buscaInput}
            onChange={(e) => setBuscaInput(e.target.value)}
            placeholder="buscar paciente…"
            className="w-full h-[46px] bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm px-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setBuscaInput('')
            setFiltros(filtrosPadrao())
          }}
          className="bg-surface-container-high text-secondary hover:bg-surface-container-highest rounded-lg text-sm font-semibold py-2.5 px-5 h-[46px] transition-colors shrink-0"
        >
          Limpar
        </button>
      </Card>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatTile
          label="Alterações nesta página"
          value={String(stats.alteracoes)}
          sublabel={`${totalCount} no período filtrado`}
          dotClass="bg-primary"
        />
        <StatTile label="Logins" value={String(stats.logins)} sublabel="Nesta página" dotClass="bg-tertiary-container" />
        <StatTile
          label="Usuários envolvidos"
          value={String(stats.pessoas)}
          sublabel="Nesta página"
          dotClass="bg-on-surface"
        />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <Card className="xl:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10">
            <h2 className="font-headline font-bold text-lg text-secondary">Linha do tempo</h2>
            {novasAoVivo > 0 ? (
              <button
                type="button"
                onClick={() => setPagina(1)}
                className="bg-primary-container/15 text-primary-container text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide hover:bg-primary-container/25 transition-colors"
              >
                {novasAoVivo} novas · ver
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-outline uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse" />
                ao vivo
              </span>
            )}
          </div>

          <ul className="divide-y divide-surface-container-high">
            {loading ? (
              <li className="px-6 py-8 text-center text-sm text-on-surface-variant">Carregando…</li>
            ) : logs.length === 0 ? (
              <li className="px-6 py-8 text-center text-sm text-on-surface-variant">
                Nenhuma atividade no período filtrado.
              </li>
            ) : (
              logs.map((log) => {
                const meta = metaDoTipo(log.tipo)
                return (
                  <li key={log.id} className="flex gap-3 px-6 py-3.5 hover:bg-surface-container-high/30 transition-colors">
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">{meta.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-sm font-bold text-secondary">{log.usuario_nome ?? 'Usuário removido'}</span>
                        <span className="text-xs text-on-surface-variant">{meta.label.toLowerCase()}</span>
                        {log.solicitacao_id && log.paciente_nome && (
                          <>
                            <span className="text-xs text-outline">·</span>
                            <Link
                              to={`/solicitacoes/${log.solicitacao_id}`}
                              className="text-xs font-semibold text-primary hover:underline truncate max-w-[220px]"
                            >
                              {log.paciente_nome}
                            </Link>
                          </>
                        )}
                      </div>

                      {log.tipo !== 'login' && (
                        <div className="flex flex-wrap items-center gap-2">
                          <ValorAtividade tipo={log.tipo} valor={log.valor_anterior} esmaecido />
                          <span className="material-symbols-outlined text-[14px] text-outline">arrow_forward</span>
                          <ValorAtividade tipo={log.tipo} valor={log.valor_novo} />
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] font-semibold text-on-surface-variant whitespace-nowrap">
                        {tempoRelativo(log.criado_em)}
                      </p>
                      <p className="text-[10px] text-outline whitespace-nowrap">{formatarDataHoraBR(log.criado_em)}</p>
                    </div>
                  </li>
                )
              })
            )}
          </ul>

          {!loading && totalCount > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/10">
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
                <span className="text-xs font-semibold text-on-surface">
                  {pagina} / {totalPaginas}
                </span>
                <button
                  type="button"
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                  className="p-1.5 rounded-md text-outline hover:text-primary hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-outline transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="px-6 py-5 border-b border-outline-variant/10">
            <h2 className="font-headline font-bold text-lg text-secondary">Último acesso</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Quando cada usuário entrou no sistema.</p>
          </div>
          <ul className="divide-y divide-surface-container-high">
            {acessos.length === 0 ? (
              <li className="px-6 py-8 text-center text-sm text-on-surface-variant">Nenhum usuário cadastrado.</li>
            ) : (
              acessos.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-6 py-3">
                  <Avatar nome={u.nome} avatarUrl={u.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate flex items-center gap-1.5">
                      {u.nome}
                      {u.ativo === false && <UsuarioInativoBadge />}
                    </p>
                    <p className="text-[11px] text-outline uppercase tracking-wide">{u.role.replace('_', ' ')}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] font-semibold text-on-surface-variant whitespace-nowrap">
                      {u.ultimo_login ? tempoRelativo(u.ultimo_login) : 'nunca'}
                    </p>
                    <p className="text-[10px] text-outline whitespace-nowrap">
                      {u.ultimo_login ? formatarDataHoraBR(u.ultimo_login) : '—'}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </div>
  )
}
