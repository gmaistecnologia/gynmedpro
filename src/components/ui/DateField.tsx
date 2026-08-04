import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DIAS_SEMANA,
  MESES,
  adicionarDiasIso,
  componentesIso,
  deslocarMes,
  formatarDataBR,
  gradeDoMes,
  hojeIso,
} from '../../lib/dateUtils'

/**
 * Date picker padrão do sistema: campo + calendário em popover (mês único,
 * navegação por seta, atalhos rápidos no rodapé). Não usar `<input type="date">`
 * diretamente em nenhum lugar novo — usar este componente.
 */
export function DateField({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  variant = 'default',
  clearable = true,
  className = '',
}: {
  /** Data pura 'YYYY-MM-DD', ou '' / null quando vazio. */
  value: string | null | undefined
  onChange: (iso: string) => void
  placeholder?: string
  /** 'compact' é usado em edição inline (ex.: linhas de tabela). */
  variant?: 'default' | 'compact'
  clearable?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selecionada = value && value.length === 10 ? componentesIso(value) : null
  const hoje = componentesIso(hojeIso())
  const [anoVisivel, setAnoVisivel] = useState(selecionada?.ano ?? hoje.ano)
  const [mesVisivel, setMesVisivel] = useState(selecionada?.mes0 ?? hoje.mes0)

  useEffect(() => {
    if (!open) return
    if (selecionada) {
      setAnoVisivel(selecionada.ano)
      setMesVisivel(selecionada.mes0)
    } else {
      setAnoVisivel(hoje.ano)
      setMesVisivel(hoje.mes0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const grade = useMemo(() => gradeDoMes(anoVisivel, mesVisivel), [anoVisivel, mesVisivel])
  const hojeIsoValue = hojeIso()

  function irParaMes(delta: number) {
    const { ano, mes0 } = deslocarMes(anoVisivel, mesVisivel, delta)
    setAnoVisivel(ano)
    setMesVisivel(mes0)
  }

  function selecionar(iso: string) {
    onChange(iso)
    setOpen(false)
  }

  const isCompact = variant === 'compact'
  const triggerBase = isCompact
    ? 'bg-transparent text-xs text-on-surface rounded-md px-1.5 py-1 border'
    : 'w-full bg-surface-container-low rounded-lg text-sm py-2.5 px-3 h-[46px] border'
  const triggerBorder = open
    ? 'border-primary ring-2 ring-primary/10'
    : isCompact
      ? 'border-transparent hover:border-outline-variant/30'
      : 'border-outline-variant/20'

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 text-left transition-colors ${triggerBase} ${triggerBorder} ${className}`}
      >
        {!isCompact && (
          <span className="material-symbols-outlined text-outline text-lg shrink-0">calendar_today</span>
        )}
        <span className={`flex-1 truncate ${value ? 'text-on-surface' : 'text-on-surface-variant'}`}>
          {value ? formatarDataBR(value) : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-[300px] bg-surface-container-lowest elevation-ambient rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => irParaMes(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-low text-outline hover:text-primary hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <span className="font-headline font-bold text-sm text-on-surface">
              {MESES[mesVisivel]} {anoVisivel}
            </span>
            <button
              type="button"
              onClick={() => irParaMes(1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-low text-outline hover:text-primary hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DIAS_SEMANA.map((d) => (
              <span key={d} className="text-center text-[10px] font-bold text-outline uppercase py-1">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {grade.map((c) => {
              const estaSelecionado = c.iso === value
              const ehHoje = c.iso === hojeIsoValue
              return (
                <button
                  key={c.iso}
                  type="button"
                  onClick={() => selecionar(c.iso)}
                  className={`w-9 h-9 mx-auto flex items-center justify-center rounded-full text-sm transition-colors ${
                    estaSelecionado
                      ? 'bg-primary text-on-primary font-bold'
                      : ehHoje
                        ? 'text-primary font-bold border border-primary/40 hover:bg-primary/10'
                        : c.noMes
                          ? 'text-on-surface hover:bg-surface-container-high'
                          : 'text-outline-variant hover:bg-surface-container-high'
                  }`}
                >
                  {c.dia}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-outline-variant/10">
            <button
              type="button"
              onClick={() => selecionar(hojeIsoValue)}
              className="rounded-lg bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => selecionar(adicionarDiasIso(hojeIsoValue, -1))}
              className="rounded-lg bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Ontem
            </button>
            {clearable && (
              <button
                type="button"
                onClick={() => selecionar('')}
                className="ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
