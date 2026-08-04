import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'

export type MultiSelectOption = { value: string; label: string; icon?: string; iconClassName?: string }

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
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-start gap-2 min-h-[46px] bg-surface-container-low border rounded-lg text-sm py-1.5 px-2.5 text-left transition-colors ${
          open ? 'border-primary ring-2 ring-primary/10' : 'border-outline-variant/20'
        }`}
      >
        <span className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5 py-0.5">
          {selecionadas.length === 0 ? (
            <span className="text-on-surface-variant px-1">{placeholder}</span>
          ) : (
            selecionadas.map((o) => (
              <span
                key={o.value}
                className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-md pl-2.5 pr-1.5 py-1 text-xs font-semibold max-w-full"
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

      {open && (
        <div className="absolute z-30 mt-2 w-full min-w-[240px] bg-surface-container-lowest elevation-ambient rounded-2xl overflow-hidden">
          <div className="relative border-b border-outline-variant/10 px-3 py-2.5">
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
          <ul className="flex flex-col gap-0.5 max-h-60 overflow-y-auto p-1.5">
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
                      <span className={`flex-1 truncate ${marcado ? 'font-bold text-on-surface' : 'font-medium text-on-surface'}`}>
                        {o.label}
                      </span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
