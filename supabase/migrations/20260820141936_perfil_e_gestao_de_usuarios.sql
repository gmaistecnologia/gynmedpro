-- Perfil de usuário (nome/foto) + gestão de usuários em Configurações + sinalização de
-- usuário inativo. Ver plano em .claude/plans (sessão de 2026-08-20).
--
-- NOTA PARA QUEM FOR APLICAR: antes de rodar, confira as policies atuais de `profiles` com
-- `list_tables`/introspecção do Supabase MCP — o SELECT já deve ser permissivo hoje (o join
-- `profiles(id, nome)` em AprovacoesPage já funciona sem policy dedicada), então esta migração
-- só mexe em UPDATE (via bloco DO abaixo, que remove qualquer policy de UPDATE existente antes
-- de recriar, não importando o nome dela).

-- 1) Colunas novas em profiles ------------------------------------------------------------
alter table public.profiles
  add column if not exists email text,
  add column if not exists avatar_url text,
  add column if not exists ativo boolean not null default true;

-- Backfill do e-mail a partir de auth.users (profiles não guardava e-mail até aqui).
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and p.email is null;

-- 2) Helper is_admin() + trigger que protege colunas privilegiadas ------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.profiles_guard_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.ativo := old.ativo;
    new.email := old.email;
    new.comissao_padrao := old.comissao_padrao;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_privileged_columns on public.profiles;
create trigger profiles_guard_privileged_columns
  before update on public.profiles
  for each row
  execute function public.profiles_guard_privileged_columns();

-- 3) Policy de UPDATE: dono da linha ou admin. Remove qualquer policy de UPDATE existente
--    (nome desconhecido de antemão) antes de recriar — não mexe em SELECT/INSERT/DELETE.
do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and cmd = 'UPDATE'
  loop
    execute format('drop policy %I on public.profiles', pol.policyname);
  end loop;
end $$;

create policy "profiles_update_self_or_admin" on public.profiles
  for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- 4) Bucket de Storage para avatares -------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_write" on storage.objects;
create policy "avatars_owner_write" on storage.objects
  for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
  for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects
  for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
