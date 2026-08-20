import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { SearchableSelect } from '../ui/SearchableSelect'
import type { MetaComercial, MetaRepresentante } from '../../lib/types'

const MESES_ABREV = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

function mesLabelCompleto(mesReferencia: string): string {
  const [ano, mes] = mesReferencia.split('-').map(Number)
  return `${MESES_ABREV[mes - 1]} de ${ano}`
}

const currencyFull = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })

export function MetasSection() {
  const [metas, setMetas] = useState<MetaComercial[]>([])
  const [loading, setLoading] = useState(true)

  const [novoMes, setNovoMes] = useState('')
  const [novoValor, setNovoValor] = useState('')
  const [salvandoNovo, setSalvandoNovo] = useState(false)

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [valorEdicao, setValorEdicao] = useState('')
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  const [metasRep, setMetasRep] = useState<MetaRepresentante[]>([])
  const [representantesDisponiveis, setRepresentantesDisponiveis] = useState<string[]>([])

  const [novoMesRep, setNovoMesRep] = useState('')
  const [novoRepNome, setNovoRepNome] = useState('')
  const [novoValorRep, setNovoValorRep] = useState('')
  const [salvandoNovoRep, setSalvandoNovoRep] = useState(false)

  const [editandoRepId, setEditandoRepId] = useState<string | null>(null)
  const [valorEdicaoRep, setValorEdicaoRep] = useState('')
  const [salvandoEdicaoRep, setSalvandoEdicaoRep] = useState(false)

  const [excluindoRepId, setExcluindoRepId] = useState<string | null>(null)

  async function carregar() {
    const { data } = await supabase
      .from('metas_comerciais')
      .select('*')
      .order('mes_referencia', { ascending: false })
    setMetas((data as MetaComercial[]) ?? [])
    setLoading(false)
  }

  async function carregarMetasRep() {
    const { data } = await supabase
      .from('metas_representantes')
      .select('*')
      .order('mes_referencia', { ascending: false })
    setMetasRep((data as MetaRepresentante[]) ?? [])
  }

  async function carregarRepresentantesDisponiveis() {
    const { data } = await supabase.from('solicitacoes_importadas').select('representante_nome')
    const nomes = new Set<string>()
    for (const row of data ?? []) {
      if (row.representante_nome) nomes.add(row.representante_nome)
    }
    setRepresentantesDisponiveis(Array.from(nomes).sort())
  }

  useEffect(() => {
    async function carregarInicial() {
      await Promise.all([carregar(), carregarMetasRep(), carregarRepresentantesDisponiveis()])
    }
    carregarInicial()
  }, [])

  const mesesJaDefinidos = useMemo(() => new Set(metas.map((m) => m.mes_referencia.slice(0, 7))), [metas])

  const metasRepJaDefinidasNoMes = useMemo(
    () => new Set(metasRep.filter((m) => m.mes_referencia.slice(0, 7) === novoMesRep).map((m) => m.representante_nome)),
    [metasRep, novoMesRep],
  )

  // Conferência: soma das metas individuais x meta única da empresa, mês a mês.
  const conferenciaPorMes = useMemo(() => {
    const mesesSet = new Set<string>([
      ...metas.map((m) => m.mes_referencia.slice(0, 7)),
      ...metasRep.map((m) => m.mes_referencia.slice(0, 7)),
    ])
    return Array.from(mesesSet)
      .sort()
      .reverse()
      .map((mesKey) => {
        const metaEmpresa = metas.find((m) => m.mes_referencia.slice(0, 7) === mesKey)?.meta_valor ?? null
        const somaReps = metasRep
          .filter((m) => m.mes_referencia.slice(0, 7) === mesKey)
          .reduce((soma, m) => soma + m.meta_valor, 0)
        const qtdRepsComMeta = metasRep.filter((m) => m.mes_referencia.slice(0, 7) === mesKey).length
        const bate = metaEmpresa !== null && Math.abs(metaEmpresa - somaReps) < 0.01
        return { mesKey, metaEmpresa, somaReps, qtdRepsComMeta, bate }
      })
  }, [metas, metasRep])

  async function adicionarMeta() {
    if (!novoMes) {
      toast.error('Selecione o mês de referência.')
      return
    }
    const valor = Number(novoValor.replace(/\./g, '').replace(',', '.'))
    if (!Number.isFinite(valor) || valor <= 0) {
      toast.error('Informe um valor de meta válido.')
      return
    }
    const mesReferencia = `${novoMes}-01`
    if (mesesJaDefinidos.has(novoMes)) {
      toast.error('Já existe uma meta definida para esse mês. Edite o valor existente abaixo.')
      return
    }

    setSalvandoNovo(true)
    const { error } = await supabase
      .from('metas_comerciais')
      .insert({ mes_referencia: mesReferencia, meta_valor: valor })
    setSalvandoNovo(false)

    if (error) {
      toast.error('Não foi possível salvar a meta.')
      return
    }
    toast.success(`Meta de ${mesLabelCompleto(novoMes)} definida.`)
    setNovoMes('')
    setNovoValor('')
    carregar()
  }

  function abrirEdicao(meta: MetaComercial) {
    setEditandoId(meta.id)
    setValorEdicao(String(meta.meta_valor))
  }

  async function salvarEdicao(meta: MetaComercial) {
    const valor = Number(valorEdicao.replace(/\./g, '').replace(',', '.'))
    if (!Number.isFinite(valor) || valor <= 0) {
      toast.error('Informe um valor de meta válido.')
      return
    }
    setSalvandoEdicao(true)
    const { error } = await supabase.from('metas_comerciais').update({ meta_valor: valor }).eq('id', meta.id)
    setSalvandoEdicao(false)

    if (error) {
      toast.error('Não foi possível atualizar a meta.')
      return
    }
    toast.success('Meta atualizada.')
    setEditandoId(null)
    carregar()
  }

  async function excluirMeta(meta: MetaComercial) {
    setExcluindoId(meta.id)
    const { error } = await supabase.from('metas_comerciais').delete().eq('id', meta.id)
    setExcluindoId(null)

    if (error) {
      toast.error('Não foi possível remover a meta.')
      return
    }
    toast.success('Meta removida.')
    carregar()
  }

  async function adicionarMetaRep() {
    if (!novoMesRep) {
      toast.error('Selecione o mês de referência.')
      return
    }
    if (!novoRepNome) {
      toast.error('Selecione o representante.')
      return
    }
    const valor = Number(novoValorRep.replace(/\./g, '').replace(',', '.'))
    if (!Number.isFinite(valor) || valor <= 0) {
      toast.error('Informe um valor de meta válido.')
      return
    }
    if (metasRepJaDefinidasNoMes.has(novoRepNome)) {
      toast.error('Já existe uma meta definida para esse representante nesse mês. Edite o valor existente abaixo.')
      return
    }

    setSalvandoNovoRep(true)
    const { error } = await supabase.from('metas_representantes').insert({
      representante_nome: novoRepNome,
      mes_referencia: `${novoMesRep}-01`,
      meta_valor: valor,
    })
    setSalvandoNovoRep(false)

    if (error) {
      toast.error('Não foi possível salvar a meta do representante.')
      return
    }
    toast.success(`Meta de ${novoRepNome} em ${mesLabelCompleto(novoMesRep)} definida.`)
    setNovoRepNome('')
    setNovoValorRep('')
    carregarMetasRep()
  }

  function abrirEdicaoRep(meta: MetaRepresentante) {
    setEditandoRepId(meta.id)
    setValorEdicaoRep(String(meta.meta_valor))
  }

  async function salvarEdicaoRep(meta: MetaRepresentante) {
    const valor = Number(valorEdicaoRep.replace(/\./g, '').replace(',', '.'))
    if (!Number.isFinite(valor) || valor <= 0) {
      toast.error('Informe um valor de meta válido.')
      return
    }
    setSalvandoEdicaoRep(true)
    const { error } = await supabase.from('metas_representantes').update({ meta_valor: valor }).eq('id', meta.id)
    setSalvandoEdicaoRep(false)

    if (error) {
      toast.error('Não foi possível atualizar a meta do representante.')
      return
    }
    toast.success('Meta atualizada.')
    setEditandoRepId(null)
    carregarMetasRep()
  }

  async function excluirMetaRep(meta: MetaRepresentante) {
    setExcluindoRepId(meta.id)
    const { error } = await supabase.from('metas_representantes').delete().eq('id', meta.id)
    setExcluindoRepId(null)

    if (error) {
      toast.error('Não foi possível remover a meta do representante.')
      return
    }
    toast.success('Meta removida.')
    carregarMetasRep()
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-on-surface-variant text-sm -mt-2">Metas comerciais mensais usadas no Painel Comercial.</p>

      <Card className="p-6">
        <h2 className="font-headline font-bold text-lg text-secondary mb-1">Definir nova meta</h2>
        <p className="text-sm text-on-surface-variant mb-5">
          O valor da meta varia de mês para mês — defina aqui o valor de cada mês de referência.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Mês de referência</label>
            <input
              type="month"
              value={novoMes}
              onChange={(e) => setNovoMes(e.target.value)}
              className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-2.5 px-3 focus:ring-2 focus:ring-primary/10 focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Valor da meta (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              value={novoValor}
              onChange={(e) => setNovoValor(e.target.value)}
              placeholder="Ex: 6050000"
              className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-2.5 px-3 w-48 focus:ring-2 focus:ring-primary/10 focus:border-primary"
            />
          </div>
          <Button isLoading={salvandoNovo} disabled={salvandoNovo} onClick={adicionarMeta}>
            Salvar meta
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/10">
          <h2 className="font-headline font-bold text-lg text-secondary">Metas definidas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest">
                  Mês de referência
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest">
                  Meta
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                    Carregando…
                  </td>
                </tr>
              ) : metas.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                    Nenhuma meta definida ainda.
                  </td>
                </tr>
              ) : (
                metas.map((meta) => (
                  <tr key={meta.id} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-on-surface capitalize">
                      {mesLabelCompleto(meta.mes_referencia.slice(0, 7))}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {editandoId === meta.id ? (
                        <input
                          autoFocus
                          type="text"
                          inputMode="decimal"
                          value={valorEdicao}
                          onChange={(e) => setValorEdicao(e.target.value)}
                          className="w-36 bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-1.5 px-3"
                        />
                      ) : (
                        currencyFull.format(meta.meta_valor)
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editandoId === meta.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={salvandoEdicao}
                            onClick={() => salvarEdicao(meta)}
                            className="text-primary hover:text-primary-container transition-colors"
                            title="Salvar"
                          >
                            <span className="material-symbols-outlined text-[20px]">check</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditandoId(null)}
                            className="text-outline hover:text-error transition-colors"
                            title="Cancelar"
                          >
                            <span className="material-symbols-outlined text-[20px]">close</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => abrirEdicao(meta)}
                            className="text-outline hover:text-primary transition-colors"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            type="button"
                            disabled={excluindoId === meta.id}
                            onClick={() => excluirMeta(meta)}
                            className="text-outline hover:text-error transition-colors"
                            title="Remover"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {conferenciaPorMes.length > 0 && (
        <Card className="p-6">
          <h2 className="font-headline font-bold text-lg text-secondary mb-1">Conferência de Metas</h2>
          <p className="text-sm text-on-surface-variant mb-5">
            A soma das metas individuais dos representantes deveria bater com a meta única da empresa, mês a mês.
          </p>
          <ul className="flex flex-col gap-2">
            {conferenciaPorMes.map((c) => (
              <li
                key={c.mesKey}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg px-4 py-3 ${
                  c.metaEmpresa === null
                    ? 'bg-surface-container-low'
                    : c.bate
                      ? 'bg-tertiary-container/10'
                      : 'bg-error-container/60'
                }`}
              >
                <span className="text-sm font-semibold text-on-surface capitalize">
                  {mesLabelCompleto(c.mesKey)}
                </span>
                <span className="text-xs text-on-surface-variant flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>
                    Meta da empresa:{' '}
                    <strong className="text-on-surface">
                      {c.metaEmpresa !== null ? currencyFull.format(c.metaEmpresa) : 'não definida'}
                    </strong>
                  </span>
                  <span>
                    Soma dos representantes ({c.qtdRepsComMeta}):{' '}
                    <strong className="text-on-surface">{currencyFull.format(c.somaReps)}</strong>
                  </span>
                  {c.metaEmpresa !== null && !c.bate && (
                    <span className="inline-flex items-center gap-1 font-bold text-on-error-container">
                      <span className="material-symbols-outlined text-[16px]">warning</span>
                      diferença de {currencyFull.format(Math.abs(c.metaEmpresa - c.somaReps))}
                    </span>
                  )}
                  {c.metaEmpresa !== null && c.bate && (
                    <span className="inline-flex items-center gap-1 font-bold text-tertiary-container">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      bate certinho
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="font-headline font-bold text-lg text-secondary mb-1">Definir meta por representante</h2>
        <p className="text-sm text-on-surface-variant mb-5">
          Metas individuais mensais, usadas na "Meta Sugerida" do Painel Comercial.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Mês de referência</label>
            <input
              type="month"
              value={novoMesRep}
              onChange={(e) => setNovoMesRep(e.target.value)}
              className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-2.5 px-3 focus:ring-2 focus:ring-primary/10 focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[220px]">
            <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Representante</label>
            <SearchableSelect
              options={representantesDisponiveis.map((nome) => ({ id: nome, nome }))}
              value={novoRepNome}
              onChange={setNovoRepNome}
              searchPlaceholder="Buscar representante…"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Valor da meta (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              value={novoValorRep}
              onChange={(e) => setNovoValorRep(e.target.value)}
              placeholder="Ex: 1000000"
              className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-2.5 px-3 w-48 focus:ring-2 focus:ring-primary/10 focus:border-primary"
            />
          </div>
          <Button isLoading={salvandoNovoRep} disabled={salvandoNovoRep} onClick={adicionarMetaRep}>
            Salvar meta
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/10">
          <h2 className="font-headline font-bold text-lg text-secondary">Metas por representante</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest">
                  Representante
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest">
                  Mês de referência
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest">
                  Meta
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {metasRep.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                    Nenhuma meta por representante definida ainda.
                  </td>
                </tr>
              ) : (
                metasRep.map((meta) => (
                  <tr key={meta.id} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-on-surface">{meta.representante_nome}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant capitalize">
                      {mesLabelCompleto(meta.mes_referencia.slice(0, 7))}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {editandoRepId === meta.id ? (
                        <input
                          autoFocus
                          type="text"
                          inputMode="decimal"
                          value={valorEdicaoRep}
                          onChange={(e) => setValorEdicaoRep(e.target.value)}
                          className="w-36 bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-1.5 px-3"
                        />
                      ) : (
                        currencyFull.format(meta.meta_valor)
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editandoRepId === meta.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={salvandoEdicaoRep}
                            onClick={() => salvarEdicaoRep(meta)}
                            className="text-primary hover:text-primary-container transition-colors"
                            title="Salvar"
                          >
                            <span className="material-symbols-outlined text-[20px]">check</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditandoRepId(null)}
                            className="text-outline hover:text-error transition-colors"
                            title="Cancelar"
                          >
                            <span className="material-symbols-outlined text-[20px]">close</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => abrirEdicaoRep(meta)}
                            className="text-outline hover:text-primary transition-colors"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            type="button"
                            disabled={excluindoRepId === meta.id}
                            onClick={() => excluirMetaRep(meta)}
                            className="text-outline hover:text-error transition-colors"
                            title="Remover"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      )}
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
