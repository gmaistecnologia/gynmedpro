import { NavLink } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../lib/auth'
import { REPRESENTANTE_ITEMS, GESTOR_ITEMS, ADMIN_ITEMS, PERFIL_ITEM } from './nav-items'

export function SideNavBar({
  onNovaSolicitacao,
  colapsada,
  onAlternarColapso,
}: {
  onNovaSolicitacao: () => void
  colapsada: boolean
  onAlternarColapso: () => void
}) {
  const { profile } = useAuth()
  const items = profile?.role === 'representante' ? REPRESENTANTE_ITEMS : GESTOR_ITEMS

  const navEntries = items.filter((item) => item.kind === 'link' || item.kind === 'group')
  const adminLinkItems = profile?.role === 'admin' ? ADMIN_ITEMS : []
  const actionItem = items.find((item) => item.kind === 'action')

  function handleNovaSolicitacaoClick() {
    if (actionItem?.kind === 'action' && actionItem.disabled) {
      toast.info(`"Nova Solicitação" está temporariamente desabilitada. ${actionItem.disabledReason ?? ''}`.trim())
      return
    }
    onNovaSolicitacao()
  }

  // Colapsada, cada item vira só o ícone centralizado — o rótulo passa a viver no `title`,
  // que é o que o usuário vê ao pousar o mouse.
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl text-sm transition-colors duration-150 ${
      colapsada ? 'justify-center px-0 py-3' : 'px-4 py-3'
    } ${
      isActive
        ? 'bg-surface-container-lowest text-primary-container font-semibold shadow-sm'
        : 'text-on-surface-variant hover:bg-surface-container-high/60 font-medium'
    }`

  return (
    <aside
      className={`hidden md:flex fixed top-16 left-0 h-[calc(100vh-4rem)] shrink-0 flex-col gap-2 bg-surface border-r border-outline-variant/10 pt-4 pb-6 z-30 transition-[width] duration-200 ${
        colapsada ? 'w-20 px-2' : 'w-64 px-4'
      }`}
    >
      <button
        type="button"
        onClick={onAlternarColapso}
        aria-expanded={!colapsada}
        aria-label={colapsada ? 'Expandir menu' : 'Recolher menu'}
        title={colapsada ? 'Expandir menu' : 'Recolher menu'}
        className={`flex items-center gap-2 h-9 rounded-lg text-outline hover:text-primary hover:bg-surface-container-high/60 transition-colors ${
          colapsada ? 'justify-center' : 'justify-end px-2'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">
          {colapsada ? 'menu_open' : 'left_panel_close'}
        </span>
      </button>

      <nav className="flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {navEntries.map((item) =>
          item.kind === 'group' ? (
            <div key={item.label} className="flex flex-col gap-1 mt-2 first:mt-0">
              {colapsada ? (
                <div className="my-1 border-t border-outline-variant/10" />
              ) : (
                <div className="flex items-center gap-3 px-4 py-1 text-[11px] font-bold text-outline uppercase tracking-widest">
                  <span className="material-symbols-outlined text-[18px] shrink-0">{item.icon}</span>
                  {item.label}
                </div>
              )}
              <div className={`flex flex-col gap-1 ${colapsada ? '' : 'pl-4'}`}>
                {item.items.map((sub) => (
                  <NavLink
                    key={sub.to}
                    to={sub.to}
                    end={sub.to === '/relatorios'}
                    className={linkClass}
                    title={`${item.label} · ${sub.label}`}
                  >
                    <span className="material-symbols-outlined text-[18px] shrink-0">{sub.icon}</span>
                    {!colapsada && <span className="truncate">{sub.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/solicitacoes'}
              className={linkClass}
              title={item.label}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
              {!colapsada && <span className="truncate">{item.label}</span>}
            </NavLink>
          ),
        )}

        {adminLinkItems.length > 0 && (
          <>
            <div className="my-2 border-t border-outline-variant/10" />
            {adminLinkItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass} title={item.label}>
                <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
                {!colapsada && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </>
        )}

        {/* "Perfil" é comum a todos os papéis, por isso vem à parte dos itens por papel acima. */}
        <div className="my-2 border-t border-outline-variant/10" />
        <NavLink to={PERFIL_ITEM.to} className={linkClass} title={PERFIL_ITEM.label}>
          <span className="material-symbols-outlined text-[20px] shrink-0">{PERFIL_ITEM.icon}</span>
          {!colapsada && <span className="truncate">{PERFIL_ITEM.label}</span>}
        </NavLink>
      </nav>

      {/* Único ponto de entrada para "Nova Solicitação": botão fixo no rodapé da sidebar, não duplicado na lista de navegação. */}
      {actionItem && (
        <button
          type="button"
          onClick={handleNovaSolicitacaoClick}
          aria-disabled={actionItem.kind === 'action' ? actionItem.disabled : undefined}
          title={
            actionItem.kind === 'action' && actionItem.disabled
              ? actionItem.disabledReason
              : actionItem.label
          }
          className={`mt-auto rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-opacity ${
            colapsada ? 'mx-1 py-3' : 'mx-2 py-3'
          } ${
            actionItem.kind === 'action' && actionItem.disabled
              ? 'bg-surface-container-high text-outline cursor-not-allowed'
              : 'bg-gradient-to-r from-primary-container to-primary text-on-primary shadow-md hover:opacity-90'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">{actionItem.icon}</span>
          {!colapsada && actionItem.label}
        </button>
      )}
    </aside>
  )
}
