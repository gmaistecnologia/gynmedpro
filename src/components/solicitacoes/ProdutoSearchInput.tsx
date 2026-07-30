import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Produto } from '../../lib/types'

export function ProdutoSearchInput({ onSelect }: { onSelect: (produto: Produto) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Produto[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('produtos')
        .select('*')
        .or(`nome.ilike.%${query}%,codigo_tuss.ilike.%${query}%`)
        .limit(8)
      setResults(data ?? [])
      setOpen(true)
    }, 250)
    return () => clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
          search
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Buscar por nome ou código TUSS…"
          className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
        />
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-2 w-full bg-surface-container-lowest elevation-ambient rounded-lg overflow-hidden max-h-64 overflow-y-auto">
          {results.map((produto) => (
            <li key={produto.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(produto)
                  setQuery('')
                  setResults([])
                  setOpen(false)
                }}
                className="w-full text-left px-4 py-3 hover:bg-surface-container-high/60 transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-semibold text-on-surface">{produto.nome}</p>
                  <p className="text-xs text-on-surface-variant">TUSS {produto.codigo_tuss ?? '—'}</p>
                </div>
                <span className="material-symbols-outlined text-primary text-lg">add_circle</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
