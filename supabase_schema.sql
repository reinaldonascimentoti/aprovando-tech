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
create table if not exists public.questoes (
  id bigint generated by default as identity primary key,
  codigo text not null unique,
  disciplina text,
  tema text,
  ano integer check (ano is null or ano between 1900 and 2100),
  banca text,
  orgao text,
  prova text,
  enunciado text not null,
  tipo text not null default 'multipla_escolha' check (tipo in ('multipla_escolha', 'certo_errado')),
  alternativa_a text,
  alternativa_b text,
  alternativa_c text,
  alternativa_d text,
  alternativa_e text,
  resposta_correta text check (resposta_correta is null or resposta_correta in ('A', 'B', 'C', 'D', 'E')),
  resposta_boolean boolean,
  grau_dificuldade text check (
    grau_dificuldade is null
    or grau_dificuldade in ('Fácil', 'Médio', 'Difícil')
    or grau_dificuldade ~ '^\\d+(\\.\\d+)?$'
  ),
  imagem_url text,
  explanation text,
  quality_metrics jsonb not null default '{}'::jsonb,
  is_released boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questoes_tipo_resposta_consistente check (
    (
      tipo = 'multipla_escolha'
      and alternativa_a is not null
      and alternativa_b is not null
      and alternativa_c is not null
      and alternativa_d is not null
      and resposta_correta is not null
      and resposta_boolean is null
    )
    or (
      tipo = 'certo_errado'
      and alternativa_a is null
      and alternativa_b is null
      and alternativa_c is null
      and alternativa_d is null
      and alternativa_e is null
      and resposta_correta is null
      and resposta_boolean is not null
    )
  )
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
