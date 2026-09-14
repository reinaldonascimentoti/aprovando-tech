-- ================================================================
-- Aprovando Tech — Progresso de Leitura de Artigos e Cronograma
-- Tabela: legislacao_artigos_lidos
-- ================================================================

create table if not exists public.legislacao_artigos_lidos (
  id uuid primary key default gen_random_uuid(),
  legislacao_id uuid not null references public.legislacoes(id) on delete cascade,
  artigo_id uuid not null references public.legislacao_artigos(id) on delete cascade,
  artigo_numero text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(legislacao_id, artigo_id, user_id)
);

create index if not exists idx_legislacao_artigos_lidos_leg_user 
  on public.legislacao_artigos_lidos(legislacao_id, user_id);

alter table public.legislacao_artigos_lidos enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'legislacao_artigos_lidos' and policyname = 'legislacao_artigos_lidos_select_own'
  ) then
    create policy "legislacao_artigos_lidos_select_own"
      on public.legislacao_artigos_lidos for select
      to authenticated
      using ( (select auth.uid()) = user_id );
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'legislacao_artigos_lidos' and policyname = 'legislacao_artigos_lidos_insert_own'
  ) then
    create policy "legislacao_artigos_lidos_insert_own"
      on public.legislacao_artigos_lidos for insert
      to authenticated
      with check ( (select auth.uid()) = user_id );
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'legislacao_artigos_lidos' and policyname = 'legislacao_artigos_lidos_delete_own'
  ) then
    create policy "legislacao_artigos_lidos_delete_own"
      on public.legislacao_artigos_lidos for delete
      to authenticated
      using ( (select auth.uid()) = user_id );
  end if;
end $$;

-- Coluna artigos_lidos no plano para caching/performance do Agente 3
alter table public.legislacao_planos 
  add column if not exists artigos_lidos jsonb default '[]'::jsonb;
