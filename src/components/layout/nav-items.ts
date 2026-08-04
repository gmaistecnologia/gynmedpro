export type LinkNavItem = { kind: 'link'; to: string; label: string; icon: string }

export type NavGroupItem = { kind: 'group'; label: string; icon: string; items: LinkNavItem[] }

export type NavItem =
  | LinkNavItem
  | NavGroupItem
  | { kind: 'action'; action: 'nova-solicitacao'; label: string; icon: string; disabled?: boolean; disabledReason?: string }

// "Nova Solicitação" está temporariamente desabilitada em todo o app: a captura de
// solicitações passou a ser feita via importação de planilha (ver /importar), não mais
// pelo formulário manual. O botão será reativado numa etapa futura.
export const NOVA_SOLICITACAO_ENABLED = false

export const REPRESENTANTE_ITEMS: NavItem[] = [
  { kind: 'link', to: '/dashboard', label: 'Painel', icon: 'dashboard' },
  {
    kind: 'action',
    action: 'nova-solicitacao',
    label: 'Nova Solicitação',
    icon: 'add_circle',
    disabled: !NOVA_SOLICITACAO_ENABLED,
    disabledReason: 'Em breve',
  },
  { kind: 'link', to: '/solicitacoes', label: 'Histórico', icon: 'history' },
  { kind: 'link', to: '/relatorios/report-medico', label: 'Report Médico', icon: 'medical_information' },
]

export const GESTOR_ITEMS: NavItem[] = [
  { kind: 'link', to: '/aprovacoes', label: 'Aprovações', icon: 'fact_check' },
  { kind: 'link', to: '/solicitacoes', label: 'Solicitações', icon: 'list_alt' },
  {
    kind: 'group',
    label: 'Relatórios',
    icon: 'monitoring',
    items: [
      { kind: 'link', to: '/relatorios', label: 'Painel Comercial', icon: 'insights' },
      { kind: 'link', to: '/relatorios/report-medico', label: 'Report Médico', icon: 'medical_information' },
    ],
  },
]

export const ADMIN_ITEMS: LinkNavItem[] = [
  { kind: 'link', to: '/importar', label: 'Importar Planilha', icon: 'upload_file' },
  { kind: 'link', to: '/configuracoes', label: 'Configurações', icon: 'settings' },
]
