-- Migration: Add user_edital_assignments table
-- Permite que admins enviem editais para usuários específicos

create table if not exists public.user_edital_assignments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  edital_id   text not null references public.editais(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique(user_id, edital_id)
);

-- RLS
alter table public.user_edital_assignments enable row level security;

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

create policy "uea_insert_admin"
  on public.user_edital_assignments for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

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
