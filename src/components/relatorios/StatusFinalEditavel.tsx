import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  STATUS_FINAL_OPCOES,
  statusBadgeClasse,
  statusFinalIcone,
  statusIconeClasse,
  statusSelecionadoClasse,
} from '../../lib/reportMedicoStatus'

const LARGURA_MENU = 216
const MARGEM = 8
const ALTURA_MAXIMA = 280

type Posicao = { left: number; width: number; maxHeight: number; top?: number; bottom?: number }

export function StatusFinalEditavel({
  status,
  onChange,
}: {
  status: string
  onChange: (novoStatus: string) => void | Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [posicao, setPosicao] = useState<Posicao | null>(null)
  const botaoRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(e: MouseEvent) {
      const alvo = e.target as Node
      if (botaoRef.current?.contains(alvo)) return
      if (menuRef.current?.contains(alvo)) return
      setOpen(false)
    }
    // Rolar dentro do próprio menu (para ver as opções abaixo) não deve fechá-lo — só rolar a
    // página por trás, que invalidaria a posição calculada em `alternarAbertura`.
    function fecharAoRolarFora(e: Event) {
      if (menuRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    function fechar() {
      setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', fecharAoRolarFora, true)
    window.addEventListener('resize', fechar)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', fecharAoRolarFora, true)
      window.removeEventListener('resize', fechar)
    }
  }, [open])

  function alternarAbertura() {
    if (open) {
      setOpen(false)
      return
    }
    const rect = botaoRef.current?.getBoundingClientRect()
    if (rect) {
      const espacoAbaixo = window.innerHeight - rect.bottom - MARGEM
      const espacoAcima = rect.top - MARGEM
      const left = Math.min(Math.max(rect.left, MARGEM), window.innerWidth - LARGURA_MENU - MARGEM)
      if (espacoAbaixo < 200 && espacoAcima > espacoAbaixo) {
        setPosicao({
          left,
          width: LARGURA_MENU,
          bottom: window.innerHeight - rect.top + 4,
          maxHeight: Math.min(ALTURA_MAXIMA, espacoAcima),
        })
      } else {
        setPosicao({
          left,
          width: LARGURA_MENU,
          top: rect.bottom + 4,
          maxHeight: Math.min(ALTURA_MAXIMA, espacoAbaixo),
        })
      }
    }
    setOpen(true)
  }

  async function selecionar(novoStatus: string) {
    setOpen(false)
    if (novoStatus === status) return
    setSalvando(true)
    try {
      await onChange(novoStatus)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        disabled={salvando}
        onClick={alternarAbertura}
        className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${statusBadgeClasse(status)} ${salvando ? 'opacity-50' : ''}`}
      >
        <span className="material-symbols-outlined text-[13px]">
          {salvando ? 'progress_activity' : statusFinalIcone(status)}
        </span>
        {status}
        <span className="material-symbols-outlined text-[13px]">expand_more</span>
      </button>

      {open &&
        posicao &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              left: posicao.left,
              width: posicao.width,
              maxHeight: posicao.maxHeight,
              top: posicao.top,
              bottom: posicao.bottom,
            }}
            className="z-[60] flex flex-col gap-0.5 bg-surface-container-lowest elevation-ambient rounded-xl overflow-y-auto p-1.5"
          >
            {STATUS_FINAL_OPCOES.map((opcao) => {
              const selecionado = opcao === status
              return (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => selecionar(opcao)}
                  className={`w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    selecionado ? `font-bold text-on-surface ${statusSelecionadoClasse(opcao)}` : 'font-medium text-on-surface hover:bg-surface-container-high/60'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[15px] shrink-0 ${statusIconeClasse(opcao)}`}>
                    {statusFinalIcone(opcao)}
                  </span>
                  <span className="flex-1 truncate">{opcao}</span>
                  {selecionado && <span className="material-symbols-outlined text-[15px] text-primary shrink-0">check</span>}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </>
  )
}
