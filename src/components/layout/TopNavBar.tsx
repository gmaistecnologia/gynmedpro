import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'

export function TopNavBar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="fixed top-0 left-0 w-full h-16 flex items-center justify-between px-4 sm:px-6 glass-effect z-50 border-b border-outline-variant/10">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-headline font-black text-xl sm:text-2xl tracking-tight text-gynmed-dark shrink-0">
          Gynmed
        </span>
        <span className="w-2 h-2 rounded-full bg-primary-container shrink-0" />
        <span className="ml-2 text-sm font-semibold text-on-surface-variant hidden lg:inline truncate">
          Portal Comercial
        </span>
      </div>
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="text-sm font-bold text-on-surface">{profile?.nome}</span>
          <span className="text-[11px] text-outline uppercase tracking-wide">{profile?.role.replace('_', ' ')}</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-sm shrink-0">
          {profile?.nome?.slice(0, 2).toUpperCase()}
        </div>
        <button
          onClick={handleSignOut}
          className="p-2 text-outline hover:text-error hover:bg-error-container/40 rounded-lg transition-colors shrink-0"
          title="Sair"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </header>
  )
}
