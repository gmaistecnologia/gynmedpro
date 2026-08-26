import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { TopNavBar } from './TopNavBar'
import { SideNavBar } from './SideNavBar'
import { MobileTabBar } from './MobileTabBar'
import { Footer } from './Footer'
import { useSolicitacoesRealtime } from '../../hooks/useSolicitacoesRealtime'
import { useSidebarColapsada } from '../../hooks/useSidebarColapsada'
import { NovaSolicitacaoModal } from '../solicitacoes/NovaSolicitacaoModal'

export function AppLayout() {
  useSolicitacoesRealtime()
  const [novaSolicitacaoOpen, setNovaSolicitacaoOpen] = useState(false)
  const { colapsada, alternar } = useSidebarColapsada()

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <TopNavBar />

      <div className="flex flex-1 pt-16 min-w-0">
        <SideNavBar
          onNovaSolicitacao={() => setNovaSolicitacaoOpen(true)}
          colapsada={colapsada}
          onAlternarColapso={alternar}
        />

        <div
          className={`flex-1 min-w-0 flex flex-col transition-[margin] duration-200 ${
            colapsada ? 'md:ml-20' : 'md:ml-64'
          }`}
        >
          <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-8">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>

      <MobileTabBar onNovaSolicitacao={() => setNovaSolicitacaoOpen(true)} />

      <NovaSolicitacaoModal open={novaSolicitacaoOpen} onClose={() => setNovaSolicitacaoOpen(false)} />
    </div>
  )
}
