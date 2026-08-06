-- ================================================================
-- Migration: user_edital_dismissals
-- Execute no Supabase SQL Editor
-- Permite que usuários "excluam" editais somente da sua visão,
-- sem remover o registro global da tabela editais.
-- ================================================================

create table if not exists public.user_edital_dismissals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  edital_id    text not null references public.editais(id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  unique(user_id, edital_id)
);

-- RLS
alter table public.user_edital_dismissals enable row level security;

-- Usuário só pode ver, criar e deletar seus próprios registros
create policy "ued_select_own"
  on public.user_edital_dismissals for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "ued_insert_own"
  on public.user_edital_dismissals for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "ued_delete_own"
  on public.user_edital_dismissals for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Permissões
grant select, insert, delete on public.user_edital_dismissals to authenticated, service_role;

-- Índice para performance nas queries de filtro
create index if not exists ued_user_id_idx on public.user_edital_dismissals(user_id);
