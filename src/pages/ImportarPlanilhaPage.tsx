import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { SearchableSelect } from '../components/ui/SearchableSelect'
import {
  CAMPOS_DESTINO,
  autoMapearColunas,
  construirRegistro,
  parseArquivoPlanilha,
  type CampoKey,
  type MapeamentoColunas,
  type PlanilhaParseResult,
  type RegistroImportado,
} from '../lib/importPlanilha'

const TAMANHO_LOTE = 500
const SEM_COLUNA = '__nenhuma__'

type Etapa = 'selecao' | 'mapeamento' | 'importando' | 'concluido'

export function ImportarPlanilhaPage() {
  const { profile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [etapa, setEtapa] = useState<Etapa>('selecao')
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [planilha, setPlanilha] = useState<PlanilhaParseResult | null>(null)
  const [mapeamento, setMapeamento] = useState<MapeamentoColunas>({})
  const [progresso, setProgresso] = useState({ processados: 0, total: 0 })
  const [resultado, setResultado] = useState<{ importados: number; ignorados: number; erros: string[] } | null>(null)

  const registrosConstruidos = useMemo(() => {
    if (!planilha) return []
    return planilha.rows.map((row) => construirRegistro(row, mapeamento))
  }, [planilha, mapeamento])

  const registrosValidos = useMemo(
    () => registrosConstruidos.filter((r): r is RegistroImportado => r !== null),
    [registrosConstruidos],
  )
  const totalIgnorados = registrosConstruidos.length - registrosValidos.length

  const camposMapeados = CAMPOS_DESTINO.filter((c) => mapeamento[c.key] !== undefined).length
  const faltaObrigatorio = CAMPOS_DESTINO.some((c) => c.obrigatorio && mapeamento[c.key] === undefined)

  async function handleFileSelected(file: File | null) {
    if (!file) return
    setNomeArquivo(file.name)
    try {
      const parsed = await parseArquivoPlanilha(file)
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        toast.error('Não foi possível ler linhas de dados nessa planilha.')
        return
      }
      setPlanilha(parsed)
      setMapeamento(autoMapearColunas(parsed.headers))
      setEtapa('mapeamento')
    } catch {
      toast.error('Falha ao ler o arquivo. Confirme se é um .xlsx válido.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function atualizarMapeamento(campoKey: CampoKey, valor: string) {
    setMapeamento((prev) => {
      const next = { ...prev }
      if (valor === SEM_COLUNA) {
        delete next[campoKey]
      } else {
        next[campoKey] = Number(valor)
      }
      return next
    })
  }

  function reiniciar() {
    setEtapa('selecao')
    setNomeArquivo('')
    setPlanilha(null)
    setMapeamento({})
    setProgresso({ processados: 0, total: 0 })
    setResultado(null)
  }

  async function confirmarImportacao() {
    if (!profile || faltaObrigatorio || registrosValidos.length === 0) return

    setEtapa('importando')
    setProgresso({ processados: 0, total: registrosValidos.length })

    const registrosComAutor = registrosValidos.map((r) => ({ ...r, importado_por: profile.id }))
    const erros: string[] = []
    let importados = 0

    for (let i = 0; i < registrosComAutor.length; i += TAMANHO_LOTE) {
      const lote = registrosComAutor.slice(i, i + TAMANHO_LOTE)
      const { data, error } = await supabase.rpc('upsert_solicitacoes_importadas', { linhas: lote })

      if (error) {
        erros.push(`Linhas ${i + 1}–${i + lote.length}: ${error.message}`)
      } else {
        const resultadoLote = data as { processadas: number; ignoradas: number } | null
        importados += resultadoLote?.processadas ?? 0
      }
      setProgresso({ processados: Math.min(i + TAMANHO_LOTE, registrosComAutor.length), total: registrosComAutor.length })
    }

    setResultado({ importados, ignorados: totalIgnorados, erros })
    setEtapa('concluido')

    if (erros.length === 0) {
      toast.success(`${importados} registros importados com sucesso.`)
    } else {
      toast.error(`Importação concluída com ${erros.length} lote(s) com erro.`)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline font-bold text-3xl text-secondary tracking-tight">Importar Planilha</h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          Importe o relatório diário de representantes. Linhas existentes (mesmo Nro. Orçamento, ou
          Nro. Agendamento quando não há orçamento) são sobrescritas; linhas novas são adicionadas.
        </p>
      </header>

      {etapa === 'selecao' && (
        <Card className="p-8 flex flex-col items-center gap-4 text-center">
          <span className="material-symbols-outlined text-4xl text-primary">upload_file</span>
          <div>
            <p className="font-semibold text-on-surface">Selecione o arquivo .xlsx</p>
            <p className="text-sm text-on-surface-variant mt-1">
              Padrão de referência: relatório total de representantes.
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            Escolher arquivo
            <span className="material-symbols-outlined text-[18px]">folder_open</span>
          </Button>
        </Card>
      )}

      {etapa === 'mapeamento' && planilha && (
        <>
          <Card className="p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="material-symbols-outlined text-primary">description</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">{nomeArquivo}</p>
                <p className="text-xs text-on-surface-variant">
                  {planilha.rows.length} linhas de dados · {planilha.headers.length} colunas detectadas
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={reiniciar}>
              Trocar arquivo
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="font-headline font-bold text-lg text-secondary mb-1">
              Relacione as colunas da planilha
            </h2>
            <p className="text-sm text-on-surface-variant mb-5">
              Confirme se cada campo do sistema está apontando para a coluna correta antes de importar.
              ({camposMapeados}/{CAMPOS_DESTINO.length} campos mapeados)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CAMPOS_DESTINO.map((campo) => {
                const opcoesColuna = [
                  { id: SEM_COLUNA, nome: '— Não importar —' },
                  ...planilha.headers.map((header, idx) => ({
                    id: String(idx),
                    nome: header || `Coluna ${idx + 1}`,
                  })),
                ]
                return (
                  <div key={campo.key} className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">
                      {campo.label}
                      {campo.obrigatorio && <span className="text-error"> *</span>}
                    </label>
                    <SearchableSelect
                      options={opcoesColuna}
                      value={String(mapeamento[campo.key] ?? SEM_COLUNA)}
                      onChange={(valor) => atualizarMapeamento(campo.key, valor)}
                      searchPlaceholder="Buscar coluna…"
                      invalid={campo.obrigatorio && mapeamento[campo.key] === undefined}
                    />
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="p-6 overflow-hidden">
            <h2 className="font-headline font-bold text-lg text-secondary mb-4">Pré-visualização</h2>
            {totalIgnorados > 0 && (
              <p className="text-sm text-tertiary bg-tertiary-container/30 rounded-lg px-4 py-2.5 mb-4">
                {totalIgnorados} linha(s) serão ignoradas por não terem Nro.Orçamento nem Nro.Agendamento
                preenchidos.
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-surface-container-low">
                    {CAMPOS_DESTINO.filter((c) => mapeamento[c.key] !== undefined).map((c) => (
                      <th key={c.key} className="px-4 py-3 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest whitespace-nowrap">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {registrosValidos.slice(0, 5).map((registro, idx) => (
                    <tr key={idx}>
                      {CAMPOS_DESTINO.filter((c) => mapeamento[c.key] !== undefined).map((c) => (
                        <td key={c.key} className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                          {String((registro as Record<string, unknown>)[c.key] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={reiniciar}>
              Cancelar
            </Button>
            <Button disabled={faltaObrigatorio || registrosValidos.length === 0} onClick={confirmarImportacao}>
              Importar {registrosValidos.length} registro(s)
              <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
            </Button>
          </div>
        </>
      )}

      {etapa === 'importando' && (
        <Card className="p-10 flex flex-col items-center gap-4 text-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
          <p className="text-sm text-on-surface-variant">
            Importando {progresso.processados} de {progresso.total} registros…
          </p>
        </Card>
      )}

      {etapa === 'concluido' && resultado && (
        <Card className="p-8 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`material-symbols-outlined text-3xl ${resultado.erros.length === 0 ? 'text-tertiary' : 'text-error'}`}
            >
              {resultado.erros.length === 0 ? 'task_alt' : 'error'}
            </span>
            <h2 className="font-headline font-bold text-lg text-secondary">Importação concluída</h2>
          </div>
          <ul className="text-sm text-on-surface-variant flex flex-col gap-1">
            <li>{resultado.importados} registros importados (inseridos ou atualizados).</li>
            {resultado.ignorados > 0 && (
              <li>{resultado.ignorados} linhas ignoradas (sem Nro.Orçamento nem Nro.Agendamento).</li>
            )}
            {resultado.erros.length > 0 && (
              <li className="text-error">
                {resultado.erros.length} lote(s) com erro:
                <ul className="list-disc list-inside mt-1">
                  {resultado.erros.map((erro, idx) => (
                    <li key={idx}>{erro}</li>
                  ))}
                </ul>
              </li>
            )}
          </ul>
          <div>
            <Button onClick={reiniciar}>Importar outra planilha</Button>
          </div>
        </Card>
      )}
    </div>
  )
}
