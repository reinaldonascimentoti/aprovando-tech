-- ================================================================
-- Aprovando Tech — Agente 3: Planejador de Cronograma de Estudos
-- Tabela: legislacao_planos
-- ================================================================

-- ---------------------------------------------------------------
-- 1. TABELA LEGISLACAO_PLANOS
-- ---------------------------------------------------------------
create table if not exists public.legislacao_planos (
  id                uuid primary key default gen_random_uuid(),
  legislacao_id     uuid not null references public.legislacoes(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,

  -- Metadados do plano gerado pelo Agente 3
  plano_estudo      jsonb default '{}'::jsonb,   -- objetivo, data_inicio, data_prova, premissas, estratégia
  priorizacao       jsonb default '[]'::jsonb,   -- array de artigos priorizados com prioridade/complexidade
  blocos            jsonb default '[]'::jsonb,   -- array de blocos temáticos
  sessoes           jsonb default '[]'::jsonb,   -- array de sessões de estudo
  revisoes          jsonb default '[]'::jsonb,   -- array de revisões espaçadas
  resumo            jsonb default '{}'::jsonb,   -- contadores (total_artigos, total_sessoes, etc.)
  alertas           jsonb default '[]'::jsonb,   -- alertas e avisos gerados pelo agente

  -- Preferências do estudante usadas para gerar este plano
  preferencias      jsonb default '{}'::jsonb,

  -- Controle de processamento
  status            text not null default 'pendente'
                      check (status in ('pendente','processando','concluido','erro')),
  erro              text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Garante apenas um plano ativo por legislação+usuário
  unique (legislacao_id, user_id)
);

-- ---------------------------------------------------------------
-- 2. ÍNDICES
-- ---------------------------------------------------------------
create index idx_legislacao_planos_legislacao_id
  on public.legislacao_planos(legislacao_id);

create index idx_legislacao_planos_user_id
  on public.legislacao_planos(user_id);

-- ---------------------------------------------------------------
-- 3. TRIGGER updated_at
-- ---------------------------------------------------------------
create trigger legislacao_planos_updated_at
  before update on public.legislacao_planos
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------------
alter table public.legislacao_planos enable row level security;

create policy "legislacao_planos_select_own"
  on public.legislacao_planos for select
  to authenticated
  using ( (select auth.uid()) = user_id );

create policy "legislacao_planos_insert_own"
  on public.legislacao_planos for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "legislacao_planos_update_own"
  on public.legislacao_planos for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

create policy "legislacao_planos_delete_own"
  on public.legislacao_planos for delete
  to authenticated
  using ( (select auth.uid()) = user_id );
