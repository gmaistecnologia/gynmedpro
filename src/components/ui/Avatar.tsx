type Size = 'sm' | 'md' | 'lg'

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-24 h-24 text-3xl',
}

const DOT_CLASSES: Record<Size, string> = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-5 h-5',
}

function iniciais(nome?: string | null): string {
  return (nome ?? '').slice(0, 2).toUpperCase()
}

// Avatar compartilhado: foto (quando `avatarUrl` está definido) ou iniciais do nome, como já
// era feito só no TopNavBar. Quando `ativo === false`, desenha um indicador âmbar no canto —
// mesma sinalização usada nas listas (ver UsuarioInativoBadge) — para o usuário inativo se
// destacar também onde só cabe um avatar (ex.: linha de tabela).
export function Avatar({
  nome,
  avatarUrl,
  ativo,
  size = 'md',
}: {
  nome?: string | null
  avatarUrl?: string | null
  ativo?: boolean
  size?: Size
}) {
  return (
    <span className={`relative inline-flex shrink-0 ${SIZE_CLASSES[size]}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={nome ?? 'Avatar'}
          className="w-full h-full rounded-full object-cover bg-surface-container-high"
        />
      ) : (
        <span className="w-full h-full rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold">
          {iniciais(nome)}
        </span>
      )}
      {ativo === false && (
        <span
          title="Usuário inativo"
          className={`absolute -bottom-0.5 -right-0.5 rounded-full bg-[#e8990c] border-2 border-surface-container-lowest ${DOT_CLASSES[size]}`}
        />
      )}
    </span>
  )
}
