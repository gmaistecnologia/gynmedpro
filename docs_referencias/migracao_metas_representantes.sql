-- Metas comerciais individuais por representante, mês a mês.
-- Espelha o padrão já usado em metas_comerciais (meta única da empresa),
-- reaproveitando as funções get_my_role() e set_atualizado_em() já existentes no projeto.

create table public.metas_representantes (
  id uuid primary key default gen_random_uuid(),
  representante_nome text not null,
  mes_referencia date not null,
  meta_valor numeric not null check (meta_valor > 0),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (representante_nome, mes_referencia)
);

create index idx_metas_representantes_mes on public.metas_representantes(mes_referencia);
create index idx_metas_representantes_rep on public.metas_representantes(representante_nome);

create trigger trg_metas_representantes_atualizado_em
  before update on public.metas_representantes
  for each row execute function public.set_atualizado_em();

alter table public.metas_representantes enable row level security;

-- Somente gerente/admin acessam esta tabela hoje: é usada apenas na tela de
-- Configurações (admin) e no Painel Comercial (gerente/admin), ambas já
-- restritas por rota. Nenhum representante individual consome esta tabela
-- ainda, então não há necessidade de uma policy de "ver a própria meta".
create policy "metas_representantes_select_gestor" on public.metas_representantes
for select
using (public.get_my_role() in ('gerente_comercial', 'admin'));

create policy "metas_representantes_write_admin_only" on public.metas_representantes
for all
using (public.get_my_role() = 'admin')
with check (public.get_my_role() = 'admin');
