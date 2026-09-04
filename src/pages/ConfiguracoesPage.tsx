import { useState } from 'react'
import { Tabs } from '../components/ui/Tabs'
import { MetasSection } from '../components/configuracoes/MetasSection'
import { UsuariosSection } from '../components/configuracoes/UsuariosSection'
import { CarteiraSection } from '../components/configuracoes/CarteiraSection'

const TABS = [
  { id: 'metas', label: 'Metas', icon: 'trending_up' },
  { id: 'usuarios', label: 'Usuários', icon: 'group' },
  { id: 'carteira', label: 'Carteira', icon: 'medical_services' },
]

export function ConfiguracoesPage() {
  const [tabAtiva, setTabAtiva] = useState('metas')

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline font-bold text-3xl text-secondary tracking-tight">Configurações</h1>
        <div className="mt-4">
          <Tabs tabs={TABS} active={tabAtiva} onChange={setTabAtiva} />
        </div>
      </header>

      {tabAtiva === 'metas' && <MetasSection />}
      {tabAtiva === 'usuarios' && <UsuariosSection />}
      {tabAtiva === 'carteira' && <CarteiraSection />}
    </div>
  )
}
