export type NavItem =
  | { kind: 'link'; to: string; label: string; icon: string }
  | { kind: 'action'; action: 'nova-solicitacao'; label: string; icon: string }

export const REPRESENTANTE_ITEMS: NavItem[] = [
  { kind: 'link', to: '/dashboard', label: 'Painel', icon: 'dashboard' },
  { kind: 'action', action: 'nova-solicitacao', label: 'Nova Solicitação', icon: 'add_circle' },
  { kind: 'link', to: '/solicitacoes', label: 'Histórico', icon: 'history' },
]

export const GESTOR_ITEMS: NavItem[] = [
  { kind: 'link', to: '/aprovacoes', label: 'Aprovações', icon: 'fact_check' },
  { kind: 'link', to: '/solicitacoes', label: 'Solicitações', icon: 'list_alt' },
  { kind: 'link', to: '/relatorios', label: 'Relatórios', icon: 'monitoring' },
]
