import { Card } from '../ui/Card'
import type { ColunaReportMedicoDef, ColunaReportMedicoKey } from '../../lib/colunasReportMedico'
import type { ColunaPreferenciaItem } from '../../hooks/useColunasPersonalizadas'

// Cada clique (marcar/desmarcar, mover) já aplica e persiste na hora — não existe estado
// "rascunho" separado do salvo, então não há necessidade de um botão "Salvar" distinto de
// "Concluir" (que só fecha o modal).
export function PersonalizarColunasModal({
  aberto,
  colunas,
  preferencia,
  onMudarPreferencia,
  onRestaurarPadrao,
  onFechar,
}: {
  aberto: boolean
  colunas: ColunaReportMedicoDef[]
  preferencia: ColunaPreferenciaItem<ColunaReportMedicoKey>[]
  onMudarPreferencia: (nova: ColunaPreferenciaItem<ColunaReportMedicoKey>[]) => void
  onRestaurarPadrao: () => void
  onFechar: () => void
}) {
  if (!aberto) return null

  const porKey = new Map(colunas.map((c) => [c.key, c]))

  function alternarVisivel(key: ColunaReportMedicoKey) {
    onMudarPreferencia(preferencia.map((item) => (item.key === key ? { ...item, visivel: !item.visivel } : item)))
  }

  function mover(index: number, direcao: -1 | 1) {
    const alvo = index + direcao
    if (alvo < 0 || alvo >= preferencia.length) return
    const nova = [...preferencia]
    const tmp = nova[index]
    nova[index] = nova[alvo]
    nova[alvo] = tmp
    onMudarPreferencia(nova)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
      onClick={onFechar}
    >
      <Card
        className="w-full max-w-md my-8 sm:my-0 flex flex-col max-h-[calc(100vh-4rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10 shrink-0">
          <div>
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Report Médico</p>
            <h2 className="font-headline font-bold text-xl text-secondary">Personalizar colunas</h2>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="p-2 text-outline hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-2">
          <p className="text-xs text-on-surface-variant -mt-1 mb-2">
            Marque as colunas que devem aparecer e use as setas para reordenar. A escolha fica salva neste
            navegador — não precisa repetir a cada acesso.
          </p>
          {preferencia.map((item, index) => {
            const coluna = porKey.get(item.key)
            if (!coluna) return null
            return (
              <div key={item.key} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-container-low">
                <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={coluna.fixa || item.visivel}
                    disabled={coluna.fixa}
                    onChange={() => alternarVisivel(item.key)}
                    className="w-4 h-4 rounded accent-primary shrink-0 disabled:opacity-60"
                  />
                  <span className="text-sm font-semibold text-on-surface truncate">{coluna.label}</span>
                  {coluna.fixa && (
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wide shrink-0">
                      sempre visível
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => mover(index, -1)}
                    aria-label={`Mover ${coluna.label} para cima`}
                    className="p-1 rounded-md text-outline hover:text-primary hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-outline transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">arrow_upward</span>
                  </button>
                  <button
                    type="button"
                    disabled={index === preferencia.length - 1}
                    onClick={() => mover(index, 1)}
                    aria-label={`Mover ${coluna.label} para baixo`}
                    className="p-1 rounded-md text-outline hover:text-primary hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-outline transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">arrow_downward</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/10 shrink-0">
          <button
            type="button"
            onClick={onRestaurarPadrao}
            className="text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Restaurar padrão
          </button>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg bg-primary text-on-primary text-sm font-semibold py-2.5 px-5 hover:bg-primary-container transition-colors"
          >
            Concluir
          </button>
        </div>
      </Card>
    </div>
  )
}
