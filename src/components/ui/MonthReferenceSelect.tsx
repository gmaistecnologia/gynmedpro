import { useEffect, useMemo, useRef, useState } from 'react'

const MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']

function mesLabel(mesKey: string): string {
  const [ano, mes] = mesKey.split('-')
  return `${MESES_ABREV[Number(mes) - 1]} ${ano.slice(2)}`
}

export function MonthReferenceSelect({
  options,
  value,
  onChange,
}: {
  /** Meses no formato 'YYYY-MM', ordenados ascendentemente. */
  options: string[]
  value: string
  onChange: (mesKey: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [anoVisivel, setAnoVisivel] = useState(() => Number(value.slice(0, 4)) || new Date().getFullYear())
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) setAnoVisivel(Number(value.slice(0, 4)))
  }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const indiceAtual = options.indexOf(value)
  const anterior = indiceAtual > 0 ? options[indiceAtual - 1] : null
  const proximo = indiceAtual >= 0 && indiceAtual < options.length - 1 ? options[indiceAtual + 1] : null

  const anosDisponiveis = useMemo(() => {
    const anos = new Set(options.map((o) => Number(o.slice(0, 4))))
    return Array.from(anos).sort((a, b) => a - b)
  }, [options])

  const anoAnterior = [...anosDisponiveis].reverse().find((a) => a < anoVisivel) ?? null
  const anoProximo = anosDisponiveis.find((a) => a > anoVisivel) ?? null

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-0.5 bg-surface-container-low border border-outline-variant/20 rounded-lg h-[46px] px-1.5">
        <button
          type="button"
          onClick={() => anterior && onChange(anterior)}
          disabled={!anterior}
          className="p-1.5 rounded-md text-outline hover:text-primary hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-outline transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex-1 text-center text-sm font-bold text-on-surface tracking-wide truncate px-1"
        >
          {value ? mesLabel(value) : '—'}
        </button>

        <button
          type="button"
          onClick={() => proximo && onChange(proximo)}
          disabled={!proximo}
          className="p-1.5 rounded-md text-outline hover:text-primary hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-outline transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>

        <span className="w-px h-5 bg-outline-variant/30 shrink-0 mx-0.5" />

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`p-1.5 rounded-md transition-colors shrink-0 ${
            open ? 'text-primary bg-primary/10' : 'text-outline hover:text-primary hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-lg">calendar_month</span>
        </button>
      </div>

      {open && (
        <div className="absolute z-20 mt-2 right-0 w-64 bg-surface-container-lowest elevation-ambient rounded-2xl overflow-hidden p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => anoAnterior && setAnoVisivel(anoAnterior)}
              disabled={!anoAnterior}
              className="p-1 rounded-md text-outline hover:text-primary hover:bg-surface-container-high disabled:opacity-30 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <span className="text-sm font-bold text-on-surface">{anoVisivel}</span>
            <button
              type="button"
              onClick={() => anoProximo && setAnoVisivel(anoProximo)}
              disabled={!anoProximo}
              className="p-1 rounded-md text-outline hover:text-primary hover:bg-surface-container-high disabled:opacity-30 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {MESES_ABREV.map((abrev, i) => {
              const mesKey = `${anoVisivel}-${String(i + 1).padStart(2, '0')}`
              const disponivel = options.includes(mesKey)
              const selecionado = mesKey === value
              return (
                <button
                  key={mesKey}
                  type="button"
                  disabled={!disponivel}
                  onClick={() => {
                    onChange(mesKey)
                    setOpen(false)
                  }}
                  className={`py-2 rounded-md text-xs font-bold transition-colors ${
                    selecionado
                      ? 'bg-primary text-on-primary'
                      : disponivel
                        ? 'text-on-surface hover:bg-surface-container-high'
                        : 'text-outline-variant cursor-not-allowed'
                  }`}
                >
                  {abrev}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
