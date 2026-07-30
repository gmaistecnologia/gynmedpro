import { NavLink } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { REPRESENTANTE_ITEMS, GESTOR_ITEMS } from './nav-items'

export function SideNavBar({ onNovaSolicitacao }: { onNovaSolicitacao: () => void }) {
  const { profile } = useAuth()
  const items = profile?.role === 'representante' ? REPRESENTANTE_ITEMS : GESTOR_ITEMS

  const linkItems = items.filter((item) => item.kind === 'link')
  const actionItem = items.find((item) => item.kind === 'action')

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors duration-150 ${
      isActive
        ? 'bg-surface-container-lowest text-primary-container font-semibold shadow-sm'
        : 'text-on-surface-variant hover:bg-surface-container-high/60 font-medium'
    }`

  return (
    <aside className="hidden md:flex sticky top-16 h-[calc(100vh-4rem)] shrink-0 w-64 flex-col gap-2 bg-surface border-r border-outline-variant/10 pt-8 pb-6 px-4 z-30">
      <nav className="flex flex-col gap-1">
        {linkItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/solicitacoes'} className={linkClass}>
            <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Único ponto de entrada para "Nova Solicitação": botão fixo no rodapé da sidebar, não duplicado na lista de navegação. */}
      {actionItem && (
        <button
          type="button"
          onClick={onNovaSolicitacao}
          className="mt-auto mx-2 bg-gradient-to-r from-primary-container to-primary text-on-primary py-3 rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">{actionItem.icon}</span>
          {actionItem.label}
        </button>
      )}
    </aside>
  )
}
