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

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ( (select auth.uid()) = id );

create policy "profiles_select_admin"
  on public.profiles for select
  to authenticated
  using (
    exists (
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
-- 2. TABELA QUESTIONS
-- ---------------------------------------------------------------
create table if not exists public.questions (
  id              text primary key default gen_random_uuid()::text,
  pdf_id          text,
  pdf_name        text not null,
  statement       text not null,
  options         jsonb not null default '[]'::jsonb,
  correct_option  text,
  explanation     text,
  subject         text not null default 'Geral',
  topic           text not null default 'Geral',
  is_released     boolean not null default false,
  quality_metrics jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger questions_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

-- RLS: questions
alter table public.questions enable row level security;

-- Alunos autenticados veem apenas questões liberadas
create policy "questions_select_released"
  on public.questions for select
  to authenticated
  using ( is_released = true );

-- Admins veem e gerenciam todas
create policy "questions_all_admin"
  on public.questions for all
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
