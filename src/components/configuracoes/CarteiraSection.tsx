import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { SearchableSelect } from '../ui/SearchableSelect'
import { UsuarioInativoBadge } from '../ui/UsuarioInativoBadge'
import type { CarteiraMedico } from '../../lib/types'

// Junta o vínculo com o nome/status do representante — a FK carteira_medicos.representante_id
// aponta pra profiles, mas há uma segunda FK (criado_por) pra mesma tabela, então o embed do
// PostgREST precisa do nome do relacionamento explícito pra não ficar ambíguo.
const SELECT_COM_REPRESENTANTE =
  '*, profiles!carteira_medicos_representante_id_fkey(nome, ativo)'

type CarteiraComRepresentante = CarteiraMedico & {
  profiles: { nome: string; ativo: boolean } | null
}

type RepresentanteOpcao = { id: string; nome: string; ativo: boolean }

export function CarteiraSection() {
  const [carteira, setCarteira] = useState<CarteiraComRepresentante[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  const [medicosDisponiveis, setMedicosDisponiveis] = useState<string[]>([])
  const [representantes, setRepresentantes] = useState<RepresentanteOpcao[]>([])

  const [novoMedico, setNovoMedico] = useState('')
  const [novoRepresentanteId, setNovoRepresentanteId] = useState('')
  const [novaObservacao, setNovaObservacao] = useState('')
  const [salvandoNovo, setSalvandoNovo] = useState(false)

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [representanteEdicaoId, setRepresentanteEdicaoId] = useState('')
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  async function carregarCarteira() {
    const { data } = await supabase
      .from('carteira_medicos')
      .select(SELECT_COM_REPRESENTANTE)
      .order('medico_nome')
    setCarteira((data as unknown as CarteiraComRepresentante[] | null) ?? [])
    setLoading(false)
  }

  async function carregarMedicosDisponiveis() {
    const { data } = await supabase.from('solicitacoes_importadas').select('medico_nome')
    const nomes = new Set<string>()
    for (const row of data ?? []) {
      if (row.medico_nome) nomes.add(row.medico_nome)
    }
    setMedicosDisponiveis(Array.from(nomes).sort())
  }

  async function carregarRepresentantes() {
    const { data } = await supabase
      .from('profiles')
      .select('id, nome, ativo')
      .eq('role', 'representante')
      .order('nome')
    setRepresentantes((data as RepresentanteOpcao[] | null) ?? [])
  }

  useEffect(() => {
    async function carregarInicial() {
      await Promise.all([carregarCarteira(), carregarMedicosDisponiveis(), carregarRepresentantes()])
    }
    carregarInicial()
  }, [])

  const medicosJaNaCarteira = useMemo(() => new Set(carteira.map((c) => c.medico_nome)), [carteira])

  const carteiraFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return carteira
    return carteira.filter(
      (c) => c.medico_nome.toLowerCase().includes(termo) || (c.profiles?.nome ?? '').toLowerCase().includes(termo),
    )
  }, [carteira, busca])

  async function adicionarVinculo() {
    if (!novoMedico) {
      toast.error('Selecione o médico.')
      return
    }
    if (!novoRepresentanteId) {
      toast.error('Selecione o representante.')
      return
    }
    if (medicosJaNaCarteira.has(novoMedico)) {
      toast.error('Esse médico já está na carteira de um representante. Edite o vínculo existente abaixo.')
      return
    }

    setSalvandoNovo(true)
    const { error } = await supabase.from('carteira_medicos').insert({
      medico_nome: novoMedico,
      representante_id: novoRepresentanteId,
      observacoes: novaObservacao.trim() || null,
    })
    setSalvandoNovo(false)

    if (error) {
      if (error.code === '23505') {
        toast.error('Esse médico já está na carteira de um representante. Edite o vínculo existente abaixo.')
      } else {
        toast.error('Não foi possível salvar o vínculo.', { description: error.message })
      }
      return
    }
    toast.success(`${novoMedico} adicionado à carteira.`)
    setNovoMedico('')
    setNovoRepresentanteId('')
    setNovaObservacao('')
    carregarCarteira()
  }

  function abrirEdicao(item: CarteiraComRepresentante) {
    setEditandoId(item.id)
    setRepresentanteEdicaoId(item.representante_id)
  }

  async function salvarEdicao(item: CarteiraComRepresentante) {
    if (!representanteEdicaoId) {
      toast.error('Selecione o representante.')
      return
    }
    setSalvandoEdicao(true)
    const { error } = await supabase
      .from('carteira_medicos')
      .update({ representante_id: representanteEdicaoId })
      .eq('id', item.id)
    setSalvandoEdicao(false)

    if (error) {
      toast.error('Não foi possível atualizar o vínculo.', { description: error.message })
      return
    }
    toast.success('Vínculo atualizado.')
    setEditandoId(null)
    carregarCarteira()
  }

  async function removerVinculo(item: CarteiraComRepresentante) {
    setExcluindoId(item.id)
    const { error } = await supabase.from('carteira_medicos').delete().eq('id', item.id)
    setExcluindoId(null)

    if (error) {
      toast.error('Não foi possível remover o vínculo.', { description: error.message })
      return
    }
    toast.success(`${item.medico_nome} removido da carteira — volta a usar o representante do orçamento.`)
    carregarCarteira()
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-on-surface-variant text-sm -mt-2">
        Vincule médicos aos representantes que realmente atendem cada um. Nos cálculos e nas telas do sistema, esse
        vínculo tem prioridade sobre o representante indicado no orçamento importado — um médico sem vínculo aqui
        continua usando a informação do orçamento normalmente.
      </p>

      <Card className="p-6">
        <h2 className="font-headline font-bold text-lg text-secondary mb-1">Adicionar à carteira</h2>
        <p className="text-sm text-on-surface-variant mb-5">
          Cada médico pode estar na carteira de um único representante por vez.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5 min-w-[260px]">
            <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Médico</label>
            <SearchableSelect
              options={medicosDisponiveis.map((nome) => ({ id: nome, nome }))}
              value={novoMedico}
              onChange={setNovoMedico}
              searchPlaceholder="Buscar médico…"
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[220px]">
            <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Representante</label>
            <SearchableSelect
              options={representantes.map((r) => ({ id: r.id, nome: r.nome }))}
              value={novoRepresentanteId}
              onChange={setNovoRepresentanteId}
              searchPlaceholder="Buscar representante…"
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Observações</label>
            <input
              type="text"
              value={novaObservacao}
              onChange={(e) => setNovaObservacao(e.target.value)}
              placeholder="Opcional"
              className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-2.5 px-3 focus:ring-2 focus:ring-primary/10 focus:border-primary"
            />
          </div>
          <Button isLoading={salvandoNovo} disabled={salvandoNovo} onClick={adicionarVinculo}>
            Adicionar
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-outline-variant/10">
          <div>
            <h2 className="font-headline font-bold text-lg text-secondary">Carteira</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">{carteira.length} médico(s) vinculado(s)</p>
          </div>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por médico ou representante…"
            className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-2 px-3 w-64 focus:ring-2 focus:ring-primary/10 focus:border-primary"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest">
                  Médico
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest">
                  Representante
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest">
                  Observações
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                    Carregando…
                  </td>
                </tr>
              ) : carteiraFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                    {carteira.length === 0
                      ? 'Nenhum médico vinculado ainda — todos os cálculos usam o representante do orçamento.'
                      : 'Nenhum vínculo encontrado pra essa busca.'}
                  </td>
                </tr>
              ) : (
                carteiraFiltrada.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-on-surface">{item.medico_nome}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {editandoId === item.id ? (
                        <div className="w-56">
                          <SearchableSelect
                            options={representantes.map((r) => ({ id: r.id, nome: r.nome }))}
                            value={representanteEdicaoId}
                            onChange={setRepresentanteEdicaoId}
                            searchPlaceholder="Buscar representante…"
                          />
                        </div>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          {item.profiles?.nome ?? '—'}
                          {item.profiles?.ativo === false && <UsuarioInativoBadge />}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{item.observacoes ?? '—'}</td>
                    <td className="px-6 py-4 text-right">
                      {editandoId === item.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={salvandoEdicao}
                            onClick={() => salvarEdicao(item)}
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
                            onClick={() => abrirEdicao(item)}
                            className="text-outline hover:text-primary transition-colors"
                            title="Trocar representante"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            type="button"
                            disabled={excluindoId === item.id}
                            onClick={() => removerVinculo(item)}
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
