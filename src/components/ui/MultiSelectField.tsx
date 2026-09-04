import { createPortal } from 'react-dom'
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'

export type MultiSelectOption = { value: string; label: string; icon?: string; iconClassName?: string }

const MARGEM = 8
// Estimativa de altura do painel (busca + lista) usada só pra decidir se abre pra baixo ou pra
// cima — não precisa ser exata.
const ALTURA_ESTIMADA = 320
// Acima disso, o botão para de listar um chip por selecionado e passa a mostrar só "N
// selecionados" — sem isso, marcar muitos itens (ex.: "selecionar todos os representantes")
// fazia o botão crescer em várias linhas e empurrar o resto do filtro pro lado/baixo.
const LIMITE_CHIPS_VISIVEIS = 3

type Posicao = { left: number; width: number; maxHeight: number; top?: number; bottom?: number }

export function MultiSelectField({
  options,
  selected,
  onChange,
  placeholder = 'Todos',
  searchPlaceholder = 'Buscar…',
}: {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [posicao, setPosicao] = useState<Posicao | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(e: MouseEvent) {
      const alvo = e.target as Node
      if (containerRef.current?.contains(alvo)) return
      if (popoverRef.current?.contains(alvo)) return
      setOpen(false)
      setQuery('')
    }
    // Rolar dentro do próprio painel (lista mais alta que a tela) não deve mexer em nada — só
    // rolar a página por trás, que desalinha a posição calculada na abertura (o painel é
    // portalizado com `position: fixed`, então não acompanha o scroll sozinho). Em vez de fechar
    // o painel nesse caso, recalcula a posição a cada frame de scroll — o painel só deve sumir ao
    // clicar fora dele. `requestAnimationFrame` evita recalcular a cada evento bruto de scroll,
    // que dispara em alta frequência.
    let quadroAgendado = false
    function reposicionarAoRolar(e: Event) {
      if (popoverRef.current?.contains(e.target as Node)) return
      if (quadroAgendado) return
      quadroAgendado = true
      requestAnimationFrame(() => {
        quadroAgendado = false
        const posicaoAtual = calcularPosicao()
        if (posicaoAtual) setPosicao(posicaoAtual)
      })
    }
    function fechar() {
      setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', reposicionarAoRolar, true)
    window.addEventListener('resize', fechar)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', reposicionarAoRolar, true)
      window.removeEventListener('resize', fechar)
    }
  }, [open])

  const selecionadas = useMemo(
    () => options.filter((o) => selected.includes(o.value)),
    [options, selected],
  )

  const filtradas = useMemo(() => {
    if (!query.trim()) return options
    const q = query.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  function alternar(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  function remover(value: string, e: ReactMouseEvent) {
    e.stopPropagation()
    onChange(selected.filter((v) => v !== value))
  }

  function limparTudo(e: ReactMouseEvent) {
    e.stopPropagation()
    onChange([])
  }

  // Portalizado pra `document.body` (mesmo padrão de DateRangeField/StatusFinalEditavel): como
  // `absolute` dentro do próprio filtro, o painel empatava em z-index com qualquer elemento
  // `sticky`/`fixed` mais adiante no DOM, ou ficava deslocado sempre que o botão crescia (ver
  // LIMITE_CHIPS_VISIVEIS acima). Fora da árvore local, com `position: fixed` calculado a
  // partir do botão, os dois problemas somem.
  function calcularPosicao(): Posicao | null {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return null
    const largura = Math.max(rect.width, 240)
    const left = Math.min(Math.max(rect.left, MARGEM), window.innerWidth - largura - MARGEM)
    const espacoAbaixo = window.innerHeight - rect.bottom - MARGEM
    const espacoAcima = rect.top - MARGEM
    if (espacoAbaixo < ALTURA_ESTIMADA && espacoAcima > espacoAbaixo) {
      return { left, width: largura, bottom: window.innerHeight - rect.top + 4, maxHeight: espacoAcima }
    }
    return { left, width: largura, top: rect.bottom + 4, maxHeight: espacoAbaixo }
  }

  function alternarAbertura() {
    if (open) {
      setOpen(false)
      return
    }
    const posicaoInicial = calcularPosicao()
    if (posicaoInicial) setPosicao(posicaoInicial)
    setOpen(true)
  }

  const mostrarResumo = selecionadas.length > LIMITE_CHIPS_VISIVEIS

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={alternarAbertura}
        className={`w-full flex items-center gap-2 h-[46px] bg-surface-container-low border rounded-lg text-sm py-1.5 px-2.5 text-left transition-colors ${
          open ? 'border-primary ring-2 ring-primary/10' : 'border-outline-variant/20'
        }`}
      >
        <span className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
          {selecionadas.length === 0 ? (
            <span className="text-on-surface-variant px-1">{placeholder}</span>
          ) : mostrarResumo ? (
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-md pl-2.5 pr-1.5 py-1 text-xs font-semibold shrink-0">
              <span className="whitespace-nowrap">{selecionadas.length} selecionados</span>
              <span
                role="button"
                onClick={limparTudo}
                className="material-symbols-outlined text-[15px] hover:text-primary-container cursor-pointer shrink-0"
              >
                close
              </span>
            </span>
          ) : (
            selecionadas.map((o) => (
              // Sem `shrink-0`: com 2-3 chips de rótulo longo numa coluna estreita, o flexbox
              // encolhe e trunca cada um graciosamente (via `min-w-0` + `truncate` no rótulo) em
              // vez de a linha inteira cortar um chip por inteiro no meio.
              <span
                key={o.value}
                className="inline-flex items-center gap-1 min-w-0 bg-primary/10 text-primary rounded-md pl-2.5 pr-1.5 py-1 text-xs font-semibold"
              >
                <span className="truncate">{o.label}</span>
                <span
                  role="button"
                  onClick={(e) => remover(o.value, e)}
                  className="material-symbols-outlined text-[15px] hover:text-primary-container cursor-pointer shrink-0"
                >
                  close
                </span>
              </span>
            ))
          )}
        </span>
        <span className="material-symbols-outlined text-outline text-lg leading-none shrink-0">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open &&
        posicao &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              left: posicao.left,
              width: posicao.width,
              maxHeight: posicao.maxHeight,
              top: posicao.top,
              bottom: posicao.bottom,
            }}
            className="z-[60] flex flex-col bg-surface-container-lowest elevation-ambient rounded-2xl overflow-hidden"
          >
            <div className="relative border-b border-outline-variant/10 px-3 py-2.5 shrink-0">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                search
              </span>
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-8 py-1 bg-transparent text-sm focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
            <ul className="flex flex-col gap-0.5 overflow-y-auto p-1.5">
              {filtradas.length === 0 ? (
                <li className="px-4 py-3 text-sm text-on-surface-variant text-center">Nenhum resultado.</li>
              ) : (
                filtradas.map((o) => {
                  const marcado = selected.includes(o.value)
                  return (
                    <li key={o.value}>
                      <button
                        type="button"
                        onClick={() => alternar(o.value)}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                          marcado ? 'bg-primary-container/10' : 'hover:bg-surface-container-high/60'
                        }`}
                      >
                        <span
                          className={`w-[14px] h-[14px] rounded-[3px] border flex items-center justify-center shrink-0 transition-colors ${
                            marcado ? 'bg-primary border-primary' : 'border-outline-variant/50'
                          }`}
                        >
                          {marcado && (
                            <span className="material-symbols-outlined text-[11px] text-on-primary">check</span>
                          )}
                        </span>
                        {o.icon && (
                          <span
                            className={`material-symbols-outlined text-[15px] shrink-0 ${o.iconClassName ?? 'text-on-surface-variant'}`}
                          >
                            {o.icon}
                          </span>
                        )}
                        <span
                          className={`flex-1 truncate ${marcado ? 'font-bold text-on-surface' : 'font-medium text-on-surface'}`}
                        >
                          {o.label}
                        </span>
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  )
}
