import { useEffect, useRef, useState } from 'react'

const MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
const MESES_COMPLETOS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

function mesLabel(mesKey: string): string {
  const [ano, mes] = mesKey.split('-').map(Number)
  return `${MESES_COMPLETOS[mes - 1]} de ${ano}`
}

/**
 * Seletor de "mês de referência" (produz 'YYYY-MM', igual a um `<input type="month">`) — mas
 * feito do zero em vez de usar o input nativo. `type="month"` não é suportado de forma
 * consistente entre navegadores (em alguns, sem suporte, ele vira um campo de texto sem
 * placeholder nem seletor algum — nada aparece pra clicar, foi assim que o bug foi reportado).
 * Ao contrário de `MonthReferenceSelect` (que restringe a escolha a uma lista de meses já
 * existentes, usado na navegação do Painel Comercial), aqui qualquer mês/ano é selecionável —
 * é para DEFINIR um mês novo, não para navegar entre os que já têm dado.
 */
export function MonthPickerField({
  value,
  onChange,
  placeholder = 'Selecionar mês',
}: {
  /** 'YYYY-MM', ou '' quando nada foi selecionado ainda. */
  value: string
  onChange: (mesKey: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [anoVisivel, setAnoVisivel] = useState(() => Number(value.slice(0, 4)) || new Date().getFullYear())
  const containerRef = useRef<HTMLDivElement>(null)

  // Deriva o ano visível de `value` quando ele muda por fora (ex.: outro campo do formulário
  // reseta o mês) — comparação em tempo de render, não um efeito reagindo a [value], mesmo
  // padrão já usado no resto do app pra "resetar estado quando outro estado muda" sem o
  // re-render em cascata de um setState síncrono dentro de efeito.
  const [valorAnterior, setValorAnterior] = useState(value)
  if (valorAnterior !== value) {
    setValorAnterior(value)
    if (value) setAnoVisivel(Number(value.slice(0, 4)))
  }

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-3 bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-2.5 px-3 min-w-[190px] focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-colors"
      >
        <span className={`capitalize truncate ${value ? 'font-medium text-on-surface' : 'text-outline'}`}>
          {value ? mesLabel(value) : placeholder}
        </span>
        <span
          className={`material-symbols-outlined text-[18px] shrink-0 ${open ? 'text-primary' : 'text-outline'}`}
        >
          calendar_month
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 left-0 w-64 bg-surface-container-lowest elevation-ambient rounded-2xl overflow-hidden p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setAnoVisivel((a) => a - 1)}
              className="p-1 rounded-md text-outline hover:text-primary hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <span className="text-sm font-bold text-on-surface">{anoVisivel}</span>
            <button
              type="button"
              onClick={() => setAnoVisivel((a) => a + 1)}
              className="p-1 rounded-md text-outline hover:text-primary hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {MESES_ABREV.map((abrev, i) => {
              const mesKey = `${anoVisivel}-${String(i + 1).padStart(2, '0')}`
              const selecionado = mesKey === value
              return (
                <button
                  key={mesKey}
                  type="button"
                  onClick={() => {
                    onChange(mesKey)
                    setOpen(false)
                  }}
                  className={`py-2 rounded-md text-xs font-bold transition-colors ${
                    selecionado
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface hover:bg-surface-container-high'
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
