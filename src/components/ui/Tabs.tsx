export type TabItem = { id: string; label: string; icon: string }

// Tab bar simples e controlada, estilo pill — reaproveita os mesmos tokens de botão/badge já
// usados no app (rounded-full, gradiente primary_container→primary no ativo) em vez de
// introduzir um padrão visual novo. Usada hoje só em Configurações (Metas / Usuários), mas
// fica em ui/ por não ter nada específico dessa página.
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-primary-container to-primary text-on-primary shadow-md'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
