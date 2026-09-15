-- ================================================================
-- Aprovando Tech — Agente 3: Analista Estratégico de Concursos
-- Tabela: legislacao_analises_estrategicas
-- ================================================================

-- ---------------------------------------------------------------
-- 1. TABELA LEGISLACAO_ANALISES_ESTRATEGICAS
-- ---------------------------------------------------------------
create table if not exists public.legislacao_analises_estrategicas (
  id                        uuid primary key default gen_random_uuid(),
  legislacao_id             uuid not null references public.legislacoes(id) on delete cascade,
  user_id                   uuid not null references auth.users(id) on delete cascade,

  -- Conteúdo estratégico gerado pelo Agente 3
  meta_global               jsonb default '{"meta_questoes_total": 0, "meta_flashcards_total": 0}'::jsonb,
  analise_concurso          jsonb default '[]'::jsonb,  -- lista com prioridade, potencial, metas de questoes/flashcards por artigo
  comparacoes_recomendadas  jsonb default '[]'::jsonb,  -- comparacoes sugeridas entre artigos

  -- Controle de processamento
  status                    text not null default 'pendente'
                              check (status in ('pendente','processando','concluido','erro')),
  erro                      text,

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  -- Garante um registro consolidado por legislação+usuário
  unique (legislacao_id, user_id)
);

-- ---------------------------------------------------------------
-- 2. ÍNDICES
-- ---------------------------------------------------------------
create index if not exists idx_legislacao_analises_estrategicas_legislacao_id
  on public.legislacao_analises_estrategicas(legislacao_id);

create index if not exists idx_legislacao_analises_estrategicas_user_id
  on public.legislacao_analises_estrategicas(user_id);

-- ---------------------------------------------------------------
-- 3. TRIGGER updated_at
-- ---------------------------------------------------------------
create trigger legislacao_analises_estrategicas_updated_at
  before update on public.legislacao_analises_estrategicas
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------------
alter table public.legislacao_analises_estrategicas enable row level security;

create policy "legislacao_analises_estrategicas_select_own"
  on public.legislacao_analises_estrategicas for select
  to authenticated
  using ( (select auth.uid()) = user_id );

create policy "legislacao_analises_estrategicas_insert_own"
  on public.legislacao_analises_estrategicas for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "legislacao_analises_estrategicas_update_own"
  on public.legislacao_analises_estrategicas for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

create policy "legislacao_analises_estrategicas_delete_own"
  on public.legislacao_analises_estrategicas for delete
  to authenticated
  using ( (select auth.uid()) = user_id );

-- ---------------------------------------------------------------
-- 5. ATUALIZAÇÃO DA TABELA LEGISLACAO_MATERIAIS_CONCURSO (Agente 5)
-- Adiciona colunas para controle de metas e cobertura
-- ---------------------------------------------------------------
alter table public.legislacao_materiais_concurso
  add column if not exists metas jsonb default '{"questoes_planejadas": 0, "questoes_geradas": 0, "questoes_pendentes": 0, "flashcards_planejados": 0, "flashcards_gerados": 0}'::jsonb,
  add column if not exists cobertura jsonb default '{"total_artigos_elegiveis": 0, "artigos_com_material": 0, "artigos_sem_material": 0, "percentual_cobertura": 0}'::jsonb;
