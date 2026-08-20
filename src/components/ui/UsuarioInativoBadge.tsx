// Mesma paleta "atenção" usada em statusVisual.ts (bg-[#e8990c]/10 text-[#c8770a]) para o
// badge de usuário inativo ficar visualmente consistente com os demais badges de status do
// app, mesmo não fazendo parte do vocabulário de status de solicitação.
export function UsuarioInativoBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border bg-[#e8990c]/10 text-[#c8770a] border-[#e8990c]/30">
      <span className="material-symbols-outlined text-[12px]">person_off</span>
      Inativo
    </span>
  )
}
