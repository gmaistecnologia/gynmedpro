import { useEffect, useMemo, useRef, useState } from 'react'

type Option = { id: string; nome: string }

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Buscar…',
}: {
  options: Option[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
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

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={open ? query : (selected?.nome ?? '')}
          onFocus={() => {
            setOpen(true)
            setQuery('')
          }}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-4 pr-10 py-3 bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
        />
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
          {open ? 'search' : 'expand_more'}
        </span>
      </div>

      {open && (
        <ul className="absolute z-20 mt-2 w-full bg-surface-container-lowest elevation-ambient rounded-lg overflow-hidden max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-on-surface-variant">Nenhum resultado.</li>
          ) : (
            filtered.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.id)
                    setOpen(false)
                    setQuery('')
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-container-high/60 transition-colors ${
                    option.id === value ? 'text-primary font-semibold' : 'text-on-surface'
                  }`}
                >
                  {option.nome}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
