import { useEffect, useMemo, useRef, useState } from 'react'

type Option = { id: string; nome: string }

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione…',
  searchPlaceholder = 'Buscar…',
  invalid = false,
}: {
  options: Option[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
  searchPlaceholder?: string
  invalid?: boolean
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.id === value) ?? null

  const filtered = useMemo(() => {
    if (!query.trim()) return options
    const q = query.toLowerCase()
    return options.filter((o) => o.nome.toLowerCase().includes(q))
  }, [options, query])

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

  function selecionar(id: string) {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-2 bg-surface-container-low border rounded-lg text-sm py-3 px-4 text-left transition-colors ${
          open ? 'border-primary ring-2 ring-primary/10' : invalid ? 'border-error/50' : 'border-outline-variant/20'
        }`}
      >
        <span className={`flex-1 truncate ${selected ? 'text-on-surface' : 'text-on-surface-variant'}`}>
          {selected?.nome ?? placeholder}
        </span>
        <span className="material-symbols-outlined text-outline text-lg shrink-0">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full min-w-[240px] bg-surface-container-lowest elevation-ambient rounded-2xl overflow-hidden">
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
          <ul className="flex flex-col gap-1 max-h-56 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-on-surface-variant text-center">Nenhum resultado.</li>
            ) : (
              filtered.map((option) => {
                const isSelected = option.id === value
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() => selecionar(option.id)}
                      className={`w-full flex items-center justify-between gap-3 text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                        isSelected ? 'bg-primary-container/10 font-bold text-on-surface' : 'font-medium text-on-surface hover:bg-surface-container-high/60'
                      }`}
                    >
                      <span className="truncate">{option.nome}</span>
                      {isSelected && <span className="material-symbols-outlined text-[18px] text-primary shrink-0">check</span>}
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
