import { NavLink } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { REPRESENTANTE_ITEMS, GESTOR_ITEMS } from './nav-items'

export function MobileTabBar({ onNovaSolicitacao }: { onNovaSolicitacao: () => void }) {
  const { profile } = useAuth()
  const items = profile?.role === 'representante' ? REPRESENTANTE_ITEMS : GESTOR_ITEMS

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium min-w-0 ${
      isActive ? 'text-primary-container' : 'text-on-surface-variant'
    }`

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 glass-effect border-t border-outline-variant/10 flex items-stretch pb-[env(safe-area-inset-bottom)]">
      {items.map((item) =>
        item.kind === 'link' ? (
          <NavLink key={item.to} to={item.to} end={item.to === '/solicitacoes'} className={tabClass}>
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span className="truncate max-w-full px-1">{item.label}</span>
          </NavLink>
        ) : (
          <button
            key={item.action}
            type="button"
            onClick={onNovaSolicitacao}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium min-w-0 text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span className="truncate max-w-full px-1">{item.label}</span>
          </button>
        ),
      )}
    </nav>
  )
}
