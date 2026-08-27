-- Corrige a causa raiz encontrada ao investigar o painel vazio do representante Anderson (ver
-- sessão de 2026-08-27): `solicitacoes_importadas.representante_id` só é calculado no momento em
-- que uma linha passa pela importação — nunca se recalcula sozinho depois. Duas consequências:
--
-- 1) Uma linha cujo join falhou uma vez (ex.: o perfil do representante ainda não existia, ou
--    tinha outro nome, no momento daquela importação) fica com representante_id nulo para
--    sempre, a menos que alguém reimporte aquela mesma linha depois ou rode uma reconciliação
--    manual — daí a função `reconciliar_representante_id()` abaixo, exposta como botão em
--    Importar Planilha.
--
-- 2) Pior: um representante pode editar o próprio nome em Perfil (`profiles.nome` não é uma
--    coluna protegida pelo trigger `profiles_guard_privileged_columns` — só role/ativo/email/
--    comissao_padrao são). Se o nome mudar, a PRÓXIMA importação de uma planilha cujo
--    `representante_nome` ainda é o nome antigo deixa de encontrar esse profile no join — e como
--    o `on conflict do update` sempre aplicava `representante_id = excluded.representante_id`
--    sem condição, isso ZERAVA o vínculo de linhas que já estavam corretamente linkadas. Corrige
--    isso trocando por `coalesce(excluded.representante_id, <linha_atual>.representante_id)`:
--    um novo match (inclusive uma reatribuição legítima pra outro representante) sempre vale,
--    mas um match que falhou nunca mais apaga um vínculo que já existia.

create or replace function public.upsert_solicitacoes_importadas(linhas jsonb)
returns jsonb
language plpgsql
set search_path to 'public'
as $function$
declare
  v_processadas int;
  v_ignoradas int;
begin
  if get_my_role() <> 'admin' then
    raise exception 'apenas administradores podem importar solicitações';
  end if;

  create temporary table tmp_import on commit drop as
  select
    nullif(r->>'nro_agendamento', '') as nro_agendamento,
    nullif(r->>'nro_orcamento', '') as nro_orcamento,
    (r->>'data_solicitacao')::date as data_solicitacao,
    (r->>'data_orcamento')::date as data_orcamento,
    (r->>'data_cirurgia')::date as data_cirurgia,
    (r->>'hora_cirurgia')::time as hora_cirurgia,
    (r->>'data_validade')::date as data_validade,
    (r->>'data_aprovacao')::date as data_aprovacao,
    (r->>'data_reprovacao')::date as data_reprovacao,
    r->>'hospital_nome' as hospital_nome,
    r->>'hospital_uf' as hospital_uf,
    r->>'descricao_grupo' as descricao_grupo,
    r->>'descricao_tipo' as descricao_tipo,
    r->>'representante_nome' as representante_nome,
    r->>'medico_nome' as medico_nome,
    r->>'plano_saude_nome' as plano_saude_nome,
    r->>'paciente_nome' as paciente_nome,
    (r->>'valor_orcamento')::numeric as valor_orcamento,
    r->>'situacao' as situacao,
    (r->>'valor_realizado')::numeric as valor_realizado,
    (r->>'importado_por')::uuid as importado_por
  from jsonb_array_elements(linhas) as r;

  -- Linhas com Nro.orcamento: chave de upsert é nro_orcamento (único e confiável).
  insert into public.solicitacoes_importadas (
    nro_agendamento, nro_orcamento, data_solicitacao, data_orcamento, data_cirurgia, hora_cirurgia,
    data_validade, data_aprovacao, data_reprovacao, hospital_nome, hospital_uf, descricao_grupo,
    descricao_tipo, representante_nome, medico_nome, plano_saude_nome, paciente_nome, valor_orcamento,
    situacao, valor_realizado, importado_por, representante_id
  )
  select
    coalesce(t.nro_agendamento, 'S/A'), t.nro_orcamento, t.data_solicitacao, t.data_orcamento, t.data_cirurgia,
    t.hora_cirurgia, t.data_validade, t.data_aprovacao, t.data_reprovacao, t.hospital_nome, t.hospital_uf,
    t.descricao_grupo, t.descricao_tipo, t.representante_nome, t.medico_nome, t.plano_saude_nome,
    t.paciente_nome, t.valor_orcamento, t.situacao, t.valor_realizado, t.importado_por, p.id
  from tmp_import t
  left join public.profiles p
    on p.role = 'representante'
    and lower(regexp_replace(trim(p.nome), '\s+', ' ', 'g')) = lower(regexp_replace(trim(t.representante_nome), '\s+', ' ', 'g'))
  where t.nro_orcamento is not null
  on conflict (nro_orcamento) do update set
    nro_agendamento = excluded.nro_agendamento,
    data_solicitacao = excluded.data_solicitacao,
    data_orcamento = excluded.data_orcamento,
    data_cirurgia = excluded.data_cirurgia,
    hora_cirurgia = excluded.hora_cirurgia,
    data_validade = excluded.data_validade,
    data_aprovacao = excluded.data_aprovacao,
    data_reprovacao = excluded.data_reprovacao,
    hospital_nome = excluded.hospital_nome,
    hospital_uf = excluded.hospital_uf,
    descricao_grupo = excluded.descricao_grupo,
    descricao_tipo = excluded.descricao_tipo,
    representante_nome = excluded.representante_nome,
    medico_nome = excluded.medico_nome,
    plano_saude_nome = excluded.plano_saude_nome,
    paciente_nome = excluded.paciente_nome,
    valor_orcamento = excluded.valor_orcamento,
    situacao = excluded.situacao,
    valor_realizado = excluded.valor_realizado,
    importado_por = excluded.importado_por,
    -- Nunca regride um vínculo já resolvido: um match novo (inclusive reatribuição legítima)
    -- sempre vale; um match que falhou (ex.: representante renomeado no Perfil desde a última
    -- importação) mantém o que já estava lá, em vez de apagar.
    representante_id = coalesce(excluded.representante_id, public.solicitacoes_importadas.representante_id);

  -- Linhas sem Nro.orcamento mas com Nro.Agendamento: usa nro_agendamento como chave,
  -- restrito às linhas que também não têm orçamento (índice parcial).
  insert into public.solicitacoes_importadas (
    nro_agendamento, nro_orcamento, data_solicitacao, data_orcamento, data_cirurgia, hora_cirurgia,
    data_validade, data_aprovacao, data_reprovacao, hospital_nome, hospital_uf, descricao_grupo,
    descricao_tipo, representante_nome, medico_nome, plano_saude_nome, paciente_nome, valor_orcamento,
    situacao, valor_realizado, importado_por, representante_id
  )
  select
    t.nro_agendamento, t.nro_orcamento, t.data_solicitacao, t.data_orcamento, t.data_cirurgia,
    t.hora_cirurgia, t.data_validade, t.data_aprovacao, t.data_reprovacao, t.hospital_nome, t.hospital_uf,
    t.descricao_grupo, t.descricao_tipo, t.representante_nome, t.medico_nome, t.plano_saude_nome,
    t.paciente_nome, t.valor_orcamento, t.situacao, t.valor_realizado, t.importado_por, p.id
  from tmp_import t
  left join public.profiles p
    on p.role = 'representante'
    and lower(regexp_replace(trim(p.nome), '\s+', ' ', 'g')) = lower(regexp_replace(trim(t.representante_nome), '\s+', ' ', 'g'))
  where t.nro_orcamento is null and t.nro_agendamento is not null
  on conflict (nro_agendamento) where nro_orcamento is null do update set
    data_solicitacao = excluded.data_solicitacao,
    data_orcamento = excluded.data_orcamento,
    data_cirurgia = excluded.data_cirurgia,
    hora_cirurgia = excluded.hora_cirurgia,
    data_validade = excluded.data_validade,
    data_aprovacao = excluded.data_aprovacao,
    data_reprovacao = excluded.data_reprovacao,
    hospital_nome = excluded.hospital_nome,
    hospital_uf = excluded.hospital_uf,
    descricao_grupo = excluded.descricao_grupo,
    descricao_tipo = excluded.descricao_tipo,
    representante_nome = excluded.representante_nome,
    medico_nome = excluded.medico_nome,
    plano_saude_nome = excluded.plano_saude_nome,
    paciente_nome = excluded.paciente_nome,
    valor_orcamento = excluded.valor_orcamento,
    situacao = excluded.situacao,
    valor_realizado = excluded.valor_realizado,
    importado_por = excluded.importado_por,
    representante_id = coalesce(excluded.representante_id, public.solicitacoes_importadas.representante_id);

  select
    count(*) filter (where nro_orcamento is not null or nro_agendamento is not null),
    count(*) filter (where nro_orcamento is null and nro_agendamento is null)
  into v_processadas, v_ignoradas
  from tmp_import;

  return jsonb_build_object('processadas', v_processadas, 'ignoradas', v_ignoradas);
end;
$function$;

-- Reconciliação sob demanda: recalcula representante_id pra toda linha ainda órfã cujo
-- representante_nome já bate com um profile hoje (mesma normalização usada na importação). É a
-- mesma correção que resolveu o caso do Anderson em 2026-08-27, exposta como botão em Importar
-- Planilha em vez de depender de alguém rodar SQL manualmente.
-- Sem SECURITY DEFINER, igual a upsert_solicitacoes_importadas: a policy
-- "solicitacoes_importadas_write_admin_only" (ALL, get_my_role() = 'admin') já libera esse
-- UPDATE pra o admin como invoker — não precisa elevar privilégio, só confirmar o papel antes.
create or replace function public.reconciliar_representante_id()
returns integer
language plpgsql
set search_path to 'public'
as $function$
declare
  v_atualizadas int;
begin
  if get_my_role() <> 'admin' then
    raise exception 'apenas administradores podem reconciliar vínculos';
  end if;

  update public.solicitacoes_importadas s
  set representante_id = p.id
  from public.profiles p
  where s.representante_id is null
    and s.representante_nome is not null
    and p.role = 'representante'
    and lower(regexp_replace(trim(p.nome), '\s+', ' ', 'g')) = lower(regexp_replace(trim(s.representante_nome), '\s+', ' ', 'g'));

  get diagnostics v_atualizadas = row_count;
  return v_atualizadas;
end;
$function$;

grant execute on function public.reconciliar_representante_id() to authenticated;
revoke execute on function public.reconciliar_representante_id() from anon;
