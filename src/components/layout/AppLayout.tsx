import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { TopNavBar } from './TopNavBar'
import { SideNavBar } from './SideNavBar'
import { MobileTabBar } from './MobileTabBar'
import { Footer } from './Footer'
import { useSolicitacoesRealtime } from '../../hooks/useSolicitacoesRealtime'
import { NovaSolicitacaoModal } from '../solicitacoes/NovaSolicitacaoModal'

export function AppLayout() {
  useSolicitacoesRealtime()
  const [novaSolicitacaoOpen, setNovaSolicitacaoOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <TopNavBar />

      <div className="flex flex-1 pt-16 min-w-0">
        <SideNavBar onNovaSolicitacao={() => setNovaSolicitacaoOpen(true)} />

        <div className="flex-1 min-w-0 flex flex-col">
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
