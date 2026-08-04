import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { SearchableSelect } from '../ui/SearchableSelect'
import { DateField } from '../ui/DateField'
import { ProdutoSearchInput } from './ProdutoSearchInput'
import type { Hospital, PlanoSaude, Produto, StatusSolicitacao, TipoCirurgia } from '../../lib/types'

type ItemForm = {
  produto: Produto
  quantidade: number
}

export function NovaSolicitacaoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [hospitais, setHospitais] = useState<Hospital[]>([])
  const [planosSaude, setPlanosSaude] = useState<PlanoSaude[]>([])
  const [tiposCirurgia, setTiposCirurgia] = useState<TipoCirurgia[]>([])

  const [hospitalId, setHospitalId] = useState('')
  const [planoSaudeId, setPlanoSaudeId] = useState('')
  const [tipoCirurgiaId, setTipoCirurgiaId] = useState('')
  const [medico, setMedico] = useState('')
  const [paciente, setPaciente] = useState('')
  const [dataCirurgia, setDataCirurgia] = useState('')
  const [horaCirurgia, setHoraCirurgia] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [itens, setItens] = useState<ItemForm[]>([])
  const [arquivos, setArquivos] = useState<File[]>([])
  const [saving, setSaving] = useState<StatusSolicitacao | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    supabase.from('hospitais').select('*').order('nome_fantasia').then(({ data }) => setHospitais(data ?? []))
    supabase.from('planos_saude').select('*').order('nome').then(({ data }) => setPlanosSaude(data ?? []))
    supabase.from('tipos_cirurgia').select('*').order('nome').then(({ data }) => setTiposCirurgia(data ?? []))
  }, [open])

  function resetForm() {
    setHospitalId('')
    setPlanoSaudeId('')
    setTipoCirurgiaId('')
    setMedico('')
    setPaciente('')
    setDataCirurgia('')
    setHoraCirurgia('')
    setObservacoes('')
    setItens([])
    setArquivos([])
  }

  function handleClose() {
    if (saving) return
    resetForm()
    onClose()
  }

  function addProduto(produto: Produto) {
    setItens((prev) => {
      const existing = prev.find((i) => i.produto.id === produto.id)
      if (existing) {
        return prev.map((i) => (i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i))
      }
      return [...prev, { produto, quantidade: 1 }]
    })
  }

  function updateQuantidade(produtoId: string, quantidade: number) {
    setItens((prev) => prev.map((i) => (i.produto.id === produtoId ? { ...i, quantidade } : i)))
  }

  function removeItem(produtoId: string) {
    setItens((prev) => prev.filter((i) => i.produto.id !== produtoId))
  }

  function handleFilesSelected(files: FileList | null) {
    if (!files) return
    setArquivos((prev) => [...prev, ...Array.from(files)])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeArquivo(index: number) {
    setArquivos((prev) => prev.filter((_, i) => i !== index))
  }

  function isValid() {
    return Boolean(
      hospitalId && medico.trim() && paciente.trim() && planoSaudeId && tipoCirurgiaId && itens.length > 0,
    )
  }

  async function handleSubmit(status: StatusSolicitacao) {
    if (!profile || !isValid()) {
      toast.error('Preencha hospital, médico, paciente, plano de saúde, tipo de cirurgia e ao menos um produto.')
      return
    }

    setSaving(status)

    const { data: solicitacao, error } = await supabase
      .from('solicitacoes_cirurgicas')
      .insert({
        representante_id: profile.id,
        hospital_id: hospitalId,
        plano_saude_id: planoSaudeId,
        tipo_cirurgia_id: tipoCirurgiaId,
        medico_cirurgiao: medico.trim(),
        paciente_nome: paciente.trim(),
        data_cirurgia: dataCirurgia ? new Date(`${dataCirurgia}T${horaCirurgia || '00:00'}`).toISOString() : null,
        observacoes: observacoes.trim() || null,
        status,
      })
      .select()
      .single()

    if (error || !solicitacao) {
      setSaving(null)
      toast.error('Não foi possível salvar a solicitação.')
      return
    }

    const { error: itensError } = await supabase.from('itens_solicitados').insert(
      itens.map((i) => ({
        solicitacao_id: solicitacao.id,
        produto_id: i.produto.id,
        quantidade_estimada: i.quantidade,
      })),
    )

    if (itensError) {
      toast.error('Solicitação criada, mas houve erro ao salvar os produtos.')
    }

    for (const arquivo of arquivos) {
      const path = `${profile.id}/${solicitacao.id}/${arquivo.name}`
      const { error: uploadError } = await supabase.storage.from('anexos-solicitacoes').upload(path, arquivo)
      if (uploadError) {
        toast.error(`Falha ao anexar "${arquivo.name}".`)
        continue
      }
      await supabase
        .from('anexos_solicitacoes')
        .insert({ solicitacao_id: solicitacao.id, nome_arquivo: arquivo.name, storage_path: path })
    }

    setSaving(null)
    toast.success(status === 'enviado' ? 'Solicitação enviada para aprovação!' : 'Rascunho salvo.')
    resetForm()
    onClose()
    navigate(`/solicitacoes/${solicitacao.id}`)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8 sm:my-0 flex flex-col max-h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10 shrink-0">
          <div>
            <h2 className="font-headline font-bold text-xl text-secondary">Nova Solicitação</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Preencha os dados da cirurgia e os materiais estimados.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-outline hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors shrink-0"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6 flex flex-col gap-6 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Hospital *</label>
              <SearchableSelect
                options={hospitais.map((h) => ({
                  id: h.id,
                  nome: `${h.nome_fantasia}${h.cidade ? ` — ${h.cidade}/${h.uf}` : ''}`,
                }))}
                value={hospitalId}
                onChange={setHospitalId}
                placeholder="Selecione…"
                searchPlaceholder="Buscar hospital…"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">
                Data e hora da cirurgia
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <DateField value={dataCirurgia} onChange={setDataCirurgia} placeholder="Data" />
                </div>
                <input
                  type="time"
                  value={horaCirurgia}
                  onChange={(e) => setHoraCirurgia(e.target.value)}
                  className="w-[110px] shrink-0 h-[46px] bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm px-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Médico cirurgião *</label>
              <input
                type="text"
                value={medico}
                onChange={(e) => setMedico(e.target.value)}
                placeholder="Dr(a). Nome completo"
                className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-3 px-4 focus:ring-2 focus:ring-primary/10 focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Paciente *</label>
              <input
                type="text"
                value={paciente}
                onChange={(e) => setPaciente(e.target.value)}
                placeholder="Nome completo da paciente"
                className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-3 px-4 focus:ring-2 focus:ring-primary/10 focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Plano de saúde *</label>
              <SearchableSelect
                options={planosSaude}
                value={planoSaudeId}
                onChange={setPlanoSaudeId}
                placeholder="Selecione…"
                searchPlaceholder="Buscar plano de saúde…"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Tipo de cirurgia *</label>
              <SearchableSelect
                options={tiposCirurgia}
                value={tipoCirurgiaId}
                onChange={setTipoCirurgiaId}
                placeholder="Selecione…"
                searchPlaceholder="Buscar tipo de cirurgia…"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              placeholder="Informações adicionais para o comercial…"
              className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm p-4 focus:ring-2 focus:ring-primary/10 focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Materiais estimados *</label>
            <ProdutoSearchInput onSelect={addProduto} />

            {itens.length === 0 ? (
              <p className="text-sm text-on-surface-variant py-2 text-center">Nenhum produto adicionado ainda.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {itens.map((item) => (
                  <li
                    key={item.produto.id}
                    className="flex items-center justify-between gap-4 bg-surface-container-low rounded-lg px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-on-surface truncate">{item.produto.nome}</p>
                      <p className="text-xs text-on-surface-variant truncate">
                        TUSS {item.produto.codigo_tuss ?? '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <input
                        type="number"
                        min={1}
                        value={item.quantidade}
                        onChange={(e) => updateQuantidade(item.produto.id, Math.max(1, Number(e.target.value)))}
                        className="w-16 text-center bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-sm py-1.5"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(item.produto.id)}
                        className="text-outline hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Anexar documentos</label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 border-2 border-dashed border-outline-variant/40 rounded-lg py-4 text-sm font-semibold text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">upload_file</span>
              Selecionar arquivos (PDF, imagem ou Word)
            </button>

            {arquivos.length > 0 && (
              <ul className="flex flex-col gap-2">
                {arquivos.map((arquivo, index) => (
                  <li
                    key={`${arquivo.name}-${index}`}
                    className="flex items-center justify-between gap-3 bg-surface-container-low rounded-lg px-4 py-2.5"
                  >
                    <span className="text-sm text-on-surface truncate min-w-0 flex-1">{arquivo.name}</span>
                    <button
                      type="button"
                      onClick={() => removeArquivo(index)}
                      className="text-outline hover:text-error transition-colors shrink-0"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-outline-variant/10 shrink-0">
          <Button variant="secondary" isLoading={saving === 'rascunho'} disabled={saving !== null} onClick={() => handleSubmit('rascunho')}>
            Salvar Rascunho
          </Button>
          <Button isLoading={saving === 'enviado'} disabled={saving !== null} onClick={() => handleSubmit('enviado')}>
            Enviar para o Comercial
            <span className="material-symbols-outlined text-[18px]">send</span>
          </Button>
        </div>
      </Card>
    </div>
  )
}
