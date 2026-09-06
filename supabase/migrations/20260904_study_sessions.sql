-- ================================================================
-- Aprovando Tech - Migration: study_sessions (Banco de Horas Pomodoro)
-- Execute: 2026-09-04
-- ================================================================

-- Tabela principal de sessões de estudo
create table if not exists public.study_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  edital_id    text references public.editais(id) on delete set null,
  disciplina   text,
  duracao_min  integer not null check (duracao_min > 0),
  tipo         text not null default 'pomodoro'
                 check (tipo in ('pomodoro', 'manual')),
  notas        text,
  started_at   timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

-- Índices para performance
create index if not exists ss_user_started_at_idx
  on public.study_sessions (user_id, started_at desc);

create index if not exists ss_user_edital_idx
  on public.study_sessions (user_id, edital_id);

create index if not exists ss_user_tipo_idx
  on public.study_sessions (user_id, tipo);

-- RLS
alter table public.study_sessions enable row level security;

create policy "ss_select_own"
  on public.study_sessions for select
  to authenticated
  using ( (select auth.uid()) = user_id );

create policy "ss_insert_own"
  on public.study_sessions for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "ss_update_own"
  on public.study_sessions for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

create policy "ss_delete_own"
  on public.study_sessions for delete
  to authenticated
  using ( (select auth.uid()) = user_id );

grant select, insert, update, delete on public.study_sessions to authenticated, service_role;

-- RPC: horas de estudo por dia (últimos 7 dias)
create or replace function public.get_weekly_study_hours()
returns table(
  day_date    date,
  total_min   bigint
)
language sql
security invoker
set search_path = ''
as $$
  select
    date_trunc('day', s.started_at at time zone 'America/Sao_Paulo')::date as day_date,
    sum(s.duracao_min) as total_min
  from public.study_sessions s
  where s.user_id = (select auth.uid())
    and s.started_at >= now() - interval '7 days'
  group by 1
  order by 1;
$$;

grant execute on function public.get_weekly_study_hours() to authenticated;

-- RPC: horas de estudo por edital
create or replace function public.get_study_hours_by_edital()
returns table(
  edital_id   text,
  total_min   bigint
)
language sql
security invoker
set search_path = ''
as $$
  select
    s.edital_id,
    sum(s.duracao_min) as total_min
  from public.study_sessions s
  where s.user_id = (select auth.uid())
    and s.edital_id is not null
  group by s.edital_id
  order by total_min desc;
$$;

grant execute on function public.get_study_hours_by_edital() to authenticated;
