-- Auditoria de alterações dos representantes + último login + unificação de status final +
-- obrigatoriedade da data de protocolo + realtime do acompanhamento.
--
-- NOTA PARA QUEM FOR APLICAR: rodar via Supabase MCP (`apply_migration`) ou pelo SQL Editor.
-- Depois de aplicar, regenerar `src/lib/database.types.ts`
-- (`mcp__claude_ai_Supabase__generate_typescript_types`).

-- 1) Unificação de "AGENDAMENTO" e "AGENDADO" -----------------------------------------------
-- Os dois rótulos significavam a mesma coisa; "AGENDADO" passa a ser o único valor.
-- Roda ANTES do trigger de log existir, para não poluir a auditoria com a normalização.
update public.report_medico_status
set status_final = 'AGENDADO'
where status_final = 'AGENDAMENTO';

-- 2) Data de protocolo obrigatória para o status "PROTOCOLADO" ------------------------------
-- NOT VALID de propósito: linhas legadas que já estão PROTOCOLADO sem data continuam no banco,
-- mas qualquer INSERT/UPDATE novo passa a ser barrado (a validação também acontece na UI, com
-- mensagem amigável, antes de chegar aqui).
alter table public.report_medico_status
  drop constraint if exists report_medico_status_protocolado_exige_data;

alter table public.report_medico_status
  add constraint report_medico_status_protocolado_exige_data
  check (status_final <> 'PROTOCOLADO' or data_protocolo is not null)
  not valid;

-- 3) Último login por usuário ---------------------------------------------------------------
alter table public.profiles
  add column if not exists ultimo_login timestamptz;

-- 4) Tabela de auditoria --------------------------------------------------------------------
create table if not exists public.atividades_log (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.profiles(id) on delete set null,
  usuario_nome text,
  usuario_role text,
  -- 'status_final' | 'data_protocolo' | 'observacoes' | 'login'
  tipo text not null,
  solicitacao_id uuid references public.solicitacoes_importadas(id) on delete cascade,
  paciente_nome text,
  valor_anterior text,
  valor_novo text,
  criado_em timestamptz not null default now()
);

create index if not exists atividades_log_criado_em_idx on public.atividades_log (criado_em desc);
create index if not exists atividades_log_usuario_idx on public.atividades_log (usuario_id, criado_em desc);
create index if not exists atividades_log_solicitacao_idx on public.atividades_log (solicitacao_id, criado_em desc);

alter table public.atividades_log enable row level security;

-- Admin e gerente comercial enxergam tudo; o representante só o próprio rastro.
drop policy if exists "atividades_log_select" on public.atividades_log;
create policy "atividades_log_select" on public.atividades_log
  for select
  to authenticated
  using (
    usuario_id = auth.uid()
    -- Via as funções SECURITY DEFINER já existentes: consultar `profiles` direto aqui faria a
    -- policy depender da RLS de profiles dentro da RLS desta tabela.
    or public.is_admin()
    or public.get_my_role() = 'gerente_comercial'
  );

-- Escrita só pelas funções SECURITY DEFINER abaixo — nenhuma policy de INSERT/UPDATE/DELETE,
-- então o log é imutável para qualquer cliente.

-- 5) Trigger de auditoria do acompanhamento -------------------------------------------------
create or replace function public.log_report_medico_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_nome text;
  v_role text;
  v_paciente text;
begin
  select nome, role into v_nome, v_role from public.profiles where id = auth.uid();
  select paciente_nome into v_paciente from public.solicitacoes_importadas where id = new.solicitacao_id;

  if tg_op = 'INSERT' then
    if coalesce(new.status_final, '') <> '' then
      insert into public.atividades_log
        (usuario_id, usuario_nome, usuario_role, tipo, solicitacao_id, paciente_nome, valor_anterior, valor_novo)
      values (auth.uid(), v_nome, v_role, 'status_final', new.solicitacao_id, v_paciente, null, new.status_final);
    end if;
    if new.data_protocolo is not null then
      insert into public.atividades_log
        (usuario_id, usuario_nome, usuario_role, tipo, solicitacao_id, paciente_nome, valor_anterior, valor_novo)
      values (auth.uid(), v_nome, v_role, 'data_protocolo', new.solicitacao_id, v_paciente, null, new.data_protocolo::text);
    end if;
    if coalesce(new.observacoes, '') <> '' then
      insert into public.atividades_log
        (usuario_id, usuario_nome, usuario_role, tipo, solicitacao_id, paciente_nome, valor_anterior, valor_novo)
      values (auth.uid(), v_nome, v_role, 'observacoes', new.solicitacao_id, v_paciente, null, new.observacoes);
    end if;
  else
    if new.status_final is distinct from old.status_final then
      insert into public.atividades_log
        (usuario_id, usuario_nome, usuario_role, tipo, solicitacao_id, paciente_nome, valor_anterior, valor_novo)
      values (auth.uid(), v_nome, v_role, 'status_final', new.solicitacao_id, v_paciente, old.status_final, new.status_final);
    end if;
    if new.data_protocolo is distinct from old.data_protocolo then
      insert into public.atividades_log
        (usuario_id, usuario_nome, usuario_role, tipo, solicitacao_id, paciente_nome, valor_anterior, valor_novo)
      values (auth.uid(), v_nome, v_role, 'data_protocolo', new.solicitacao_id, v_paciente,
              old.data_protocolo::text, new.data_protocolo::text);
    end if;
    if new.observacoes is distinct from old.observacoes then
      insert into public.atividades_log
        (usuario_id, usuario_nome, usuario_role, tipo, solicitacao_id, paciente_nome, valor_anterior, valor_novo)
      values (auth.uid(), v_nome, v_role, 'observacoes', new.solicitacao_id, v_paciente, old.observacoes, new.observacoes);
    end if;
  end if;

  return new;
end;
$fn$;

drop trigger if exists log_report_medico_status on public.report_medico_status;
create trigger log_report_medico_status
  after insert or update on public.report_medico_status
  for each row
  execute function public.log_report_medico_status();

-- 6) Registro de login ----------------------------------------------------------------------
-- Chamada pelo cliente logo após autenticar. SECURITY DEFINER porque escreve em atividades_log,
-- que não tem policy de INSERT. Só registra um login novo se o anterior foi há mais de 5 min,
-- para não gerar uma linha a cada refresh de token / aba reaberta.
create or replace function public.registrar_login()
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_nome text;
  v_role text;
  v_anterior timestamptz;
begin
  if auth.uid() is null then
    return;
  end if;

  select nome, role, ultimo_login into v_nome, v_role, v_anterior
  from public.profiles where id = auth.uid();

  update public.profiles set ultimo_login = now() where id = auth.uid();

  if v_anterior is null or v_anterior < now() - interval '5 minutes' then
    insert into public.atividades_log (usuario_id, usuario_nome, usuario_role, tipo, valor_novo)
    values (auth.uid(), v_nome, v_role, 'login', now()::text);
  end if;
end;
$fn$;

grant execute on function public.registrar_login() to authenticated;
-- Sem sessão a função já sai no `auth.uid() is null`, mas não há motivo para ela ficar
-- pendurada em /rest/v1/rpc para o papel anônimo.
revoke execute on function public.registrar_login() from anon;

-- 7) Realtime -------------------------------------------------------------------------------
-- REPLICA IDENTITY FULL é o que faz o payload de UPDATE trazer `old`, usado para mesclar a
-- linha em tela sem refetch.
alter table public.report_medico_status replica identity full;

do $pub$
begin
  begin
    alter publication supabase_realtime add table public.report_medico_status;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.atividades_log;
  exception when duplicate_object then null;
  end;
end
$pub$;
