import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DIAS_SEMANA,
  MESES,
  componentesIso,
  deslocarMes,
  formatarDataBR,
  gradeDoMes,
  hojeIso,
} from '../../lib/dateUtils'

type Grade = ReturnType<typeof gradeDoMes>

function MesCalendario({
  ano,
  mes0,
  grade,
  de,
  ate,
  hoverIso,
  onSelecionarDia,
  onHoverDia,
}: {
  ano: number
  mes0: number
  grade: Grade
  de: string
  ate: string
  hoverIso: string | null
  onSelecionarDia: (iso: string) => void
  onHoverDia: (iso: string | null) => void
}) {
  const hojeIsoValue = hojeIso()
  const fimPreview = ate || (de && hoverIso ? hoverIso : '')
  const inicio = de && fimPreview && fimPreview < de ? fimPreview : de
  const fim = de && fimPreview && fimPreview < de ? de : fimPreview

  return (
    <div className="flex-1 min-w-[240px]">
      <p className="text-center font-headline font-bold text-sm text-on-surface mb-3">
        {MESES[mes0]} {ano}
      </p>
      <div className="grid grid-cols-7 mb-1">
        {DIAS_SEMANA.map((d) => (
          <span key={d} className="text-center text-[10px] font-bold text-outline uppercase py-1">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {grade.map((c) => {
          const ehInicio = c.iso === inicio && Boolean(inicio)
          const ehFim = c.iso === fim && Boolean(fim)
          const noIntervalo = Boolean(inicio) && Boolean(fim) && c.iso > inicio && c.iso < fim
          const ehHoje = c.iso === hojeIsoValue

          return (
            <div key={c.iso} className="relative h-9">
              {(noIntervalo || ehInicio || ehFim) && inicio !== fim && (
                <span
                  className={`absolute inset-y-0 left-0 right-0 bg-primary/10 ${
                    ehInicio ? 'rounded-l-full' : ''
                  } ${ehFim ? 'rounded-r-full' : ''}`}
                />
              )}
              <button
                type="button"
                onClick={() => onSelecionarDia(c.iso)}
                onMouseEnter={() => onHoverDia(c.iso)}
                className={`relative w-9 h-9 mx-auto flex items-center justify-center rounded-full text-sm transition-colors ${
                  ehInicio || ehFim
                    ? 'bg-primary text-on-primary font-bold'
                    : ehHoje
                      ? 'text-primary font-bold border border-primary/40 hover:bg-primary/20'
                      : c.noMes
                        ? 'text-on-surface hover:bg-primary/15'
                        : 'text-outline-variant hover:bg-primary/15'
                }`}
              >
                {c.dia}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Date picker de intervalo: um único campo que abre um calendário de dois
 * meses para selecionar início e fim do período (substitui pares de campos
 * "de" / "até" separados).
 */
export function DateRangeField({
  de,
  ate,
  onChange,
  placeholder = 'Selecionar período',
}: {
  de: string
  ate: string
  onChange: (de: string, ate: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [pendenteDe, setPendenteDe] = useState(de)
  const [pendenteAte, setPendenteAte] = useState(ate)
  const [hoverIso, setHoverIso] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const hoje = componentesIso(hojeIso())
  const base = de && de.length === 10 ? componentesIso(de) : hoje
  const [anoEsquerda, setAnoEsquerda] = useState(base.ano)
  const [mesEsquerda, setMesEsquerda] = useState(base.mes0)

  useEffect(() => {
    if (!open) return
    setPendenteDe(de)
    setPendenteAte(ate)
    setHoverIso(null)
    const b = de && de.length === 10 ? componentesIso(de) : hoje
    setAnoEsquerda(b.ano)
    setMesEsquerda(b.mes0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const direita = deslocarMes(anoEsquerda, mesEsquerda, 1)
  const gradeEsquerda = useMemo(() => gradeDoMes(anoEsquerda, mesEsquerda), [anoEsquerda, mesEsquerda])
  const gradeDireita = useMemo(() => gradeDoMes(direita.ano, direita.mes0), [direita.ano, direita.mes0])

  function selecionarDia(iso: string) {
    if (!pendenteDe || (pendenteDe && pendenteAte)) {
      setPendenteDe(iso)
      setPendenteAte('')
      return
    }
    if (iso < pendenteDe) {
      setPendenteAte(pendenteDe)
      setPendenteDe(iso)
    } else {
      setPendenteAte(iso)
    }
  }

  function aplicar() {
    onChange(pendenteDe, pendenteAte)
    setOpen(false)
  }

  function cancelar() {
    setOpen(false)
  }

  function limpar() {
    setPendenteDe('')
    setPendenteAte('')
  }

  const textoExibido =
    de || ate
      ? `${formatarDataBR(de) || '…'} – ${formatarDataBR(ate) || '…'}`
      : placeholder

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex-1 min-w-0 w-full flex items-center gap-2 bg-surface-container-low border rounded-lg text-sm py-2.5 px-3 h-[46px] text-left transition-colors ${
          open ? 'border-primary ring-2 ring-primary/10' : 'border-outline-variant/20'
        }`}
      >
        <span className="material-symbols-outlined text-outline text-lg shrink-0">date_range</span>
        <span className={`flex-1 truncate ${de || ate ? 'text-on-surface' : 'text-on-surface-variant'}`}>
          {textoExibido}
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 bg-surface-container-lowest elevation-ambient rounded-2xl p-4 w-[300px] sm:w-[560px]">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-0" onMouseLeave={() => setHoverIso(null)}>
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <button
                  type="button"
                  onClick={() => {
                    const prev = deslocarMes(anoEsquerda, mesEsquerda, -1)
                    setAnoEsquerda(prev.ano)
                    setMesEsquerda(prev.mes0)
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-low text-outline hover:text-primary hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                </button>
                <span className="sm:hidden text-xs text-on-surface-variant">Mês inicial</span>
                <span className="w-7 h-7" />
              </div>
              <MesCalendario
                ano={anoEsquerda}
                mes0={mesEsquerda}
                grade={gradeEsquerda}
                de={pendenteDe}
                ate={pendenteAte}
                hoverIso={hoverIso}
                onSelecionarDia={selecionarDia}
                onHoverDia={setHoverIso}
              />
            </div>

            <div className="hidden sm:block w-px bg-outline-variant/15 mx-3" />

            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <span className="w-7 h-7" />
                <span className="sm:hidden text-xs text-on-surface-variant">Mês seguinte</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = deslocarMes(anoEsquerda, mesEsquerda, 1)
                    setAnoEsquerda(next.ano)
                    setMesEsquerda(next.mes0)
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-low text-outline hover:text-primary hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </button>
              </div>
              <MesCalendario
                ano={direita.ano}
                mes0={direita.mes0}
                grade={gradeDireita}
                de={pendenteDe}
                ate={pendenteAte}
                hoverIso={hoverIso}
                onSelecionarDia={selecionarDia}
                onHoverDia={setHoverIso}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-outline-variant/10">
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-surface-container-low rounded-lg px-2.5 py-1.5 text-on-surface font-semibold min-w-[76px] text-center">
                {formatarDataBR(pendenteDe) || 'Início'}
              </span>
              <span className="text-on-surface-variant">–</span>
              <span className="bg-surface-container-low rounded-lg px-2.5 py-1.5 text-on-surface font-semibold min-w-[76px] text-center">
                {formatarDataBR(pendenteAte) || 'Fim'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={limpar}
                className="text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors px-2"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={cancelar}
                className="rounded-lg bg-surface-container-high text-secondary text-xs font-semibold py-2 px-3.5 hover:bg-surface-container-highest transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={aplicar}
                className="rounded-lg bg-primary text-on-primary text-xs font-semibold py-2 px-3.5 hover:bg-primary-container transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
