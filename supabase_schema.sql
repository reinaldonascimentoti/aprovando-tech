-- ================================================================
-- Aprovando Tech - Schema Supabase
-- Execute este arquivo no Supabase SQL Editor
-- ================================================================

-- ---------------------------------------------------------------
-- 1. TABELA PROFILES (extensão de auth.users)
-- ---------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'user' check (role in ('admin', 'user')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Trigger: auto-criar profile quando usuário se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_app_meta_data->>'role', 'user')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger: auto-atualizar updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS: profiles
alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );


-- ---------------------------------------------------------------
-- 3. TABELA EDITAIS
-- ---------------------------------------------------------------
create table if not exists public.editais (
  id           text primary key default gen_random_uuid()::text,
  title        text not null,
  storage_path text,
  uploaded_by  uuid references auth.users(id) on delete set null,
  uploader_name text,
  status       text not null default 'processing' check (status in ('processing', 'completed', 'error')),
  pareto_data  jsonb default '{}'::jsonb,
  cargo        text,
  concurso     text,
  data_prova   text,
  horas_por_dia numeric,
  dias_por_semana numeric,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger editais_updated_at
  before update on public.editais
  for each row execute function public.set_updated_at();

-- RLS: editais
alter table public.editais enable row level security;

-- Todos os autenticados podem ver editais
create policy "editais_select_authenticated"
  on public.editais for select
  to authenticated
  using ( true );

-- Apenas admins podem criar/editar/deletar
create policy "editais_write_admin"
  on public.editais for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

  -- Usuários autenticados podem criar editais
  create policy "editais_write_user"
    on public.editais for insert
    to authenticated
    using (true);

create policy "editais_update_admin"
  on public.editais for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "editais_delete_admin"
  on public.editais for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- ---------------------------------------------------------------
-- 4. TABELA USER_TOPIC_PROGRESS
-- ---------------------------------------------------------------
create table if not exists public.user_topic_progress (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  edital_id  text not null references public.editais(id) on delete cascade,
  topic_id   text not null,
  completed  boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(user_id, edital_id, topic_id)
);

create trigger user_topic_progress_updated_at
  before update on public.user_topic_progress
  for each row execute function public.set_updated_at();

-- RLS: user_topic_progress
alter table public.user_topic_progress enable row level security;

create policy "utp_select_own"
  on public.user_topic_progress for select
  to authenticated
  using ( (select auth.uid()) = user_id );

create policy "utp_insert_own"
  on public.user_topic_progress for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "utp_update_own"
  on public.user_topic_progress for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

create policy "utp_delete_own"
  on public.user_topic_progress for delete
  to authenticated
  using ( (select auth.uid()) = user_id );

-- ---------------------------------------------------------------
-- 5. TABELA QUESTOES (catálogo canônico de questões)
-- ---------------------------------------------------------------
drop table if exists public.questoes cascade;

create table public.questoes (
  id                 bigint generated by default as identity primary key,
  id_qc              text not null unique,
  disciplina         text not null default 'Geral',
  banca              text,
  ano                integer check (ano is null or ano between 1900 and 2100),
  orgao              text,
  cargo              text,
  assunto            text,
  tipo               text not null default 'multipla_escolha' check (tipo in ('multipla_escolha', 'certo_errado')),
  enunciado          text not null,
  alternativas       jsonb not null default '[]'::jsonb,
  resposta_correta   text,
  gabarito_comentado text,
  imagem_url         text,
  imagens            jsonb default '[]'::jsonb,
  quality_metrics    jsonb not null default '{}'::jsonb,
  is_released        boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create schema if not exists private;

create or replace function private.gerar_codigo_questao()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  new.codigo := 'Q' || lpad(new.id::text, 7, '0');
  return new;
end;
$$;

create trigger questoes_gerar_codigo
  before insert on public.questoes
  for each row execute function private.gerar_codigo_questao();

create trigger questoes_updated_at
  before update on public.questoes
  for each row execute function public.set_updated_at();

-- Trigger para garantir que a disciplina sempre seja salva em CAIXA ALTA
create or replace function public.trg_questoes_disciplina_upper()
returns trigger as $$
begin
  if new.disciplina is not null then
    new.disciplina := upper(trim(new.disciplina));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger questoes_disciplina_upper_trigger
  before insert or update of disciplina on public.questoes
  for each row execute function public.trg_questoes_disciplina_upper();

alter table public.questoes enable row level security;

create policy "questoes_select_authenticated"
  on public.questoes for select
  to authenticated
  using (
    is_released = true
    or exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "questoes_insert_admin"
  on public.questoes for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "questoes_update_admin"
  on public.questoes for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "questoes_delete_admin"
  on public.questoes for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

grant select on public.questoes to authenticated, service_role;
grant insert, update, delete on public.questoes to service_role;

create index questoes_released_created_at_idx
  on public.questoes (created_at desc)
  where is_released = true;

create index questoes_disciplina_tema_idx
  on public.questoes (disciplina, tema);

-- ---------------------------------------------------------------
-- 6. TABELA USER_EDITAL_ASSIGNMENTS (Envio de Edital Admin → Usuário)
-- ---------------------------------------------------------------
create table if not exists public.user_edital_assignments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  edital_id   text not null references public.editais(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique(user_id, edital_id)
);

-- RLS: user_edital_assignments
alter table public.user_edital_assignments enable row level security;

-- Usuário pode ver seus próprios assignments
create policy "uea_select_own_or_admin"
  on public.user_edital_assignments for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- Apenas admins podem inserir assignments
create policy "uea_insert_admin"
  on public.user_edital_assignments for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- Apenas admins podem deletar assignments
create policy "uea_delete_admin"
  on public.user_edital_assignments for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

grant select on public.user_edital_assignments to authenticated, service_role;
grant insert, delete on public.user_edital_assignments to service_role;

-- ---------------------------------------------------------------
-- 7. TABELA CONTEUDO_PROGRAMATICO (Mapa Geral de Disciplinas Extraído)
-- ---------------------------------------------------------------
create table if not exists public.conteudo_programatico (
  id           uuid primary key default gen_random_uuid(),
  edital_id    text not null references public.editais(id) on delete cascade,
  cargo        text,
  concurso     text,
  mapa_geral   jsonb default '{}'::jsonb,
  raw_json     jsonb default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique(edital_id)
);

create trigger conteudo_programatico_updated_at
  before update on public.conteudo_programatico
  for each row execute function public.set_updated_at();

-- RLS: conteudo_programatico
alter table public.conteudo_programatico enable row level security;

create policy "cp_select_authenticated"
  on public.conteudo_programatico for select
  to authenticated
  using ( true );

create policy "cp_insert_authenticated"
  on public.conteudo_programatico for insert
  to authenticated
  with check ( true );

create policy "cp_update_authenticated"
  on public.conteudo_programatico for update
  to authenticated
  using ( true );

create policy "cp_delete_admin"
  on public.conteudo_programatico for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

grant select, insert, update, delete on public.conteudo_programatico to authenticated, service_role;

-- ---------------------------------------------------------------
-- 8. TABELA USER_SCHEDULES (Cronograma Personalizado por User + Edital)
-- ---------------------------------------------------------------
-- Cada user pode configurar seu ritmo de estudo de forma independente
-- para cada edital que adicionou ao perfil.
-- horas_por_dia e dias_por_semana NÃO ficam na tabela editais —
-- ficam aqui para respeitar a regra: cronograma é específico do user.
create table if not exists public.user_schedules (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  edital_id       text not null references public.editais(id) on delete cascade,
  horas_por_dia   numeric check (horas_por_dia > 0 and horas_por_dia <= 24),
  dias_por_semana integer check (dias_por_semana > 0 and dias_por_semana <= 7),
  data_prova      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(user_id, edital_id)
);

create trigger user_schedules_updated_at
  before update on public.user_schedules
  for each row execute function public.set_updated_at();

-- RLS: user_schedules
alter table public.user_schedules enable row level security;

-- User vê apenas seus próprios cronogramas
create policy "us_select_own"
  on public.user_schedules for select
  to authenticated
  using ( (select auth.uid()) = user_id );

-- User cria seus próprios cronogramas
create policy "us_insert_own"
  on public.user_schedules for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

-- User atualiza seus próprios cronogramas
create policy "us_update_own"
  on public.user_schedules for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

-- User deleta seus próprios cronogramas
create policy "us_delete_own"
  on public.user_schedules for delete
  to authenticated
  using ( (select auth.uid()) = user_id );

grant select, insert, update, delete on public.user_schedules to authenticated, service_role;

-- ---------------------------------------------------------------
-- 9. FUNÇÃO RPC PÚBLICA PARA ESTATÍSTICAS DA PLATAFORMA
-- ---------------------------------------------------------------
-- Permite que visitantes e a Landing Page consultem números consolidados
-- de forma segura sem expor dados individuais de perfis ou editais.
create or replace function public.get_platform_stats()
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  editais_cnt bigint;
  questoes_cnt bigint;
  candidatos_cnt bigint;
begin
  select count(*) into editais_cnt from public.editais;
  select count(*) into questoes_cnt from public.questoes;
  select count(*) into candidatos_cnt from public.profiles;

  return json_build_object(
    'editaisCount', coalesce(editais_cnt, 0),
    'questoesCount', coalesce(questoes_cnt, 0),
    'candidatosCount', coalesce(candidatos_cnt, 0)
  );
end;
$$;

grant execute on function public.get_platform_stats() to anon, authenticated, service_role;

-- ---------------------------------------------------------------
-- 10. TABELA USER_QUESTION_ANSWERS (Histórico & Estatísticas de Respostas)
-- ---------------------------------------------------------------
create table if not exists public.user_question_answers (
  id           bigint generated by default as identity primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  question_id  text not null,
  disciplina   text not null default 'Geral',
  banca        text,
  ano          integer,
  is_correct   boolean not null,
  answered_at  timestamptz not null default now(),
  unique(user_id, question_id)
);

alter table public.user_question_answers enable row level security;

create policy "uqa_select_own"
  on public.user_question_answers for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "uqa_insert_own"
  on public.user_question_answers for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "uqa_update_own"
  on public.user_question_answers for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.user_question_answers to authenticated, service_role;

create index if not exists uqa_user_disciplina_idx
  on public.user_question_answers (user_id, disciplina);

create index if not exists uqa_user_answered_at_idx
  on public.user_question_answers (user_id, answered_at desc);

-- RPC: Acerto por disciplina para o usuário logado
create or replace function public.get_accuracy_by_disciplina()
returns table(
  disciplina  text,
  total       bigint,
  corretas    bigint,
  pct         numeric
)
language sql
security definer
set search_path = ''
as $$
  select
    a.disciplina,
    count(*)                                          as total,
    count(*) filter (where a.is_correct = true)      as corretas,
    round(
      count(*) filter (where a.is_correct = true)::numeric
      / nullif(count(*), 0) * 100
    , 1)                                             as pct
  from public.user_question_answers a
  where a.user_id = (select auth.uid())
  group by a.disciplina
  order by pct desc, total desc;
$$;

grant execute on function public.get_accuracy_by_disciplina() to authenticated;

