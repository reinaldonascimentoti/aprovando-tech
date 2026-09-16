-- Migration: Add user_legislacao_assignments table
-- Permite que usuários adicionem legislações ao seu "Vade Mecum"

create table if not exists public.user_legislacao_assignments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  legislacao_id  uuid not null references public.legislacoes(id) on delete cascade,
  assigned_at    timestamptz not null default now(),
  unique(user_id, legislacao_id)
);

-- RLS
alter table public.user_legislacao_assignments enable row level security;

-- Usuários podem ver as legislações assinaladas a si mesmos (ou admins)
create policy "ula_select_own_or_admin"
  on public.user_legislacao_assignments for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "ula_insert_admin"
  on public.user_legislacao_assignments for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "ula_delete_admin"
  on public.user_legislacao_assignments for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

grant select on public.user_legislacao_assignments to authenticated, service_role;
grant insert, delete on public.user_legislacao_assignments to service_role;

-- -------------------------------------------------------------------------
-- ATUALIZAÇÃO DA POLÍTICA DA TABELA LEGISLACOES
-- -------------------------------------------------------------------------
-- Remove a política restritiva de seleção anterior, que permitia apenas ao criador ver.
drop policy if exists "legislacoes_select_own" on public.legislacoes;

-- Permite que todos os usuários autenticados vejam as legislações 
-- que estão com status 'concluida' ou que sejam do próprio usuário.
create policy "legislacoes_select_public_or_own"
  on public.legislacoes for select
  to authenticated
  using (
    status = 'concluida'
    or (select auth.uid()) = user_id
  );
